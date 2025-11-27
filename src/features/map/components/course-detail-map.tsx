"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import * as turf from "@turf/turf";
import { analyzeTerrain, cameraParams, offset } from "@/features/map/hooks/use-drone-camera";
import {
  Route,
  Mountain,
  Timer,
  Play,
  Pause,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  MapPin,
  ZoomIn,
  ZoomOut,
  Compass,
  Trophy,
  Activity,
  Clock,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RippleEffect } from "@/shared/components/ui/ripple-effect";
import { CommentAddModal } from "./comment-add-modal";
import { useLongPress } from "@/shared/hooks/use-long-press";
import { isWithinGPXRange } from "@/shared/lib/utils/gpx-distance";

interface Course {
  id: string;
  title: string;
  description: string;
  start_latitude: number;
  start_longitude: number;
  distance_km: number;
  difficulty: "easy" | "medium" | "hard";
  avg_time_min: number;
  nearest_station?: string;
  gpx_coordinates?: string; // JSON 문자열로 저장된 좌표 배열
  elevation_gain?: number;
  is_active: boolean;
  created_at: string;
}

interface CourseDetailMapProps {
  courseId: string;
  className?: string;
  showCompactHeader?: boolean;
}

export function CourseDetailMap({
  courseId,
  className = "",
  showCompactHeader = false,
}: CourseDetailMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const animationRef = useRef<number | NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);

  // 새로운 애니메이션 상태들
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<number[][]>([]);
  const [performanceMode] = useState<"eco">("eco"); // 💰 절약모드 고정

  // TrailMap.tsx에서 가져온 추가 상태들
  const [is3D, setIs3D] = useState(true);
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentElevation, setCurrentElevation] = useState(0);

  // 댓글 추가 관련 상태
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentPosition, setCommentPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showRipple, setShowRipple] = useState(false);
  const [ripplePosition, setRipplePosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Mapbox 토큰
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  // 길게 누르기 핸들러
  const handleLongPress = useCallback(
    (x: number, y: number) => {
      if (!map.current || routeCoordinates.length < 2) {
        return;
      }

      // 화면 좌표를 지도 좌표로 변환
      const point = map.current.unproject([x, y]);
      const clickCoordinates: [number, number] = [point.lng, point.lat];

      // GPX 노선 50m 범위 내 체크
      const gpxPoints = routeCoordinates.map((coord) => ({
        lat: coord[1],
        lng: coord[0],
      }));

      if (isWithinGPXRange(clickCoordinates, gpxPoints, 50)) {
        // Ripple 효과 표시
        setRipplePosition({ x, y });
        setShowRipple(true);

        // 댓글 모달 표시
        setTimeout(() => {
          setCommentPosition({ x, y });
          setShowCommentModal(true);
        }, 300);
      } else {
        // 노선 범위 외 클릭 시 토스트 메시지 (선택사항)
      }
    },
    [routeCoordinates],
  );

  // 길게 누르기 훅 사용
  const longPressHandlers = useLongPress({
    onLongPress: handleLongPress,
    delay: 800, // 800ms 길게 누르기
  });

  // 댓글 제출 핸들러
  const handleCommentSubmit = useCallback(
    async (comment: string) => {
      if (!commentPosition || !map.current) return;

      setIsSubmittingComment(true);

      try {
        // 화면 좌표를 지도 좌표로 변환
        const point = map.current.unproject([
          commentPosition.x,
          commentPosition.y,
        ]);

        // 실제 댓글 저장 API 호출
        const response = await fetch("/api/course-comments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            course_id: courseId,
            message: comment,
            latitude: point.lat,
            longitude: point.lng,
            // 추가 필요한 필드들
          }),
        });

        if (response.ok) {
          // 필요시 댓글 목록 새로고침
        } else {
          console.error("댓글 추가 실패:", response.status);
        }
      } catch (error) {
        console.error("댓글 추가 오류:", error);
      } finally {
        setIsSubmittingComment(false);
      }
    },
    [commentPosition, courseId],
  );

  const loadCourseRoute = useCallback(async () => {
    if (!map.current) return;

    try {
      // 코스 데이터 가져오기
      const { data: courseData, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (error) throw error;

      if (!courseData) {
        setLoading(false);
        return;
      }

      setCourse(courseData);

      let coordinates: number[][];

      // gpx_coordinates가 있으면 사용, 없으면 시작점만 표시
      if (courseData.gpx_coordinates) {
        try {
          const gpxCoords = JSON.parse(courseData.gpx_coordinates);
          coordinates = gpxCoords.map((coord: { lat: number; lng: number }) => [
            coord.lng,
            coord.lat,
          ]);
        } catch (parseError) {
          console.error("GPX 좌표 파싱 오류:", parseError);
          // 파싱 실패 시 시작점만 사용
          coordinates = [
            [courseData.start_longitude, courseData.start_latitude],
          ];
        }
      } else {
        // GPX 데이터가 없으면 시작점만 표시
        coordinates = [[courseData.start_longitude, courseData.start_latitude]];
      }

      // 애니메이션을 위해 좌표 저장
      setRouteCoordinates(coordinates);

      // 지도 중심을 경로에 맞춤 (참고 코드 스타일)
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12.85,
        duration: 1000, // 부드러운 애니메이션
      });

      // 기존 소스와 레이어 제거
      if (map.current.getSource("course-route")) {
        if (map.current.getLayer("course-line")) {
          map.current.removeLayer("course-line");
        }
        if (map.current.getLayer("course-line-outline")) {
          map.current.removeLayer("course-line-outline");
        }
        map.current.removeSource("course-route");
      }

      // 경로 소스 추가
      map.current.addSource("course-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
        },
        lineMetrics: true,
      });

      // 경로 라인 외곽선 (흰색)
      map.current.addLayer({
        id: "course-line-outline",
        type: "line",
        source: "course-route",
        paint: {
          "line-color": "#ffffff",
          "line-width": 8,
          "line-opacity": 0.6,
        },
      });

      // 경로 라인 (오렌지색)
      map.current.addLayer({
        id: "course-line",
        type: "line",
        source: "course-route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-width": 6,
          "line-gradient": [
            "interpolate",
            ["linear"],
            ["line-progress"],
            0,
            "hsla(24, 100%, 60%, 0.0)", // 투명 →
            0.1,
            "hsla(24, 100%, 60%, 0.8)",
            0.3,
            "hsla(24, 100%, 60%, 1.0)",
            1,
            "hsla(24, 100%, 60%, 1.0)",
          ],
        },
      });

      // 시작점 마커 (초록색) - RealMapView 스타일 사용
      new mapboxgl.Marker({ color: "#22c55e" })
        .setLngLat(coordinates[0] as [number, number])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            '<div class="font-semibold">🏃‍♂️ 시작점</div>',
          ),
        )
        .addTo(map.current);

      // 끝점 마커 (빨간색) - 시작점과 다른 경우에만 표시
      const lastPoint = coordinates[coordinates.length - 1];
      const startPoint = coordinates[0];

      // 시작점과 끝점이 다른 경우에만 끝점 마커 표시
      if (lastPoint[0] !== startPoint[0] || lastPoint[1] !== startPoint[1]) {
        new mapboxgl.Marker({ color: "#ef4444" })
          .setLngLat(lastPoint as [number, number])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              '<div class="font-semibold">🏁 도착점</div>',
            ),
          )
          .addTo(map.current);
      }

      // ✅ 경로 범위로 카메라 제한 (헛 타일 방지 - 트래픽 ↓40%)
      if (coordinates.length > 1) {
        const lngs = coordinates.map((coord) => coord[0]);
        const lats = coordinates.map((coord) => coord[1]);
        const minLng = Math.min(...lngs) - 0.01;
        const maxLng = Math.max(...lngs) + 0.01;
        const minLat = Math.min(...lats) - 0.01;
        const maxLat = Math.max(...lats) + 0.01;

        map.current.setMaxBounds([
          [minLng, minLat], // 남서쪽 모서리
          [maxLng, maxLat], // 북동쪽 모서리
        ]);
      }

      setLoading(false);
    } catch (error) {
      console.error("코스 경로 로드 실패:", error);
      setLoading(false);
    }
  }, [courseId]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-gray-100 text-gray-800";
      case "medium":
        return "bg-gray-200 text-gray-800";
      case "hard":
        return "bg-gray-300 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "쉬움";
      case "medium":
        return "보통";
      case "hard":
        return "어려움";
      default:
        return difficulty;
    }
  };

  // 3D 토글 기능
  const toggle3D = useCallback(() => {
    setIs3D((prev) => {
      const new3D = !prev;
      if (map.current) {
        if (new3D) {
          // 3D 모드로 전환
          map.current.easeTo({
            pitch: 60,
            bearing: -15,
            duration: 1000,
          });
          if (map.current.getSource("mapbox-dem")) {
            map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
          }
        } else {
          // 2D 모드로 전환
          map.current.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 1000,
          });
          map.current.setTerrain(null);
        }
      }
      return new3D;
    });
  }, []);

  // 지도 줌 컨트롤
  const zoomIn = useCallback(() => {
    if (map.current) {
      map.current.zoomIn();
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (map.current) {
      map.current.zoomOut();
    }
  }, []);

  const resetNorth = useCallback(() => {
    if (map.current) {
      map.current.easeTo({
        bearing: 0,
        duration: 500,
      });
    }
  }, []);

  // 시간 포맷 함수
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      if (minutes > 0) {
        return `${hours}시간 ${minutes}분`;
      }
      return `${hours}시간`;
    } else if (minutes > 0) {
      return `${minutes}분`;
    }
    return `0분`;
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Mapbox 토큰 설정
    mapboxgl.accessToken = mapboxToken;

    // 지도 초기화 (저비용 최적화 적용 🚀) - 라이트 스타일만 사용
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11", // 라이트 스타일 고정
      center: [126.9185, 37.6361], // 기본 중심점
      zoom: 14,
      maxZoom: 12.85, // map 페이지와 동일한 최대 줌
      minZoom: 10, // map 페이지와 동일한 최소 줌
      pitch: 0,
      bearing: 0,
      // ✅ 저비용 최적화 설정
      renderWorldCopies: false, // 동일 타일 반복 차단
    });

    // 지도 컨트롤 추가
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    map.current.on("load", () => {
      // 3D 지형 활성화 (강화된 최적화 설정)
      map.current!.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 256, // 512 → 256으로 줄여서 데이터 사용량 감소
        maxzoom: 11, // 12 → 11로 더 낮춰서 트래픽 ↓60%
      });

      map.current!.setTerrain({ source: "mapbox-dem", exaggeration: 0.5 }); // 매우 자연스러운 고도

      // 자연스러운 하늘 레이어
      map.current!.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 90.0], // 태양 위치 조정
          "sky-atmosphere-sun-intensity": 8, // 더 은은하게
        },
      });

      loadCourseRoute();
    });

    return () => {
      map.current?.remove();
    };
  }, [courseId, mapboxToken, loadCourseRoute]);

  // 지도 스타일 고정 (라이트 모드만 사용)

  // 지도 크기 변경 시 resize 호출
  useEffect(() => {
    if (map.current) {
      // 약간의 지연을 두고 resize 호출
      const timer = setTimeout(() => {
        map.current?.resize();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [className]);

  // wholsee-dev 방식: 노선 그리기 → 드론 비행
  const drawRouteThenFly = () => {
    if (!map.current || routeCoordinates.length === 0) {
      return;
    }

    // GeoJSON Feature 생성
    const fullFeature: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: routeCoordinates,
      },
      properties: {},
    };

    // 전체 경로 길이 계산
    const routeLenKm = turf.length(fullFeature, { units: "kilometers" });

    // ─── 1) 경로 Source를 두 개로 분리 ───
    // 회색 배경 라인 (전체 경로)
    if (map.current.getSource("route-full")) {
      (map.current.getSource("route-full") as mapboxgl.GeoJSONSource).setData(
        fullFeature,
      );
    } else {
      map.current.addSource("route-full", {
        type: "geojson",
        data: fullFeature,
      });
    }

    // 그려질 주황색 라인 (빈 상태로 시작) - lineMetrics 활성화!
    const emptyLine: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
      properties: {},
    };

    if (map.current.getSource("route-draw")) {
      (map.current.getSource("route-draw") as mapboxgl.GeoJSONSource).setData(
        emptyLine,
      );
    } else {
      map.current.addSource("route-draw", {
        type: "geojson",
        data: emptyLine,
        lineMetrics: true, // line-gradient를 위해 필수!
      });
    }

    // 레이어 추가 (회색 배경 + 주황색 전경)
    if (!map.current.getLayer("route-bg")) {
      map.current.addLayer({
        id: "route-bg",
        type: "line",
        source: "route-full",
        paint: {
          "line-color": "#cccccc",
          "line-width": 4,
          "line-opacity": 0.6,
        },
      });
    }

    if (!map.current.getLayer("route-fg")) {
      map.current.addLayer({
        id: "route-fg",
        type: "line",
        source: "route-draw",
        paint: {
          "line-width": 6,
          "line-gradient": [
            "interpolate",
            ["linear"],
            ["line-progress"],
            0,
            "hsla(24, 100%, 60%, 0.0)",
            0.1,
            "hsla(24, 100%, 60%, 0.8)",
            0.3,
            "hsla(24, 100%, 60%, 1.0)",
            1,
            "hsla(24, 100%, 60%, 1.0)",
          ],
        },
      });
    }

    // ─── 2) 라인 그리기 애니메이션 (3초) ───
    const drawDuration = 3000; // 3초
    let progressKm = 0;
    let last = performance.now();

    const draw = (now: number) => {
      if (!map.current) {
        return;
      }

      // isAnimating 체크를 제거하여 중단 방지

      const dt = (now - last) / 1000;
      last = now;
      progressKm += (routeLenKm / (drawDuration / 1000)) * dt; // km/s

      // 새 부분 라인 계산
      const partial = turf.lineSliceAlong(
        fullFeature,
        0,
        Math.min(progressKm, routeLenKm),
        {
          units: "kilometers",
        },
      ) as GeoJSON.Feature<GeoJSON.LineString>;

      (map.current.getSource("route-draw") as mapboxgl.GeoJSONSource).setData(
        partial,
      );

      // 진행률 업데이트 (0-50%는 노선 그리기)
      const drawProgress = Math.min(progressKm / routeLenKm, 1) * 50;
      setAnimationProgress(drawProgress);

      if (progressKm < routeLenKm) {
        animationRef.current = requestAnimationFrame(draw);
      } else {
        // 라인 그리기 완료 → 드론 비행 시작
        setTimeout(() => {
          startDroneFlight(fullFeature, routeLenKm);
        }, 500);
      }
    };

    // 시작점으로 카메라 이동 후 그리기 시작
    const startCoord = routeCoordinates[0];
    map.current.flyTo({
      center: [startCoord[0], startCoord[1]],
      zoom: 15,
      pitch: 0,
      bearing: 0,
      duration: 1500,
      essential: true,
    });

    // 1.5초 후 노선 그리기 시작
    setTimeout(() => {
      animationRef.current = requestAnimationFrame(draw);
    }, 1500);
  };

  // ─── 3) 드론 비행 애니메이션 ───
  const startDroneFlight = (
    lineFeature: GeoJSON.Feature<GeoJSON.LineString>,
    routeLength: number,
  ) => {
    // 3D 지형만 활성화 (라이트 스타일 유지)
    if (map.current && map.current.getSource("mapbox-dem")) {
      map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
    }

    // 주황색 라인 숨기기 (회색 라인만 남김)
    if (map.current && map.current.getLayer("route-fg")) {
      map.current.setLayoutProperty("route-fg", "visibility", "none");
    }

    // 드론 비행 애니메이션
    const speedKmh = 300; // 빠른 속도
    const speedKmPerSecond = speedKmh / 3600;
    let progressKm = 0;
    let lastTime = performance.now();

    const flyAnimate = (currentTime: number) => {
      if (!animationRef.current || !map.current) {
        return;
      }

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      progressKm += speedKmPerSecond * deltaTime;

      if (progressKm >= routeLength) {
        setIsAnimating(false);
        setAnimationProgress(100);

        // 완주 이펙트 표시
        setTimeout(() => {
          setShowCompletionEffect(true);

          // 3초 후 이펙트 숨기기
          setTimeout(() => {
            setShowCompletionEffect(false);
          }, 3000);
        }, 500);

        // 지형 비활성화
        if (map.current.getSource("mapbox-dem")) {
          map.current.setTerrain(null);
        }
        return;
      }

      // 현재 위치 계산
      const currentPoint = turf.along(lineFeature, progressKm, {
        units: "kilometers",
      });
      const currentCoords = currentPoint.geometry.coordinates as [
        number,
        number,
      ];

      const nextProgressKm = Math.min(progressKm + 0.1, routeLength);
      const nextPoint = turf.along(lineFeature, nextProgressKm, {
        units: "kilometers",
      });
      const bearing = turf.bearing(currentPoint, nextPoint);

      // 지형 분석 기반 카메라
      const totalPoints = routeCoordinates.length;
      const idx = Math.floor((progressKm / routeLength) * (totalPoints - 1));
      const pointsWithElevation = routeCoordinates.map((coord) => ({
        lat: coord[1],
        lon: coord[0],
        ele: coord[2] || 0,
      }));

      const terrain = analyzeTerrain(pointsWithElevation, idx, 15);
      const currentElevation = pointsWithElevation[idx]?.ele || 0;
      const cam = cameraParams(terrain, currentElevation);

      // look-ahead offset
      const [cx, cy] = offset(
        currentCoords[1],
        currentCoords[0],
        bearing,
        cam.dist,
      );

      map.current.easeTo({
        center: [cx, cy],
        zoom: cam.zoom,
        pitch: cam.pitch,
        bearing: bearing - 10,
        duration: 0,
        essential: true,
      });

      // 진행률 업데이트 (50-100%는 드론 비행)
      const flightProgress = 50 + (progressKm / routeLength) * 50;
      setAnimationProgress(flightProgress);

      // 실시간 정보 업데이트
      setCurrentDistance(progressKm);
      const currentElevationValue = pointsWithElevation[idx]?.ele || 0;
      setCurrentElevation(currentElevationValue);

      // 예상 소요 시간 계산 (드론 비행이므로 실제 러닝 시간과 다름)
      if (course) {
        const totalEstimatedSeconds = course.avg_time_min * 60;
        const elapsedSeconds =
          totalEstimatedSeconds * (progressKm / routeLength);
        setElapsedTime(elapsedSeconds);
      }

      // 💰 성능 모드에 따른 프레임레이트 조절
      const frameDelay = performanceMode === "eco" ? 66 : 33; // eco: 15fps, normal: 30fps
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(flyAnimate);
      }, frameDelay);
    };

    // 비행 시작
    setTimeout(() => {
      animationRef.current = requestAnimationFrame(flyAnimate);
    }, 1000);
  };

  // 애니메이션 시작/정지 (wholsee-dev 방식)
  const toggleAnimation = () => {
    if (isAnimating) {
      // 애니메이션 정지
      if (animationRef.current) {
        if (typeof animationRef.current === "number") {
          cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = null;
      }
      setIsAnimating(false);
      setAnimationProgress(0);

      // 지형 초기화
      if (map.current && map.current.getSource("mapbox-dem")) {
        map.current.setTerrain(null);
      }
    } else {
      // 애니메이션 시작
      setIsAnimating(true);
      setAnimationProgress(0);

      // 즉시 시작 (복잡한 setTimeout 제거)
      drawRouteThenFly();
    }
  };

  // 애니메이션 리셋
  const resetAnimation = () => {
    if (animationRef.current) {
      if (typeof animationRef.current === "number") {
        cancelAnimationFrame(animationRef.current);
      } else {
        clearTimeout(animationRef.current);
      }
      animationRef.current = null;
    }
    setIsAnimating(false);
    setAnimationProgress(0);

    // 지형 비활성화
    if (map.current) {
      if (map.current.getSource("mapbox-dem")) {
        map.current.setTerrain(null);
      }
    }

    // 지도를 전체 경로가 보이도록 리셋
    if (map.current && routeCoordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      routeCoordinates.forEach((coord) =>
        bounds.extend(coord as [number, number]),
      );
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12.85,
        duration: 1000,
        pitch: 0, // 기본 뷰로 돌아가기
      });
    }
  };

  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  if (!mapboxToken) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-600">지도를 표시할 수 없습니다.</p>
        <p className="text-sm text-gray-500 mt-1">
          Mapbox 토큰이 설정되지 않았습니다.
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* 간결한 코스 헤더 */}
      {showCompactHeader && course && (
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {course.title}
              </h3>
              <div>{course.description}</div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Route className="w-4 h-4" />
                  <span>{course.distance_km} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mountain className="w-4 h-4" />
                  <span>+{course.elevation_gain || 448}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="w-4 h-4" />
                  <span>
                    {Math.floor(course.avg_time_min / 60)}시간{" "}
                    {course.avg_time_min % 60}분
                  </span>
                </div>
                <div
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 ${getDifficultyColor(
                    course.difficulty,
                  )}`}
                >
                  {getDifficultyText(course.difficulty)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 지도 컨테이너 */}
      <div className="relative">
        <div
          ref={mapContainer}
          className="w-full h-full rounded-lg overflow-hidden"
          style={{ minHeight: "400px" }}
          {...longPressHandlers}
        />

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">지도 로딩 중...</p>
            </div>
          </div>
        )}

        {/* 지도 컨트롤 */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {/* 경로 따라가기 컨트롤 */}
          {routeCoordinates.length > 1 && (
            <div className="bg-white rounded-md shadow-md overflow-hidden">
              <div className="flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAnimation}
                  className="rounded-none border-0 text-xs px-3 py-1 h-7"
                  disabled={routeCoordinates.length < 2}
                >
                  {isAnimating ? (
                    <Pause className="w-3 h-3 mr-1" />
                  ) : (
                    <Play className="w-3 h-3 mr-1" />
                  )}
                  {isAnimating ? "일시정지" : "지형 추적 비행"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAnimation}
                  className="rounded-none border-0 text-xs px-2 py-1 h-7 border-l border-gray-200"
                  disabled={isAnimating}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
              {/* 진행률 표시 */}
              {(isAnimating || animationProgress > 0) && (
                <div className="px-2 py-1 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-gray-700 h-1 rounded-full transition-all duration-200"
                        style={{ width: `${animationProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 min-w-[35px]">
                      {Math.round(animationProgress)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3D/2D 토글 */}
          <div className="bg-white rounded-md shadow-md overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle3D}
              className={`rounded-none border-0 text-xs px-3 py-1 h-7 transition-colors ${
                is3D ? "bg-gray-100 text-gray-700" : ""
              }`}
            >
              {is3D ? (
                <ToggleRight className="w-4 h-4 mr-1" />
              ) : (
                <ToggleLeft className="w-4 h-4 mr-1" />
              )}
              {is3D ? "3D" : "2D"}
            </Button>
          </div>

          {/* 안내 텍스트 */}
          <div className="bg-white bg-opacity-90 rounded-md px-2 py-1 shadow-sm">
            <p className="text-xs text-gray-600">
              🏃‍♂️ 녹색: 시작점 | 🏁 빨간색: 도착점
            </p>
          </div>
        </div>

        {/* 네비게이션 컨트롤 */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
            title="확대"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
            title="축소"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetNorth}
            className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
            title="북쪽으로 회전"
          >
            <Compass className="w-4 h-4" />
          </Button>
        </div>

        {/* 실시간 트레킹 정보 오버레이 */}
        {isAnimating && course && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 bg-black/80 text-white rounded-lg p-4 backdrop-blur-sm shadow-lg z-10"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm">
                  이동 거리:{" "}
                  <span className="font-bold">
                    {currentDistance.toFixed(2)}km
                  </span>{" "}
                  / {course.distance_km}km
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm">
                  소요 시간:{" "}
                  <span className="font-bold">
                    {formatElapsedTime(elapsedTime)}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <span className="text-sm">
                  현재 고도:{" "}
                  <span className="font-bold">
                    {currentElevation.toFixed(0)}m
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-600" />
                <span className="text-sm">
                  진행률:{" "}
                  <span className="font-bold">
                    {animationProgress.toFixed(1)}%
                  </span>
                </span>
              </div>
              {/* 진행 바 */}
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gray-400 to-gray-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${animationProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 완주 축하 이펙트 */}
        <AnimatePresence>
          {showCompletionEffect && course && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* 배경 오버레이 */}
              <div className="absolute inset-0 bg-black/20" />

              {/* 축하 메시지 */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
                className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md relative z-10"
              >
                <Trophy className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  완주 성공! 🎉
                </h2>
                <p className="text-lg text-gray-600 mb-2">
                  {course.distance_km}km 코스를 완주했습니다!
                </p>
                <p className="text-md text-gray-500">
                  소요 시간: {formatElapsedTime(course.avg_time_min * 60)}
                </p>
                {course.elevation_gain && (
                  <p className="text-md text-gray-500 mt-1">
                    누적 상승: {course.elevation_gain}m
                  </p>
                )}
              </motion.div>

              {/* 파티클 이펙트 (색종이) */}
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-sm"
                  style={{
                    width: `${Math.random() * 10 + 5}px`,
                    height: `${Math.random() * 15 + 10}px`,
                    background: [
                      "#F39800",
                      "#FFD700",
                      "#FF6B6B",
                      "#4ECDC4",
                      "#45B7D1",
                      "#FF69B4",
                      "#00CED1",
                    ][i % 7],
                    left: `${50 + (Math.random() - 0.5) * 80}%`,
                    top: `50%`,
                  }}
                  initial={{
                    scale: 0,
                    y: 0,
                    rotate: 0,
                  }}
                  animate={{
                    scale: [0, 1, 1, 0.8, 0],
                    y: [0, -50, -150, -250, -350],
                    x: [(Math.random() - 0.5) * 200],
                    rotate: Math.random() * 720 - 360,
                  }}
                  transition={{
                    duration: 2.5,
                    ease: "easeOut",
                    delay: Math.random() * 0.8,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ripple 효과 */}
        <RippleEffect
          x={ripplePosition.x}
          y={ripplePosition.y}
          isVisible={showRipple}
          onComplete={() => setShowRipple(false)}
        />

        {/* 댓글 추가 모달 */}
        <CommentAddModal
          isOpen={showCommentModal}
          onClose={() => {
            setShowCommentModal(false);
            setCommentPosition(null);
          }}
          onSubmit={handleCommentSubmit}
          position={commentPosition}
          isSubmitting={isSubmittingComment}
        />
      </div>
    </div>
  );
}
