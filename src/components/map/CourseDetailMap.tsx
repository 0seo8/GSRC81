"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import * as turf from "@turf/turf";
import { analyzeTerrain, cameraParams, offset } from "@/utils/useDroneCamera";
import {
  MapPin,
  Satellite,
  Map as MapIcon,
  Route,
  Mountain,
  Timer,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

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
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets">(
    "satellite"
  );
  // 새로운 애니메이션 상태들
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<number[][]>([]);
  const [performanceMode] = useState<"eco">("eco"); // 💰 절약모드 고정

  // Mapbox 토큰
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
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

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Mapbox 토큰 설정
    mapboxgl.accessToken = mapboxToken;

    // 지도 초기화 (저비용 최적화 적용 🚀)
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style:
        mapStyle === "satellite"
          ? "mapbox://styles/mapbox/satellite-v9"
          : "mapbox://styles/mapbox/streets-v12",
      center: [126.9185, 37.6361], // 기본 중심점
      zoom: 14,
      pitch: 0,
      bearing: 0,
      // ✅ 저비용 최적화 설정
      renderWorldCopies: false, // 동일 타일 반복 차단
    });

    // 지도 컨트롤 추가
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.current.on("load", () => {
      console.log("💰 저비용 최적화 모드 활성화");

      // ✅ 추가 최적화 설정들
      if (map.current) {
        console.log("🎯 타일 페치 최적화 준비 완료");
      }

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
  }, [courseId, mapboxToken]);

  // 지도 스타일 변경
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(
        mapStyle === "satellite"
          ? "mapbox://styles/mapbox/satellite-v9"
          : "mapbox://styles/mapbox/streets-v12"
      );

      map.current.once("styledata", () => {
        loadCourseRoute();
      });
    }
  }, [mapStyle]);

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

  const loadCourseRoute = async () => {
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
          console.log(`Found ${coordinates.length} GPX coordinates`);
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
        console.log("GPX 좌표가 없어 시작점만 표시합니다.");
      }

      // 애니메이션을 위해 좌표 저장
      setRouteCoordinates(coordinates);

      // 지도 중심을 경로에 맞춤 (참고 코드 스타일)
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 16,
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
            '<div class="font-semibold">🏃‍♂️ 시작점</div>'
          )
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
              '<div class="font-semibold">🏁 도착점</div>'
            )
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

        console.log("🎯 카메라 범위 제한 설정 완료 (타일 절약)");
      }

      setLoading(false);
    } catch (error) {
      console.error("코스 경로 로드 실패:", error);
      setLoading(false);
    }
  };

  // wholsee-dev 방식: 노선 그리기 → 드론 비행
  const drawRouteThenFly = () => {
    if (!map.current || routeCoordinates.length === 0) {
      console.log("지도나 경로 데이터가 없습니다.");
      return;
    }

    console.log("=== wholsee-dev 방식 애니메이션 시작 ===");

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
    console.log(`총 경로 길이: ${routeLenKm.toFixed(2)}km`);

    // ─── 1) 경로 Source를 두 개로 분리 ───
    // 회색 배경 라인 (전체 경로)
    if (map.current.getSource("route-full")) {
      (map.current.getSource("route-full") as mapboxgl.GeoJSONSource).setData(
        fullFeature
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
        emptyLine
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
        console.log("맵이 없어서 애니메이션 중단됨");
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
        }
      ) as GeoJSON.Feature<GeoJSON.LineString>;

      (map.current.getSource("route-draw") as mapboxgl.GeoJSONSource).setData(
        partial
      );

      // 진행률 업데이트 (0-50%는 노선 그리기)
      const drawProgress = Math.min(progressKm / routeLenKm, 1) * 50;
      setAnimationProgress(drawProgress);

      if (progressKm < routeLenKm) {
        animationRef.current = requestAnimationFrame(draw);
      } else {
        // 라인 그리기 완료 → 드론 비행 시작
        console.log("노선 그리기 완료! 드론 비행 시작");
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
      console.log("노선 그리기 시작!");
      animationRef.current = requestAnimationFrame(draw);
    }, 1500);
  };

  // ─── 3) 드론 비행 애니메이션 ───
  const startDroneFlight = (
    lineFeature: GeoJSON.Feature<GeoJSON.LineString>,
    routeLength: number
  ) => {
    console.log("드론 비행 모드 시작!");

    // 위성+3D 모드로 전환
    setMapStyle("satellite");
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
        console.log("드론 비행 중단됨 - animationRef 또는 map 없음");
        return;
      }

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      progressKm += speedKmPerSecond * deltaTime;

      if (progressKm >= routeLength) {
        console.log("드론 비행 완료!");
        setIsAnimating(false);
        setAnimationProgress(100);

        // 지형 비활성화
        if (map.current.getSource("mapbox-dem")) {
          map.current.setTerrain(null);
        }
        setMapStyle("streets");
        return;
      }

      // 현재 위치 계산
      const currentPoint = turf.along(lineFeature, progressKm, {
        units: "kilometers",
      });
      const currentCoords = currentPoint.geometry.coordinates as [
        number,
        number
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
        cam.dist
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

  // 원래 비행 애니메이션 로직 (이름 변경)
  const flyAlongRouteCore = () => {
    console.log("=== flyAlongRoute 함수 진입 ===");
    console.log("map.current:", !!map.current);
    console.log("routeCoordinates.length:", routeCoordinates.length);
    console.log("isAnimating:", isAnimating);

    if (
      !map.current ||
      !routeCoordinates.length ||
      routeCoordinates.length < 2
    ) {
      console.log("애니메이션을 위한 충분한 좌표가 없습니다.");
      return;
    }

    console.log(`시작: ${routeCoordinates.length}개 좌표로 애니메이션 시작`);

    // ========== 1단계: 노선 그리기 애니메이션 (참고 사이트 방식) ==========
    console.log("1단계: 노선 그리기 시작");

    // 먼저 시작점으로 이동
    const startCoord = routeCoordinates[0];
    const endCoord = routeCoordinates[routeCoordinates.length - 1];

    map.current.flyTo({
      center: [startCoord[0], startCoord[1]],
      zoom: 15,
      pitch: 0,
      bearing: 0,
      duration: 1500,
      essential: true,
    });

    // 새로운 wholsee-dev 방식 구현으로 대체됨
  };

  // 애니메이션 시작/정지 (wholsee-dev 방식)
  const toggleAnimation = () => {
    console.log("=== toggleAnimation 호출 ===");
    console.log("현재 isAnimating:", isAnimating);
    console.log("경로 좌표 수:", routeCoordinates.length);

    if (isAnimating) {
      // 애니메이션 정지
      console.log("애니메이션 정지");
      if (animationRef.current) {
        if (typeof animationRef.current === "number") {
          cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = null;
      }
      setIsAnimating(false);
      setAnimationProgress(0);

      // 지형과 스타일 초기화
      if (map.current && map.current.getSource("mapbox-dem")) {
        map.current.setTerrain(null);
      }
      setMapStyle("streets");
    } else {
      // 애니메이션 시작
      console.log("wholsee-dev 방식 애니메이션 시작!");
      setIsAnimating(true);
      setAnimationProgress(0);

      // 즉시 시작 (복잡한 setTimeout 제거)
      drawRouteThenFly();
    }
  };

  // 애니메이션 리셋
  const resetAnimation = () => {
    console.log("애니메이션 리셋 중...");
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

    // 지형 비활성화 및 스타일 복원
    if (map.current) {
      if (map.current.getSource("mapbox-dem")) {
        map.current.setTerrain(null);
      }
      setMapStyle("streets");
    }

    // 지도를 전체 경로가 보이도록 리셋
    if (map.current && routeCoordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      routeCoordinates.forEach((coord) =>
        bounds.extend(coord as [number, number])
      );
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 16,
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
                    course.difficulty
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
        />

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">지도 로딩 중...</p>
            </div>
          </div>
        )}

        {/* 지도 컨트롤 */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {/* 지도 스타일 토글 */}
          <div className="bg-white rounded-md shadow-md overflow-hidden flex">
            <Button
              variant={mapStyle === "satellite" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMapStyle("satellite")}
              className="rounded-none border-0 text-xs px-3 py-1 h-7 flex-1"
            >
              <Satellite className="w-3 h-3 mr-1" />
              위성
            </Button>
            <Button
              variant={mapStyle === "streets" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMapStyle("streets")}
              className="rounded-none border-0 text-xs px-3 py-1 h-7 flex-1"
            >
              <MapIcon className="w-3 h-3 mr-1" />
              일반
            </Button>
          </div>

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
                  {isAnimating ? "일시정지" : "경로 따라가기"}
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
                        className="bg-orange-500 h-1 rounded-full transition-all duration-200"
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

          {/* 안내 텍스트 */}
          <div className="bg-white bg-opacity-90 rounded-md px-2 py-1 shadow-sm">
            <p className="text-xs text-gray-600">
              🏃‍♂️ 녹색: 시작점 | 🏁 빨간색: 도착점
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
