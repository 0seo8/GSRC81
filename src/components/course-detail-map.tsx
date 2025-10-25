"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Map, {
  Source,
  Layer,
  Marker,
  MapRef,
  MapMouseEvent,
} from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import { Flag, MessageSquare } from "lucide-react";
import { convertToLegacyCourse } from "@/types/unified";
import { getCourseByIdV2 } from "@/lib/courses-data-v2";
import "mapbox-gl/dist/mapbox-gl.css";

import { TrailData, TrailGeoJSON } from "./map/trail-map/types";
import { INITIAL_VIEW_STATE } from "./map/trail-map/constants";
import { useTrailAnimation } from "./map/trail-map/hooks/use-trail-animation";
import { useLocationTracking } from "./map/trail-map/hooks/use-location-tracking";
import { useKmMarkers } from "./map/trail-map/hooks/use-km-markers";
import { MapControls } from "./map/trail-map/components/map-controls";
import { CommentModal } from "./comment-modal";
import { getFlightModeComments, CourseComment } from "@/lib/comments";

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

  // 댓글 관련 상태
  const [clickedPoint, setClickedPoint] = useState<{
    lng: number;
    lat: number;
    distanceMarker: number;
  } | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [flightComments, setFlightComments] = useState<CourseComment[]>([]);

  const mapRef = useRef<MapRef>(null);

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

  // 지도 클릭 핸들러
  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      if (isAnimating) return; // 애니메이션 중에는 클릭 비활성화

      const { lng, lat } = event.lngLat;
      const nearestPoint = findNearestRoutePoint(lng, lat);

      if (nearestPoint) {
        setClickedPoint({
          lng: nearestPoint.lng,
          lat: nearestPoint.lat,
          distanceMarker: nearestPoint.distanceMarker,
        });
        setShowCommentModal(true);
      }
    },
    [isAnimating, findNearestRoutePoint],
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
    loadFlightComments(); // 댓글 목록 새로고침
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
        console.error("Failed to load trail data:", err);
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

  // 댓글 로드
  useEffect(() => {
    if (courseId) {
      loadFlightComments();
    }
  }, [courseId, loadFlightComments]);

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
        onClick={handleMapClick}
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
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
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

        {/* 댓글 말풍선 마커들 */}
        {flightComments
          .filter((comment) => comment.latitude && comment.longitude)
          .map((comment) => (
            <Marker
              key={comment.id}
              longitude={comment.longitude!}
              latitude={comment.latitude!}
              anchor="bottom"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="relative max-w-xs"
              >
                {/* 말풍선 */}
                <div className="bg-black text-white rounded-lg shadow-lg p-3 relative">
                  {/* 말풍선 꼬리 */}
                  <div className="absolute bottom-0 left-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black transform translate-y-full"></div>

                  {/* 댓글 내용 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        {comment.author_nickname}
                      </span>
                      <span className="text-xs text-gray-300">
                        {comment.distance_marker?.toFixed(1)}km
                      </span>
                    </div>
                    <p className="text-sm text-white leading-relaxed">
                      {comment.message}
                    </p>
                    <div className="text-xs text-gray-300">
                      {new Date(comment.created_at).toLocaleDateString(
                        "ko-KR",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Marker>
          ))}
      </Map>

      {/* 댓글 입력 모달 */}
      <CommentModal
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        courseId={courseId}
        position={clickedPoint}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

export default CourseDetailMap;
