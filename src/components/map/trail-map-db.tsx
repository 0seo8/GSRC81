"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Map, { Source, Layer, Marker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mountain,
  Route,
  Timer,
  MapPin,
  Flag,
  ZoomIn,
  ZoomOut,
  Compass,
  Play,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Course, CoursePoint } from "@/types";
import "mapbox-gl/dist/mapbox-gl.css";

// 비행 애니메이션 속도 제어 상수들
const FLIGHT_CONFIG = {
  // 기본 비행 속도 (포인트당 지속시간 ms) - 낮을수록 빠름
  BASE_DURATION_PER_POINT: 120,
  
  // 최소/최대 총 애니메이션 시간 (ms)
  MIN_TOTAL_DURATION: 8000,  // 8초
  MAX_TOTAL_DURATION: 25000, // 25초
  
  // 카메라 설정
  FLIGHT_ZOOM: 16,
  FLIGHT_PITCH: 60,
  FLIGHT_BEARING: 0,
  
  // 애니메이션 완료 후 전체보기 전환 지연시간
  COMPLETION_DELAY: 1500,
} as const;

interface TrailMapProps {
  courseId: string;
  className?: string;
}

interface TrailData {
  course: Course;
  points: CoursePoint[];
  geoJSON: any;
  stats: {
    totalDistance: number;
    elevationGain: number;
    estimatedTime: number;
    maxElevation: number;
    minElevation: number;
    elevationLoss: number;
    difficulty: string;
    bounds: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
  };
}

