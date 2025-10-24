"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Map, {
  Source,
  Layer,
  Marker,
  MapRef,
  MapMouseEvent,
} from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Flag, MessageSquare } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

import { TrailMapProps, TrailGeoJSON } from "./trail-map/types";
import { INITIAL_VIEW_STATE } from "./trail-map/constants";
import { useTrailAnimation } from "./trail-map/hooks/use-trail-animation";
import { useLocationTracking } from "./trail-map/hooks/use-location-tracking";
import { useKmMarkers } from "./trail-map/hooks/use-km-markers";
import { LoadingState } from "./trail-map/components/loading-state";
import { ErrorState } from "./trail-map/components/error-state";
import { MapControls } from "./trail-map/components/map-controls";
import { CourseInfo } from "./trail-map/components/course-info";
import { CommentModal } from "../comment-modal";
import { CommentList } from "../comment-list";
import { CourseGallery } from "../course-gallery";
import { useTrailData } from "@/hooks/use-trail-data";

// 좌표 변환을 위한 타입
interface Coordinate {
  lng: number;
  lat: number;
  ele?: number;
}

// 최근접 지점 찾기 최적화 (Spatial indexing 대신 단순 최적화)
class NearestPointFinder {
  private coordinates: Coordinate[] = [];
  private cumulativeDistances: number[] = [];

  constructor(geoJSON: TrailGeoJSON | null) {
    if (geoJSON?.features?.[0]?.geometry?.coordinates) {
      this.coordinates = geoJSON.features[0].geometry.coordinates.map(
        (c) => ({ lng: c[0], lat: c[1], ele: c[2] || 0 })
      );
      this.calculateCumulativeDistances();
    }
  }

  private calculateCumulativeDistances() {
    this.cumulativeDistances = [0];
    let cumulative = 0;

    for (let i = 1; i < this.coordinates.length; i++) {
      const prev = this.coordinates[i - 1];
      const curr = this.coordinates[i];
      const distance = this.haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      cumulative += distance;
      this.cumulativeDistances.push(cumulative);
    }
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  findNearest(clickLng: number, clickLat: number) {
    if (this.coordinates.length === 0) return null;

    let minDistance = Infinity;
    let nearestIndex = -1;

    // 이진 검색이나 공간 인덱싱 대신 단순 순회 (충분히 빠름)
    for (let i = 0; i < this.coordinates.length; i++) {
      const coord = this.coordinates[i];
      const distance = this.haversineDistance(clickLat, clickLng, coord.lat, coord.lng);

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    if (nearestIndex === -1) return null;

    const nearest = this.coordinates[nearestIndex];
    return {
      lng: nearest.lng,
      lat: nearest.lat,
      distanceMarker: this.cumulativeDistances[nearestIndex] / 1000, // km
      index: nearestIndex,
    };
  }
}

const TrailMapV3: React.FC<TrailMapProps> = ({ courseId, className = "" }) => {
  const {
    trailData,
    comments,
    flightComments,
    coursePhotos,
    loading,
    error,
    refreshComments,
    initialViewState,
  } = useTrailData(courseId) as any;

  const [viewState, setViewState] = useState(initialViewState || INITIAL_VIEW_STATE);
  const [clickedPoint, setClickedPoint] = useState<{
    lng: number;
    lat: number;
    distanceMarker: number;
  } | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const mapRef = useRef<MapRef>(null);

  // 최근접 지점 찾기 인스턴스 (메모이제이션)
  const nearestPointFinder = useMemo(
    () => new NearestPointFinder(trailData?.geoJSON || null),
    [trailData?.geoJSON]
  );

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

  // 지도 클릭 핸들러 (최적화됨)
  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      if (isAnimating) return;

      const { lng, lat } = event.lngLat;
      const nearestPoint = nearestPointFinder.findNearest(lng, lat);

      if (nearestPoint) {
        setClickedPoint({
          lng: nearestPoint.lng,
          lat: nearestPoint.lat,
          distanceMarker: nearestPoint.distanceMarker,
        });
        setShowCommentModal(true);
      }
    },
    [isAnimating, nearestPointFinder],
  );

  // 댓글 추가 성공 핸들러
  const handleCommentAdded = useCallback(() => {
    refreshComments();
  }, [refreshComments]);

