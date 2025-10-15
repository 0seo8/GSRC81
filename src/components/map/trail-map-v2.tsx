"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Map, { Source, Layer, Marker, MapRef } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "lucide-react";
import { CourseV2, UnifiedGPXData, convertToLegacyCourse } from "@/types/unified";
import { getCourseByIdV2 } from "@/lib/courses-data-v2";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  TrailMapProps,
  TrailData,
  GpxCoordinate,
  TrailGeoJSON,
} from "./trail-map/types";
import { INITIAL_VIEW_STATE, MAP_STYLES } from "./trail-map/constants";
import { useTrailAnimation } from "./trail-map/hooks/use-trail-animation";
import { useLocationTracking } from "./trail-map/hooks/use-location-tracking";
import { useKmMarkers } from "./trail-map/hooks/use-km-markers";
import { LoadingState } from "./trail-map/components/loading-state";
import { ErrorState } from "./trail-map/components/error-state";
import { MapControls } from "./trail-map/components/map-controls";
import { CourseInfo } from "./trail-map/components/course-info";

// TrailData를 그대로 사용 (타입 호환성 위해)

const TrailMapV2: React.FC<TrailMapProps> = ({ courseId, className = "" }) => {
  const [trailData, setTrailData] = useState<TrailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const mapRef = useRef<MapRef>(null);

  // Custom hooks
  const {
    kmMarkers,
    visibleKmMarkers,
    lastShownKm,
    setKmMarkers,
    resetKmMarkers,
    showKmMarker,
    hideAllKmMarkers,
  } = useKmMarkers();

  const {
    userLocation,
    locationButtonState,
    findMyLocation,
    resetLocation,
    setLocationButtonState,
  } = useLocationTracking(mapRef);

  const {
    isAnimating,
    isFullRouteView,
    animationProgress,
    savedProgress,
    startTrailAnimation,
    showFullRoute,
    stopAnimation,
  } = useTrailAnimation(mapRef, trailData, showKmMarker, resetKmMarkers, setKmMarkers);

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

  // 애니메이션 진행률에 따른 부분 GeoJSON 생성 (gpx_data_v2 기반)
  const getAnimatedGeoJSON = useCallback(() => {
    if (!trailData?.course?.gpx_data_v2?.points) return null;

    const coordinates = trailData.course.gpx_data_v2.points;

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
      totalPoints - 1
    );

    const currentCoordinates = coordinates.slice(
      0,
      Math.max(2, currentPointIndex + 1)
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

    if (!courseV2.gpx_data_v2?.points || courseV2.gpx_data_v2.points.length === 0) {
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
            coordinates: courseV2.gpx_data_v2.points.map((p) => [
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
      totalDistance: courseV2.gpx_data_v2.stats.totalDistance,
      elevationGain: courseV2.gpx_data_v2.stats.elevationGain,
      estimatedTime: courseV2.gpx_data_v2.stats.estimatedDuration,
      maxElevation: 0, // TODO: 계산하거나 기본값
      minElevation: 0, // TODO: 계산하거나 기본값
      elevationLoss: 0, // TODO: 계산하거나 기본값
      difficulty: courseV2.difficulty,
      bounds: courseV2.gpx_data_v2.bounds,
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
            : "트레일 데이터를 불러올 수 없습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadData();
    }
  }, [courseId]);

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
    return <LoadingState className={className} />;
  }

  if (error || !trailData) {
    return <ErrorState className={className} error={error || undefined} />;
  }

  // 시작/종료 포인트는 stats.bounds 또는 geoJSON에서 추출
  const coordinates = trailData.geoJSON.features[0]?.geometry.coordinates;
  const startPoint = coordinates?.[0] ? { lng: coordinates[0][0], lat: coordinates[0][1] } : null;
  const endPoint = coordinates?.length > 1 ? 
    { lng: coordinates[coordinates.length - 1][0], lat: coordinates[coordinates.length - 1][1] } : null;

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
            {/* 지도 */}
            <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
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
              </Map>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 코스 정보 Card */}
      <CourseInfo trailData={trailData} savedProgress={savedProgress} />
    </div>
  );
};

export default TrailMapV2;