const TrailMapDB: React.FC<TrailMapProps> = ({ courseId, className = "" }) => {
  // 모든 state를 먼저 정의
  const [trailData, setTrailData] = useState<TrailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFullRouteView, setIsFullRouteView] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [viewState, setViewState] = useState({
    longitude: 129.0,
    latitude: 35.2,
    zoom: 14,
    pitch: 0,
    bearing: 0,
  });

  // 모든 ref를 함께 정의
  const mapRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  // 모든 useEffect를 먼저 정의 (데이터 로드)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await loadCourseData(courseId);
        setTrailData(data);

        // 지도 중심과 줌 레벨 설정
        const bounds = data.stats.bounds;
        const centerLon = (bounds.minLon + bounds.maxLon) / 2;
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;
        
        // 줌 레벨 계산
        const latDiff = bounds.maxLat - bounds.minLat;
        const lonDiff = bounds.maxLon - bounds.minLon;
        const maxDiff = Math.max(latDiff, lonDiff);
        let zoom = 14;
        if (maxDiff < 0.001) zoom = 17;
        else if (maxDiff < 0.005) zoom = 16;
        else if (maxDiff < 0.01) zoom = 15;
        else if (maxDiff < 0.05) zoom = 13;

        setViewState((prev) => ({
          ...prev,
          longitude: centerLon,
          latitude: centerLat,
          zoom: Math.min(zoom + 1, 17),
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

  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 데이터 로드 완료 후 자동 비행 시작
  useEffect(() => {
    if (trailData && !isAnimating && !isFullRouteView) {
      const timer = setTimeout(() => {
        startTrailAnimation();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [trailData, isAnimating, isFullRouteView]);

  // 비행 애니메이션 함수 (공통 속도 제어 적용)
  const startTrailAnimation = useCallback(() => {
    if (!trailData || isAnimating || !mapRef.current) return;

    setIsAnimating(true);
    setIsFullRouteView(false);
    setAnimationProgress(0); // 진행률 초기화

    const points = trailData.points;
    if (points.length === 0) return;

    const map = mapRef.current.getMap();
    
    // 코스 길이에 관계없이 일정한 속도로 애니메이션
    const pointCount = points.length;
    const totalDuration = Math.min(
      Math.max(
        pointCount * FLIGHT_CONFIG.BASE_DURATION_PER_POINT,
        FLIGHT_CONFIG.MIN_TOTAL_DURATION
      ),
      FLIGHT_CONFIG.MAX_TOTAL_DURATION
    );
    
    const startTime = Date.now();
    let currentIndex = 0;

    console.log(`Flight animation - Points: ${pointCount}, Duration: ${totalDuration}ms, Speed: ${(totalDuration/pointCount).toFixed(1)}ms per point`);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      
      // 진행률 업데이트 (노선 그리기용)
      setAnimationProgress(progress);
      
      // 진행률에 따른 현재 포인트 인덱스 계산
      currentIndex = Math.floor(progress * (pointCount - 1));
      
      if (currentIndex < pointCount && progress < 1) {
        const point = points[currentIndex];
        
        map.easeTo({
          center: [point.longitude, point.latitude],
          zoom: FLIGHT_CONFIG.FLIGHT_ZOOM,
          pitch: FLIGHT_CONFIG.FLIGHT_PITCH,
          bearing: FLIGHT_CONFIG.FLIGHT_BEARING,
          duration: 100, // 부드러운 전환을 위한 짧은 지속시간
          essential: true,
        });

        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 애니메이션 완료
        setIsAnimating(false);
        setIsFullRouteView(true);
        setAnimationProgress(1); // 전체 노선 표시
        
        // 완료 후 전체보기로 전환
        setTimeout(() => {
          showFullRoute();
        }, FLIGHT_CONFIG.COMPLETION_DELAY);
      }
    };

    // 첫 번째 포인트로 이동 후 애니메이션 시작
    const firstPoint = points[0];
    map.easeTo({
      center: [firstPoint.longitude, firstPoint.latitude],
      zoom: FLIGHT_CONFIG.FLIGHT_ZOOM,
      pitch: FLIGHT_CONFIG.FLIGHT_PITCH,
      bearing: FLIGHT_CONFIG.FLIGHT_BEARING,
      duration: 2000,
      essential: true,
    });

    // 2초 후 애니메이션 시작
    setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, 2000);
    
  }, [trailData, isAnimating]);

  // 전체 경로 보기
  const showFullRoute = useCallback(() => {
    if (!trailData || !mapRef.current) return;

    // 진행 중인 애니메이션 중단
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsAnimating(false);
    setIsFullRouteView(true);

    const bounds = trailData.stats.bounds;
    const padding = 0.001;
    const adjustedBounds = {
      minLon: bounds.minLon - padding,
      maxLon: bounds.maxLon + padding,
      minLat: bounds.minLat - padding,
      maxLat: bounds.maxLat + padding,
    };

    mapRef.current.getMap().fitBounds(
      [
        [adjustedBounds.minLon, adjustedBounds.minLat],
        [adjustedBounds.maxLon, adjustedBounds.maxLat],
      ],
      {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        pitch: 0,
        bearing: 0,
        duration: 1000,
        essential: true,
      }
    );
  }, [trailData]);


  // 애니메이션 진행률에 따른 부분 GeoJSON 생성
  const getAnimatedGeoJSON = useCallback(() => {
    if (!trailData?.geoJSON) return null;
    
    // 애니메이션 중이 아니거나 완료되었으면 전체 노선 표시
    if (!isAnimating || animationProgress === 1) {
      return trailData.geoJSON;
    }
    
    // 애니메이션 중이면 진행률에 따라 부분 노선만 표시
    const originalCoordinates = trailData.geoJSON.features[0].geometry.coordinates;
    const totalPoints = originalCoordinates.length;
    const currentPointIndex = Math.floor(animationProgress * totalPoints);
    
    // 현재까지의 좌표들만 포함
    const animatedCoordinates = originalCoordinates.slice(0, Math.max(1, currentPointIndex + 1));
    
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: animatedCoordinates,
          },
        },
      ],
    };
  }, [trailData, isAnimating, animationProgress]);

  const onMapLoad = useCallback(() => {
    if (!mapRef.current) return;
    // 맵 로드 완료 후 추가 설정
  }, []);

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

    // 3. 데이터가 없으면 gpx_coordinates에서 fallback
    let finalPoints = points || [];
    if ((!points || points.length === 0) && course.gpx_coordinates) {
      try {
        const coordinates = JSON.parse(course.gpx_coordinates);
        finalPoints = coordinates.map((coord: any, index: number) => ({
          id: `${courseId}-${index}`,
          course_id: courseId,
          seq: index,
          latitude: coord.lat,
          longitude: coord.lng || coord.lon,
          elevation: coord.ele || null,
          created_at: course.created_at,
        }));
      } catch (e) {
        console.error("GPX coordinates parsing error:", e);
      }
    }

    if (finalPoints.length === 0) {
      throw new Error("코스 경로 데이터가 없습니다.");
    }

    // 4. GeoJSON 생성
    const geoJSON = {
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

  // 통계 계산 함수
  const calculateStats = (points: CoursePoint[], course: Course) => {
    const elevations = points
      .filter((p) => p.elevation)
      .map((p) => p.elevation!);
    const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0;
    const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0;

    // 고도 상승/하강 계산
    let elevationGain = 0;
    let elevationLoss = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].elevation && points[i - 1].elevation) {
        const diff = points[i].elevation! - points[i - 1].elevation!;
        if (diff > 0) elevationGain += diff;
        else elevationLoss += Math.abs(diff);
      }
    }

    // 경계 계산
    const bounds = {
      minLat: Math.min(...points.map((p) => p.latitude)),
      maxLat: Math.max(...points.map((p) => p.latitude)),
      minLon: Math.min(...points.map((p) => p.longitude)),
      maxLon: Math.max(...points.map((p) => p.longitude)),
    };

    // 난이도 텍스트 변환
    const difficultyMap = {
      easy: "Easy",
      medium: "Moderate",
      hard: "Hard",
    };

    return {
      totalDistance: course.distance_km,
      elevationGain: course.elevation_gain || elevationGain,
      estimatedTime: (course.avg_time_min || 60) / 60, // 시간 단위로 변환
      maxElevation,
      minElevation,
      elevationLoss,
      difficulty: difficultyMap[course.difficulty] || course.difficulty,
      bounds,
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

        // 지도 중심과 줌 레벨 설정
        const bounds = data.stats.bounds;
        const centerLon = (bounds.minLon + bounds.maxLon) / 2;
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;

        // 줌 레벨 계산
        const latDiff = bounds.maxLat - bounds.minLat;
        const lonDiff = bounds.maxLon - bounds.minLon;
        const maxDiff = Math.max(latDiff, lonDiff);
        let zoom = 14;
        if (maxDiff < 0.001) zoom = 17;
        else if (maxDiff < 0.005) zoom = 16;
        else if (maxDiff < 0.01) zoom = 15;
        else if (maxDiff < 0.05) zoom = 13;

        setViewState((prev) => ({
          ...prev,
          longitude: centerLon,
          latitude: centerLat,
          zoom: Math.min(zoom + 1, 17),
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

  // 지도 줌 컨트롤
  const zoomIn = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.zoomIn();
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.zoomOut();
    }
  }, []);

  const resetNorth = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      bearing: 0,
    }));
  }, []);


  // 트레일 라인 스타일
  const trailLineLayer = {
    id: "trail-line",
    type: "line" as const,
    paint: {
      "line-color": "#ff6b35",
      "line-width": 4,
      "line-opacity": 0.8,
    },
    layout: {
      "line-join": "round" as const,
      "line-cap": "round" as const,
    },
  };

  const trailOutlineLayer = {
    id: "trail-outline",
    type: "line" as const,
    paint: {
      "line-color": "#333333",
      "line-width": 6,
      "line-opacity": 0.6,
    },
    layout: {
      "line-join": "round" as const,
      "line-cap": "round" as const,
    },
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !trailData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <Mountain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              지도를 로드할 수 없습니다
            </h3>
            <p className="text-gray-500">
              {error || "코스 데이터를 찾을 수 없습니다."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }


  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardContent className="p-0">
          {/* 헤더 */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {trailData.course.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Route className="w-4 h-4" />
                    <span>{trailData.stats.totalDistance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mountain className="w-4 h-4" />
                    <span>+{trailData.stats.elevationGain.toFixed(0)}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    <span>{formatTime(trailData.stats.estimatedTime)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isFullRouteView ? startTrailAnimation : showFullRoute}
                  disabled={isAnimating}
                  className="text-xs"
                >
                  <Play className="w-3 h-3 mr-1" />
                  {isAnimating
                    ? "지형 추적 중..."
                    : isFullRouteView
                    ? "경로 추적 비행"
                    : "전체보기"}
                </Button>
                
                {/* 속도 설정 표시 (개발용) */}
                <span className="text-xs text-gray-500">
                  속도: {FLIGHT_CONFIG.BASE_DURATION_PER_POINT}ms/pt
                </span>
              </div>
            </div>
          </div>

          {/* 지도 */}
          <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
            <Map
              ref={mapRef}
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/light-v11"
              onLoad={onMapLoad}
              doubleClickZoom={false}
              attributionControl={false}
            >
              {/* 경로 추적 버튼 */}
              <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isFullRouteView ? startTrailAnimation : showFullRoute}
                  disabled={isAnimating}
                  className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white disabled:opacity-50"
                  title={isAnimating ? "비행 중..." : isFullRouteView ? "경로 추적 비행" : "전체보기"}
                >
                  <Mountain className="w-4 h-4" />
                </Button>
              </div>

              {/* 트레일 레이어 (애니메이션에 따라 동적 렌더링) */}
              {(() => {
                const geoJSONData = getAnimatedGeoJSON();
                return (
                  geoJSONData && (
                    <Source
                      id="trail"
                      type="geojson"
                      data={geoJSONData}
                    >
                      <Layer {...trailOutlineLayer} />
                      <Layer {...trailLineLayer} />
                    </Source>
                  )
                );
              })()}

              {/* 시작점 마커 */}
              {trailData.course.start_latitude &&
                trailData.course.start_longitude && (
                  <Marker
                    longitude={trailData.course.start_longitude}
                    latitude={trailData.course.start_latitude}
                    anchor="bottom"
                  >
                    <div className="bg-green-500 text-white rounded-full p-2 shadow-lg border-2 border-white">
                      <Flag className="w-4 h-4" />
                    </div>
                  </Marker>
                )}

              {/* 종료점 마커 */}
              {trailData.course.end_latitude &&
                trailData.course.end_longitude && (
                  <Marker
                    longitude={trailData.course.end_longitude}
                    latitude={trailData.course.end_latitude}
                    anchor="bottom"
                  >
                    <div className="bg-red-500 text-white rounded-full p-2 shadow-lg border-2 border-white">
                      <Flag className="w-4 h-4" />
                    </div>
                  </Marker>
                )}
            </Map>
          </div>

          {/* 코스 정보 - 지도 바깥으로 이동 */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {trailData.course.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Route className="w-4 h-4" />
                    <span>{trailData.stats.totalDistance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mountain className="w-4 h-4" />
                    <span>+{trailData.stats.elevationGain.toFixed(0)}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    <span>{formatTime(trailData.stats.estimatedTime)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 상세 통계 */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800">
                  {trailData.stats.maxElevation.toFixed(0)}m
                </div>
                <div className="text-xs text-gray-600">최고 고도</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800">
                  {trailData.stats.minElevation.toFixed(0)}m
                </div>
                <div className="text-xs text-gray-600">최저 고도</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  +{trailData.stats.elevationGain.toFixed(0)}m
                </div>
                <div className="text-xs text-gray-600">누적 상승</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">
                  -{trailData.stats.elevationLoss.toFixed(0)}m
                </div>
                <div className="text-xs text-gray-600">누적 하강</div>
              </div>
            </div>

            {/* 코스 설명 */}
            {trailData.course.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {trailData.course.description}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TrailMapDB;