  // 위치/경로보기 버튼 클릭 핸들러
  const handleLocationRouteButton = useCallback(() => {
    if (locationButtonState === "location") {
      findMyLocation();
    } else {
      resetLocation();
      showFullRoute();
    }
  }, [locationButtonState, findMyLocation, resetLocation, showFullRoute]);

  // 초기 뷰 상태 업데이트
  useEffect(() => {
    if (initialViewState) {
      setViewState((prev) => ({ ...prev, ...initialViewState }));
    }
  }, [initialViewState]);

  // 애니메이션 진행률에 따른 부분 GeoJSON 생성 (최적화됨)
  const animatedGeoJSON = useMemo(() => {
    if (!trailData?.geoJSON?.features?.[0]?.geometry?.coordinates) return null;

    const coordinates = trailData.geoJSON.features[0].geometry.coordinates;

    if (!isAnimating || animationProgress === 1) {
      return trailData.geoJSON;
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
            coordinates: currentCoordinates,
          },
        },
      ],
    };
  }, [trailData?.geoJSON, isAnimating, animationProgress]);

  const onMapLoad = useCallback(() => {
    if (!mapRef.current || !trailData || isAnimating) return;
    setTimeout(() => showFullRoute(), 100);
  }, [trailData, showFullRoute, isAnimating]);

  // 시작/종료 포인트 (메모이제이션)
  const { startPoint, endPoint } = useMemo(() => {
    const coordinates = trailData?.geoJSON.features[0]?.geometry.coordinates;
    if (!coordinates || coordinates.length === 0) {
      return { startPoint: null, endPoint: null };
    }

    return {
      startPoint: { lng: coordinates[0][0], lat: coordinates[0][1] },
      endPoint: coordinates.length > 1 
        ? { lng: coordinates[coordinates.length - 1][0], lat: coordinates[coordinates.length - 1][1] }
        : null,
    };
  }, [trailData?.geoJSON]);

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

  if (loading) {
    return <LoadingState className={className} />;
  }

  if (error || !trailData) {
    return <ErrorState className={className} error={error || undefined} />;
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        <Card>
          <CardContent className="p-0">
            <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
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
                {animatedGeoJSON && (
                  <Source id="trail" type="geojson" data={animatedGeoJSON}>
                    <Layer {...trailLineLayer} />
                  </Source>
                )}

                {/* 시작점 마커 */}
                {startPoint && (
                  <Marker longitude={startPoint.lng} latitude={startPoint.lat} anchor="bottom">
                    <div className="bg-green-500 text-white rounded-full p-2 shadow-lg border-2 border-white">
                      <Flag className="w-4 h-4" />
                    </div>
                  </Marker>
                )}

                {/* 종료점 마커 */}
                {endPoint && startPoint !== endPoint && (
                  <Marker longitude={endPoint.lng} latitude={endPoint.lat} anchor="bottom">
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
                  <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
                    <div className="relative">
                      <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
                      <div className="absolute -inset-2 bg-blue-200 rounded-full opacity-30 animate-pulse"></div>
                    </div>
                  </Marker>
                )}

                {/* 클릭된 지점 마커 */}
                {clickedPoint && (
                  <Marker longitude={clickedPoint.lng} latitude={clickedPoint.lat} anchor="bottom">
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
                {(isAnimating ? flightComments : comments)
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
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 relative">
                          <div className="absolute bottom-0 left-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white transform translate-y-full"></div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800">
                                {comment.author_nickname}
                              </span>
                              <span className="text-xs text-gray-500">
                                {comment.distance_marker?.toFixed(1)}km
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {comment.message}
                            </p>
                            <div className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString("ko-KR", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Marker>
                  ))}
              </Map>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 코스 정보 Card */}
      <CourseInfo trailData={trailData} savedProgress={savedProgress} />

      {/* 댓글 목록 */}
      <div className="mt-4">
        <CommentList comments={comments} loading={false} />
      </div>

      {/* 코스 갤러리 */}
      <div className="mt-4">
        <CourseGallery
          courseId={courseId}
          photos={coursePhotos}
          loading={false}
        />
      </div>

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

export default TrailMapV3;