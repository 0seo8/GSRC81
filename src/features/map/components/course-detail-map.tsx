"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Map, { Source, Layer, Marker, MapRef } from "react-map-gl/mapbox";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, MessageSquare } from "lucide-react";
import { convertToLegacyCourse } from "@/types/unified";
import { getCourseByIdV2 } from "@/shared/lib/courses-data-v2";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  TrailData,
  TrailGeoJSON,
} from "@/features/map/components/trail-map/types";
import { INITIAL_VIEW_STATE } from "@/features/map/components/trail-map/constants";
import { useTrailAnimation } from "@/features/map/components/trail-map/hooks/use-trail-animation";
import { useLocationTracking } from "@/features/map/components/trail-map/hooks/use-location-tracking";
import { useKmMarkers } from "@/features/map/components/trail-map/hooks/use-km-markers";
import { MapControls } from "@/features/map/components/trail-map/components/map-controls";
import { CommentModal } from "@/features/comments/components/comment-modal";
import { getFlightModeComments, CourseComment } from "@/shared/lib/comments";

interface CourseDetailMapProps {
  courseId: string;
  className?: string;
}

const CourseDetailMap: React.FC<CourseDetailMapProps> = ({
  courseId,
  className = "",
}) => {
  const [trailData, setTrailData] = useState<TrailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 댓글 관련 상태
  const [clickedPoint, setClickedPoint] = useState<{
    lng: number;
    lat: number;
    distanceMarker: number;
  } | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [flightComments, setFlightComments] = useState<CourseComment[]>([]);
  // 초기 상태: 빈 Set (댓글 없음)
  const [visibleComments, setVisibleComments] = useState<Set<string>>(
    new Set(),
  );

  const mapRef = useRef<MapRef>(null);
  // 이미 표시된 댓글 추적 (ref로 관리하여 무한 루프 방지)
  const shownCommentsRef = useRef<Set<string>>(new Set());

  // 롱프레스 관련 ref
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressStartPosRef = useRef<{ lng: number; lat: number } | null>(
    null,
  );
  const isLongPressTriggeredRef = useRef(false);
  const isAnimatingRef = useRef(false); // 애니메이션 상태를 ref로 추적
  const LONG_PRESS_DURATION = 3000; // 3초
  const MOVE_THRESHOLD = 0.001; // 약 110m 정도의 이동 허용 (위도/경도 단위) - 더 관대하게

  // Custom hooks
  const {
    kmMarkers,
    visibleKmMarkers,
    setKmMarkers,
    resetKmMarkers,
    showKmMarker,
  } = useKmMarkers();

  const { userLocation, locationButtonState, findMyLocation, resetLocation } =
    useLocationTracking(mapRef);

  const {
    isAnimating,
    isFullRouteView,
    animationProgress,
    currentActualDistanceKm, // 실제 누적 거리 (댓글 동기화용)
    savedProgress,
    startTrailAnimation,
    showFullRoute,
  } = useTrailAnimation(
    mapRef,
    trailData,
    showKmMarker,
    resetKmMarkers,
    setKmMarkers,
  );

  // isAnimating 상태가 변경될 때 ref 업데이트
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  // 가장 가까운 경로 지점 찾기 함수
  const findNearestRoutePoint = useCallback(
    (clickLng: number, clickLat: number) => {
      if (!trailData?.geoJSON?.features?.[0]?.geometry?.coordinates)
        return null;

      const coordinates = trailData.geoJSON.features[0].geometry.coordinates;
      let minDistance = Infinity;
      let nearestLng = 0;
      let nearestLat = 0;
      let nearestDistanceMarker = 0;
      let found = false;
      let nearestIndex = -1;
      let cumulativeDistance = 0;

      coordinates.forEach((coord: number[], index: number) => {
        const [lng, lat] = coord;

        // Haversine 공식을 사용한 거리 계산
        const R = 6371000; // 지구 반지름 (미터)
        const dLat = ((lat - clickLat) * Math.PI) / 180;
        const dLng = ((lng - clickLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((clickLat * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // 이전 지점과의 거리 계산하여 누적 거리 업데이트
        if (index > 0) {
          const [prevLng, prevLat] = coordinates[index - 1];
          const segmentDistance =
            R *
            2 *
            Math.asin(
              Math.sqrt(
                Math.sin(((lat - prevLat) * Math.PI) / 180 / 2) ** 2 +
                  Math.cos((prevLat * Math.PI) / 180) *
                    Math.cos((lat * Math.PI) / 180) *
                    Math.sin(((lng - prevLng) * Math.PI) / 180 / 2) ** 2,
              ),
            );
          cumulativeDistance += segmentDistance;
        }

        if (distance < minDistance) {
          minDistance = distance;
          nearestLng = lng;
          nearestLat = lat;
          nearestDistanceMarker = cumulativeDistance / 1000; // km
          found = true;
          nearestIndex = index;
        }
      });

      if (found) {
        return {
          lng: nearestLng,
          lat: nearestLat,
          distanceMarker: nearestDistanceMarker,
          index: nearestIndex,
        };
      }
      return null;
    },
    [trailData],
  );

  // 댓글 로드 함수
  const loadFlightComments = useCallback(async () => {
    if (!courseId) return;

    try {
      const flightOnlyComments = await getFlightModeComments(courseId);
      setFlightComments(flightOnlyComments);
    } catch (error) {
      console.error("댓글 로드 실패:", error);
    }
  }, [courseId]);

  // 댓글 추가 성공 핸들러
  const handleCommentAdded = useCallback(() => {
    loadFlightComments(); // 비행모드 댓글 목록 새로고침

    // 페이지 전체를 새로고침하여 Server Component 데이터도 업데이트
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, [loadFlightComments]);

  // 위치/경로보기 버튼 클릭 핸들러
  const handleLocationRouteButton = useCallback(() => {
    if (locationButtonState === "location") {
      findMyLocation();
    } else {
      resetLocation();
      showFullRoute();
    }
  }, [locationButtonState, findMyLocation, resetLocation, showFullRoute]);

  // 데이터 로드 완료 후 지도 다시 로드 트리거 (애니메이션 중이 아닐 때만)
  useEffect(() => {
    if (trailData && mapRef.current && !isAnimating) {
      const map = mapRef.current.getMap();
      if (map.isStyleLoaded()) {
        setTimeout(() => {
          showFullRoute();
        }, 100);
      }
    }
  }, [trailData, showFullRoute, isAnimating]);

  // 애니메이션 진행률에 따른 부분 GeoJSON 생성 (geoJSON 기반)
  const getAnimatedGeoJSON = useCallback(() => {
    if (!trailData?.geoJSON?.features?.[0]?.geometry?.coordinates) return null;

    const coordinates = trailData.geoJSON.features[0].geometry.coordinates.map(
      (c) => ({ lng: c[0], lat: c[1], ele: (c[2] as number | undefined) || 0 }),
    );

    if (!isAnimating || animationProgress === 1) {
      return {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: coordinates.map((point) => [
                point.lng,
                point.lat,
                point.ele || 0,
              ]),
            },
          },
        ],
      };
    }

    const totalPoints = coordinates.length;
    const currentPointIndex = Math.min(
      Math.floor(animationProgress * (totalPoints - 1)),
      totalPoints - 1,
    );

    const currentCoordinates = coordinates.slice(
      0,
      Math.max(2, currentPointIndex + 1),
    );

    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: currentCoordinates.map((point) => [
              point.lng,
              point.lat,
              point.ele || 0,
            ]),
          },
        },
      ],
    };
  }, [trailData, isAnimating, animationProgress]);

  const onMapLoad = useCallback(() => {
    // Map이 로드되었음을 표시
    setIsMapLoaded(true);

    if (!mapRef.current || !trailData || isAnimating) return;

    setTimeout(() => {
      showFullRoute();
    }, 100);
  }, [trailData, showFullRoute, isAnimating]);

  // V2 API를 사용한 데이터 로드
  const loadCourseData = async (courseId: string): Promise<TrailData> => {
    const courseV2 = await getCourseByIdV2(courseId);

    if (!courseV2) {
      throw new Error("코스를 찾을 수 없습니다.");
    }

    if (!courseV2.gpx_data?.points || courseV2.gpx_data.points.length === 0) {
      throw new Error("코스 경로 데이터가 없습니다.");
    }

    // CourseV2를 Course로 변환
    const course = convertToLegacyCourse(courseV2);

    // GeoJSON 생성
    const geoJSON: TrailGeoJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: courseV2.gpx_data.points.map((p) => [
              p.lng,
              p.lat,
              p.ele || 0,
            ]),
          },
        },
      ],
    };

    // TrailData.stats 형식에 맞게 변환
    const stats = {
      totalDistance: courseV2.gpx_data.stats.totalDistance,
      elevationGain: courseV2.gpx_data.stats.elevationGain,
      estimatedTime: courseV2.gpx_data.stats.estimatedDuration,
      maxElevation: 0, // TODO: 계산하거나 기본값
      minElevation: 0, // TODO: 계산하거나 기본값
      elevationLoss: 0, // TODO: 계산하거나 기본값
      difficulty: courseV2.difficulty,
      bounds: courseV2.gpx_data.bounds,
    };

    return {
      course,
      points: [], // 기존 CoursePoint 배열 (사용하지 않음)
      geoJSON,
      stats,
    };
  };

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await loadCourseData(courseId);
        setTrailData(data);

        // 초기 중심점 설정
        const bounds = data.stats.bounds;

        const centerLon = (bounds.minLng + bounds.maxLng) / 2;
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;

        // 경로 범위에 맞는 줌 레벨 계산
        const latRange = bounds.maxLat - bounds.minLat;
        const lonRange = bounds.maxLng - bounds.minLng;
        const maxRange = Math.max(latRange, lonRange);

        let initialZoom = 10;
        if (maxRange < 0.01) initialZoom = 14;
        else if (maxRange < 0.05) initialZoom = 12;
        else if (maxRange < 0.1) initialZoom = 11;

        setViewState((prev) => ({
          ...prev,
          longitude: centerLon,
          latitude: centerLat,
          zoom: initialZoom,
        }));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "트레일 데이터를 불러올 수 없습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadData();
    }
  }, [courseId]);

  // 댓글 로드 (로드 시에도 표시하지 않음)
  useEffect(() => {
    if (courseId) {
      loadFlightComments();
      // 로드 직후에도 댓글 숨김 상태 유지
      setVisibleComments(new Set());
    }
  }, [courseId, loadFlightComments]);

  // 애니메이션 상태 변경 시 댓글 상태 관리
  useEffect(() => {
    if (!isAnimating) {
      // 비행모드가 아닐 때는 항상 모든 댓글 숨김
      setVisibleComments(new Set());
      shownCommentsRef.current.clear();
    }
  }, [isAnimating]);

  // 애니메이션 진행에 따라 댓글 표시 관리
  useEffect(() => {
    // 비행모드가 아니거나 데이터가 없으면 모든 댓글 즉시 숨김
    if (!isAnimating || !trailData) {
      setVisibleComments(new Set());
      shownCommentsRef.current.clear();
      return;
    }

    const currentDistanceKm = currentActualDistanceKm;

    // 현재 거리를 지난 댓글들 중 새로 표시할 댓글들 찾기
    flightComments.forEach((comment) => {
      // 거리 마커가 없는 댓글은 무시
      if (
        comment.distance_marker === undefined ||
        comment.distance_marker === null
      ) {
        return;
      }

      // 이미 한 번 표시된 댓글은 건너뛰기
      if (shownCommentsRef.current.has(comment.id)) {
        return;
      }

      // 현재 진행 지점을 지난 댓글만 표시
      if (comment.distance_marker <= currentDistanceKm) {
        // 표시된 댓글로 마킹
        shownCommentsRef.current.add(comment.id);

        // 새로운 댓글 표시
        setVisibleComments((prev) => new Set([...prev, comment.id]));

        // 텍스트 길이에 따라 표시 시간 계산
        // 기본 3초 + (글자수 / 15) * 1초 (최소 3초, 최대 5초)
        const textLength = comment.message.length;
        const displayDuration = Math.min(
          Math.max(3000, 3000 + (textLength / 15) * 1000),
          5000,
        );

        // 계산된 시간 후 해당 댓글 제거 (fade-out)
        setTimeout(() => {
          setVisibleComments((prev) => {
            const newSet = new Set(prev);
            newSet.delete(comment.id);
            return newSet;
          });
        }, displayDuration);
      }
    });
  }, [isAnimating, currentActualDistanceKm, trailData, flightComments]);

  // 롱프레스 타이머 클리어 함수
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartPosRef.current = null;
  }, []);

  // 롱프레스 이벤트 등록 (3초 이상 누르면 댓글 모달 열기)
  useEffect(() => {
    console.log("🔄 [LongPress] useEffect 실행:", {
      mapRef: !!mapRef.current,
      isMapLoaded,
      trailData: !!trailData,
    });

    if (!mapRef.current || !isMapLoaded || !trailData) {
      console.log("⏸️ [LongPress] 조건 미충족으로 리턴");
      return;
    }

    const map = mapRef.current.getMap();

    // 롱프레스 시작 핸들러 (마우스용)
    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      // 애니메이션 중이면 무시 (ref 사용으로 최신 상태 참조)
      if (isAnimatingRef.current) return;

      const { lng, lat } = e.lngLat;
      console.log("🖱️ [LongPress] mousedown 시작:", { lng, lat });

      // 시작 위치 저장
      longPressStartPosRef.current = { lng, lat };
      isLongPressTriggeredRef.current = false;

      // 기존 타이머 클리어
      clearLongPressTimer();

      // 3초 타이머 시작
      longPressTimerRef.current = setTimeout(() => {
        console.log("⏰ [LongPress] 3초 타이머 완료!");
        // 롱프레스 트리거됨 표시
        isLongPressTriggeredRef.current = true;

        // 가장 가까운 경로 지점 찾기
        const nearestPoint = findNearestRoutePoint(lng, lat);
        console.log("📍 [LongPress] nearestPoint:", nearestPoint);

        if (nearestPoint) {
          // 햅틱 피드백 (지원하는 디바이스에서만)
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(100);
          }

          setClickedPoint({
            lng: nearestPoint.lng,
            lat: nearestPoint.lat,
            distanceMarker: nearestPoint.distanceMarker,
          });
          setShowCommentModal(true);
        } else {
          console.log("❌ [LongPress] nearestPoint가 null - 경로 근처가 아님");
        }

        // 타이머 정리
        longPressTimerRef.current = null;
      }, LONG_PRESS_DURATION);
    };

    // 롱프레스 시작 핸들러 (터치용)
    const handleTouchStart = (e: mapboxgl.MapTouchEvent) => {
      // 애니메이션 중이면 무시 (ref 사용으로 최신 상태 참조)
      if (isAnimatingRef.current) return;

      const { lng, lat } = e.lngLat;
      console.log("👆 [LongPress] touchstart 시작:", { lng, lat });

      // 시작 위치 저장
      longPressStartPosRef.current = { lng, lat };
      isLongPressTriggeredRef.current = false;

      // 기존 타이머 클리어
      clearLongPressTimer();

      // 3초 타이머 시작
      longPressTimerRef.current = setTimeout(() => {
        console.log("⏰ [LongPress] 3초 타이머 완료! (터치)");
        // 롱프레스 트리거됨 표시
        isLongPressTriggeredRef.current = true;

        // 가장 가까운 경로 지점 찾기
        const nearestPoint = findNearestRoutePoint(lng, lat);
        console.log("📍 [LongPress] nearestPoint:", nearestPoint);

        if (nearestPoint) {
          // 햅틱 피드백 (지원하는 디바이스에서만)
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(100);
          }

          setClickedPoint({
            lng: nearestPoint.lng,
            lat: nearestPoint.lat,
            distanceMarker: nearestPoint.distanceMarker,
          });
          setShowCommentModal(true);
        } else {
          console.log("❌ [LongPress] nearestPoint가 null - 경로 근처가 아님");
        }

        // 타이머 정리
        longPressTimerRef.current = null;
      }, LONG_PRESS_DURATION);
    };

    // 롱프레스 종료 핸들러
    const handlePressEnd = () => {
      if (longPressTimerRef.current) {
        console.log("🛑 [LongPress] 타이머 취소됨 (pressEnd)");
      }
      clearLongPressTimer();
    };

    // 마우스 이동 시 롱프레스 취소
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!longPressStartPosRef.current || !longPressTimerRef.current) return;

      const { lng, lat } = e.lngLat;
      const startPos = longPressStartPosRef.current;

      // 시작 위치에서 일정 거리 이상 이동하면 롱프레스 취소
      const deltaLng = Math.abs(lng - startPos.lng);
      const deltaLat = Math.abs(lat - startPos.lat);

      if (deltaLng > MOVE_THRESHOLD || deltaLat > MOVE_THRESHOLD) {
        console.log("🚶 [LongPress] 이동으로 취소 (mouse):", {
          deltaLng,
          deltaLat,
          threshold: MOVE_THRESHOLD,
        });
        clearLongPressTimer();
      }
    };

    // 터치 이동 시 롱프레스 취소
    const handleTouchMove = (e: mapboxgl.MapTouchEvent) => {
      if (!longPressStartPosRef.current || !longPressTimerRef.current) return;

      const { lng, lat } = e.lngLat;
      const startPos = longPressStartPosRef.current;

      // 시작 위치에서 일정 거리 이상 이동하면 롱프레스 취소
      const deltaLng = Math.abs(lng - startPos.lng);
      const deltaLat = Math.abs(lat - startPos.lat);

      if (deltaLng > MOVE_THRESHOLD || deltaLat > MOVE_THRESHOLD) {
        console.log("🚶 [LongPress] 이동으로 취소 (touch):", {
          deltaLng,
          deltaLat,
          threshold: MOVE_THRESHOLD,
        });
        clearLongPressTimer();
      }
    };

    // 드래그 시작 시 롱프레스 취소
    const handleDragStart = () => {
      if (longPressTimerRef.current) {
        console.log("🔄 [LongPress] 드래그 시작으로 취소");
      }
      clearLongPressTimer();
    };

    // 이벤트 등록
    const setupLongPress = () => {
      console.log("✅ [LongPress] 이벤트 등록 완료");
      // 마우스 이벤트
      map.on("mousedown", handleMouseDown);
      map.on("mouseup", handlePressEnd);
      map.on("mousemove", handleMouseMove);

      // 터치 이벤트
      map.on("touchstart", handleTouchStart);
      map.on("touchend", handlePressEnd);
      map.on("touchmove", handleTouchMove);

      // 드래그 시작 시 롱프레스 취소
      map.on("dragstart", handleDragStart);
    };

    // 항상 즉시 등록 시도 (isMapLoaded가 true면 이미 로드된 상태)
    // map.loaded()와 isMapLoaded 상태가 다를 수 있으므로 즉시 등록
    setupLongPress();

    return () => {
      clearLongPressTimer();
      map.off("mousedown", handleMouseDown);
      map.off("mouseup", handlePressEnd);
      map.off("mousemove", handleMouseMove);
      map.off("touchstart", handleTouchStart);
      map.off("touchend", handlePressEnd);
      map.off("touchmove", handleTouchMove);
      map.off("dragstart", handleDragStart);
    };
  }, [isMapLoaded, trailData, findNearestRoutePoint, clearLongPressTimer]);

  // 트레일 라인 스타일
  const trailLineLayer = {
    id: "trail-line",
    type: "line" as const,
    paint: {
      "line-color": "#000000",
      "line-width": 4,
    },
    layout: {
      "line-join": "round" as const,
      "line-cap": "round" as const,
    },
  };

  const trailOutlineLayer = {
    id: "trail-outline",
    type: "line" as const,
    paint: {},
    layout: {
      "line-join": "round" as const,
      "line-cap": "round" as const,
    },
  };

  // 클릭 가능한 투명 레이어 (넓은 클릭 영역)
  const trailClickableLayer = {
    id: "trail-clickable",
    type: "line" as const,
    paint: {
      "line-color": "transparent",
      "line-width": 20, // 클릭하기 쉬운 넓은 영역
      "line-opacity": 0,
    },
    layout: {
      "line-join": "round" as const,
      "line-cap": "round" as const,
    },
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !trailData) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <p className="text-red-600">{error || "지도를 불러올 수 없습니다."}</p>
      </div>
    );
  }

  // 시작/종료 포인트는 stats.bounds 또는 geoJSON에서 추출
  const coordinates = trailData.geoJSON.features[0]?.geometry.coordinates;
  const startPoint = coordinates?.[0]
    ? { lng: coordinates[0][0], lat: coordinates[0][1] }
    : null;
  const endPoint =
    coordinates?.length > 1
      ? {
          lng: coordinates[coordinates.length - 1][0],
          lat: coordinates[coordinates.length - 1][1],
        }
      : null;

  return (
    <div className={`h-full relative ${className}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onLoad={onMapLoad}
        doubleClickZoom={false}
        attributionControl={false}
        maxZoom={12.85}
        minZoom={10}
      >
        <MapControls
          isAnimating={isAnimating}
          isFullRouteView={isFullRouteView}
          savedProgress={savedProgress}
          locationButtonState={locationButtonState}
          onAnimationToggle={
            isAnimating
              ? showFullRoute
              : isFullRouteView
                ? startTrailAnimation
                : showFullRoute
          }
          onLocationRouteToggle={handleLocationRouteButton}
        />

        {/* 트레일 레이어 */}
        {(() => {
          const geoJSONData = getAnimatedGeoJSON();
          return (
            geoJSONData && (
              <Source id="trail" type="geojson" data={geoJSONData}>
                <Layer {...trailOutlineLayer} />
                <Layer {...trailLineLayer} />
                <Layer {...trailClickableLayer} />
              </Source>
            )
          );
        })()}

        {/* 시작점 마커 */}
        {startPoint && (
          <Marker
            longitude={startPoint.lng}
            latitude={startPoint.lat}
            anchor="bottom"
            style={{ pointerEvents: "none" }}
          >
            <div className="bg-green-500 text-white rounded-full p-2 shadow-lg border-2 border-white">
              <Flag className="w-4 h-4" />
            </div>
          </Marker>
        )}

        {/* 종료점 마커 */}
        {endPoint && startPoint !== endPoint && (
          <Marker
            longitude={endPoint.lng}
            latitude={endPoint.lat}
            anchor="bottom"
            style={{ pointerEvents: "none" }}
          >
            <div className="bg-red-500 text-white rounded-full p-2 shadow-lg border-2 border-white">
              <Flag className="w-4 h-4" />
            </div>
          </Marker>
        )}

        {/* km 지점 마커들 */}
        {isAnimating &&
          kmMarkers
            .filter((marker) => visibleKmMarkers.has(marker.km))
            .map((marker) => (
              <Marker
                key={`km-${marker.km}`}
                longitude={marker.position.lng}
                latitude={marker.position.lat}
                anchor="center"
                style={{ pointerEvents: "none" }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{
                    duration: 0.7,
                    ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smooth fade
                  }}
                  className="bg-blue-500 text-white px-2 py-1 rounded-full shadow-lg border-2 border-white font-bold text-xs"
                >
                  {marker.km}km
                </motion.div>
              </Marker>
            ))}

        {/* 사용자 현재 위치 마커 */}
        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="center"
          >
            <div className="relative">
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
              <div className="absolute -inset-2 bg-blue-200 rounded-full opacity-30 animate-pulse"></div>
            </div>
          </Marker>
        )}

        {/* 클릭된 지점 마커 */}
        {clickedPoint && (
          <Marker
            longitude={clickedPoint.lng}
            latitude={clickedPoint.lat}
            anchor="bottom"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-orange-500 text-white rounded-full p-2 shadow-lg border-2 border-white cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
            </motion.div>
          </Marker>
        )}

        {/* 댓글 말풍선 마커들 - 비행모드일 때만 표시 (초기에는 완전히 숨김) */}
        <AnimatePresence mode="sync">
          {isAnimating &&
            flightComments.length > 0 &&
            visibleComments.size > 0 &&
            flightComments
              .filter(
                (comment) =>
                  comment.latitude &&
                  comment.longitude &&
                  visibleComments.has(comment.id),
              )
              .map((comment) => (
                <Marker
                  key={comment.id}
                  longitude={comment.longitude!}
                  latitude={comment.latitude!}
                  anchor="bottom"
                  style={{ pointerEvents: "none" }}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: -5 }}
                    transition={{
                      duration: 0.7,
                      ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smooth fade
                    }}
                    className="flex flex-col items-center"
                  >
                    {/* 말풍선 */}
                    <div className="bg-black text-white rounded-lg shadow-lg p-3 max-w-[200px]">
                      {/* 댓글 내용만 표시 */}
                      <p className="text-white leading-relaxed font-inter text-[0.625rem]">
                        {comment.message}
                      </p>
                    </div>
                    {/* 말풍선 꼬리 - 중앙 정렬 */}
                    <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black"></div>
                  </motion.div>
                </Marker>
              ))}
        </AnimatePresence>
      </Map>

      {/* 댓글 입력 모달 */}
      <CommentModal
        isOpen={showCommentModal}
        onClose={() => {
          setShowCommentModal(false);
          setClickedPoint(null); // 마커도 함께 제거
        }}
        courseId={courseId}
        position={clickedPoint}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

export default CourseDetailMap;
