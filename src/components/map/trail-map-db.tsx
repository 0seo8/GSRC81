"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Map, { Source, Layer, Marker, MapRef } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Course, CoursePoint } from "@/types";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  TrailMapProps,
  TrailData,
  GpxCoordinate,
  TrailGeoJSON,
} from "./trail-map/types";
import { INITIAL_VIEW_STATE, MAP_STYLES } from "./trail-map/constants";
import { calculateStats } from "./trail-map/utils";
import { useTrailAnimation } from "./trail-map/hooks/use-trail-animation";
import { useLocationTracking } from "./trail-map/hooks/use-location-tracking";
import { useKmMarkers } from "./trail-map/hooks/use-km-markers";
import { LoadingState } from "./trail-map/components/loading-state";
import { ErrorState } from "./trail-map/components/error-state";
import { MapControls } from "./trail-map/components/map-controls";
import { CourseInfo } from "./trail-map/components/course-info";

const TrailMapDB: React.FC<TrailMapProps> = ({ courseId, className = "" }) => {
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
  } = useTrailAnimation(mapRef, trailData, showKmMarker, resetKmMarkers);

  // 위치/경로보기 버튼 클릭 핸들러
  const handleLocationRouteButton = useCallback(() => {
    if (locationButtonState === "location") {
      findMyLocation();
    } else {
      resetLocation();
      showFullRoute();
    }
  }, [locationButtonState, findMyLocation, resetLocation, showFullRoute]);

  // 데이터 로드 완료 후 지도 다시 로드 트리거 (onMapLoad에서 fitBounds 실행됨)
  useEffect(() => {
    if (trailData && mapRef.current) {
      // 지도가 이미 로드된 상태에서 데이터가 들어온 경우에만 직접 호출
      const map = mapRef.current.getMap();
      if (map.isStyleLoaded()) {
        setTimeout(() => {
          showFullRoute();
        }, 100);
      }
    }
  }, [trailData, showFullRoute]);

  // 애니메이션 진행률에 따른 부분 GeoJSON 생성
  const getAnimatedGeoJSON = useCallback(() => {
    if (!trailData?.course?.gpx_coordinates) return null;

    let coordinates: GpxCoordinate[] = [];
    try {
      coordinates = JSON.parse(trailData.course.gpx_coordinates);
    } catch (e) {
      console.error("Failed to parse gpx_coordinates for GeoJSON:", e);
      return null;
    }

    if (!isAnimating || animationProgress === 1) {
      return {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: coordinates.map((coord) => [
                coord.lng,
                coord.lat,
                coord.ele || 0,
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
            coordinates: currentCoordinates.map((coord) => [
              coord.lng,
              coord.lat,
              coord.ele || 0,
            ]),
          },
        },
      ],
    };
  }, [trailData, isAnimating, animationProgress]);

  const onMapLoad = useCallback(() => {
    if (!mapRef.current || !trailData) return;

    // 지도 로드 완료 후 전체 경로가 보이도록 fitBounds 실행
    setTimeout(() => {
      showFullRoute();
    }, 100);
  }, [trailData, showFullRoute]);

  // DB에서 코스 데이터 로드
  const loadCourseData = async (courseId: string): Promise<TrailData> => {
    // 1. 코스 기본 정보 로드
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .eq("is_active", true)
      .single();

    if (courseError || !course) {
      throw new Error("코스를 찾을 수 없습니다.");
    }

    // 2. 코스 포인트 로드
    const { data: points, error: pointsError } = await supabase
      .from("course_points")
      .select("*")
      .eq("course_id", courseId)
      .order("seq", { ascending: true });

    if (pointsError) {
      throw new Error("코스 경로 데이터를 불러올 수 없습니다.");
    }

    // 3. 데이터가 없으면 gpx_coordinates에서 fallback (주의: gpx_coordinates는 불완전할 수 있음)
    let finalPoints = points || [];
    if ((!points || points.length === 0) && course.gpx_coordinates) {
      try {
        const coordinates = JSON.parse(course.gpx_coordinates);
        console.warn(
          `⚠️ Using incomplete gpx_coordinates fallback: ${coordinates.length} points vs expected full route`
        );
        finalPoints = coordinates.map(
          (coord: GpxCoordinate, index: number) => ({
            id: `${courseId}-${index}`,
            course_id: courseId,
            seq: index,
            latitude: coord.lat,
            longitude: coord.lng,
            elevation: coord.ele || null,
            created_at: course.created_at,
          })
        );
      } catch (e) {
        console.error("GPX coordinates parsing error:", e);
      }
    }

    if (finalPoints.length === 0) {
      throw new Error("코스 경로 데이터가 없습니다.");
    }

    // 4. GeoJSON 생성
    const geoJSON: TrailGeoJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: finalPoints.map((p) => [
              p.longitude,
              p.latitude,
              p.elevation || 0,
            ]),
          },
        },
      ],
    };

    // 5. 통계 계산
    const stats = calculateStats(finalPoints, course);

    return {
      course,
      points: finalPoints,
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

        // 초기 중심점 설정 (나중에 fitBounds로 덮어씌워짐)
        const bounds = data.stats.bounds;
        const centerLon = (bounds.minLon + bounds.maxLon) / 2;
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;

        // 경로 범위에 맞는 대략적인 줌 레벨 계산
        const latRange = bounds.maxLat - bounds.minLat;
        const lonRange = bounds.maxLon - bounds.minLon;
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

        // 원래 TrailMap처럼 onMapLoad에서 자동 비행 시작 (주석처리)
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

                {/* 트레일 레이어 (애니메이션에 따라 동적 렌더링) */}
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

                {/* 시작점 마커 (gpx_coordinates 기반 - 애니메이션과 동일) */}
                {trailData.course.gpx_coordinates &&
                  (() => {
                    try {
                      const coords = JSON.parse(
                        trailData.course.gpx_coordinates
                      );
                      if (coords.length > 0) {
                        return (
                          <Marker
                            longitude={coords[0].lng}
                            latitude={coords[0].lat}
                            anchor="bottom"
                          >
                            <div className="bg-green-500 text-white rounded-full p-2 shadow-lg border-2 border-white">
                              <Flag className="w-4 h-4" />
                            </div>
                          </Marker>
                        );
                      }
                    } catch (e) {
                      console.error(
                        "Failed to parse start point from gpx_coordinates:",
                        e
                      );
                    }
                    return null;
                  })()}

                {/* 종료점 마커 (gpx_coordinates 기반 - 애니메이션과 동일) */}
                {trailData.course.gpx_coordinates &&
                  (() => {
                    try {
                      const coords = JSON.parse(
                        trailData.course.gpx_coordinates
                      );
                      if (coords.length > 1) {
                        const lastCoord = coords[coords.length - 1];
                        return (
                          <Marker
                            longitude={lastCoord.lng}
                            latitude={lastCoord.lat}
                            anchor="bottom"
                          >
                            <div className="bg-red-500 text-white rounded-full p-2 shadow-lg border-2 border-white">
                              <Flag className="w-4 h-4" />
                            </div>
                          </Marker>
                        );
                      }
                    } catch (e) {
                      console.error(
                        "Failed to parse end point from gpx_coordinates:",
                        e
                      );
                    }
                    return null;
                  })()}

                {/* km 지점 마커들 (비행 중 지나갈 때만 잠깐 표시) */}
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

        {/* 코스 정보 Card (별도 분리) */}
      </motion.div>
      <CourseInfo trailData={trailData} savedProgress={savedProgress} />
    </div>
  );
};

export default TrailMapDB;
