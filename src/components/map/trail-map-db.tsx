"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Map, { Source, Layer, Marker, MapRef } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mountain,
  Route,
  Timer,
  Flag,
  Square,
  Eye,
  Navigation,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Course, CoursePoint } from "@/types";
import "mapbox-gl/dist/mapbox-gl.css";

// 비행 애니메이션 속도 제어 상수들
const FLIGHT_CONFIG = {
  // 기본 비행 속도 (포인트당 지속시간 ms) - 낮을수록 빠름
  BASE_DURATION_PER_POINT: 500, // 500ms로 더 천천히

  // 최소/최대 총 애니메이션 시간 (ms)
  MIN_TOTAL_DURATION: 80000, // 80초 최소 시간 (더 느리게)
  MAX_TOTAL_DURATION: 100000, // 100초

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
  geoJSON: TrailGeoJSON;
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

// 개별 좌표 타입
export type GpxCoordinate = {
  lat: number;
  lng: number;
  ele?: number | null; // 고도는 선택적
};

// 파싱 후 사용할 배열 타입
export type GpxCoordinates = GpxCoordinate[];

// GeoJSON 타입 정의
export type TrailGeoJSON = {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: {
      type: "LineString";
      coordinates: number[][];
    };
  }[];
};

const TrailMapDB: React.FC<TrailMapProps> = ({ courseId, className = "" }) => {
  // 모든 state를 먼저 정의
  const [trailData, setTrailData] = useState<TrailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFullRouteView, setIsFullRouteView] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [savedProgress, setSavedProgress] = useState(0); // 중단된 진행률 저장
  const [kmMarkers, setKmMarkers] = useState<
    { km: number; position: { lat: number; lng: number } }[]
  >([]); // km 지점 마커들
  const [visibleKmMarkers, setVisibleKmMarkers] = useState<Set<number>>(
    new Set()
  ); // 현재 보이는 km 지점들
  const [lastShownKm, setLastShownKm] = useState(0); // 마지막으로 표시된 km
  const [viewState, setViewState] = useState({
    longitude: 129.0,
    latitude: 35.2,
    zoom: 14,
    pitch: 0,
    bearing: 0,
  });

  // 모든 ref를 함께 정의
  const mapRef = useRef<MapRef>(null);
  const animationRef = useRef<number | null>(null);

  // 두 좌표 간 거리 계산 (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
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
    return R * c; // 미터 단위
  };

  // 경로상의 km 지점 좌표들 계산
  const calculateKmMarkers = (points: GpxCoordinate[] | CoursePoint[]) => {
    const markers: { km: number; position: { lat: number; lng: number } }[] =
      [];
    let cumulativeDistance = 0;
    let targetKm = 1;

    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];

      // CoursePoint는 latitude/longitude, GpxCoordinate는 lat/lng 사용
      const prevLat = "lat" in prevPoint ? prevPoint.lat : prevPoint.latitude;
      const prevLng = "lng" in prevPoint ? prevPoint.lng : prevPoint.longitude;
      const currLat =
        "lat" in currentPoint ? currentPoint.lat : currentPoint.latitude;
      const currLng =
        "lng" in currentPoint ? currentPoint.lng : currentPoint.longitude;

      const segmentDistance = calculateDistance(
        prevLat,
        prevLng,
        currLat,
        currLng
      );

      cumulativeDistance += segmentDistance;

      // 1km, 2km, 3km... 지점을 지났는지 확인
      while (cumulativeDistance >= targetKm * 1000 && targetKm <= 20) {
        // 최대 20km까지
        // 선형 보간으로 정확한 km 지점 좌표 계산
        const overDistance = cumulativeDistance - targetKm * 1000;
        const ratio = 1 - overDistance / segmentDistance;

        const lat = prevLat + (currLat - prevLat) * ratio;
        const lng = prevLng + (currLng - prevLng) * ratio;

        markers.push({
          km: targetKm,
          position: { lat, lng },
        });

        targetKm++;
      }
    }

    return markers;
  };

  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 데이터 로드 완료 후 자동 비행 시작 (초기 1회만)
  useEffect(() => {
    if (trailData && savedProgress === 0) {
      const timer = setTimeout(() => {
        startTrailAnimation();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [trailData]);

  // 비행 애니메이션 함수 (중단/재시작 지원)
  const startTrailAnimation = useCallback(() => {
    if (!trailData || isAnimating || !mapRef.current) return;

    setIsAnimating(true);
    setIsFullRouteView(false);
    setVisibleKmMarkers(new Set()); // km 마커 상태 리셋
    setLastShownKm(0);

    // gpx_coordinates에서 포인트 추출 (마커와 동일한 데이터 소스)
    let points: GpxCoordinate[] | CoursePoint[] = [];
    if (trailData.course.gpx_coordinates) {
      try {
        points = JSON.parse(trailData.course.gpx_coordinates);
      } catch {
        // fallback to trailData.points
        points = trailData.points;
      }
    } else {
      points = trailData.points;
    }

    // km 지점 마커들 미리 계산
    const calculatedKmMarkers = calculateKmMarkers(points);
    setKmMarkers(calculatedKmMarkers);

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

    // 저장된 진행률부터 시작 (중단된 지점부터 재시작)
    const startProgress = savedProgress;
    const startTime = Date.now() - startProgress * totalDuration;
    let currentIndex = Math.min(
      Math.floor(startProgress * (pointCount - 1)),
      pointCount - 1
    );

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const timeProgress = Math.min(elapsed / totalDuration, 1);

      // 시간 기반으로 현재 포인트 인덱스 계산
      currentIndex = Math.min(
        Math.floor(timeProgress * (pointCount - 1)),
        pointCount - 1
      );

      // 실제 포인트 기반 진행률 계산 (더 정확함)
      const actualProgress = currentIndex / (pointCount - 1);

      // 진행률 업데이트 (노선 그리기용)
      setAnimationProgress(actualProgress);

      if (timeProgress < 1 && currentIndex < pointCount - 1) {
        const point = points[currentIndex];

        // km 마커 표시 로직 (정확한 타이밍으로 수정)
        // 현재 포인트까지의 실제 누적 거리 계산
        let cumulativeDistance = 0;
        for (let i = 1; i <= currentIndex; i++) {
          const prevPt = points[i - 1];
          const currPt = points[i];

          const prevLat = "lat" in prevPt ? prevPt.lat : prevPt.latitude;
          const prevLng = "lng" in prevPt ? prevPt.lng : prevPt.longitude;
          const currLat = "lat" in currPt ? currPt.lat : currPt.latitude;
          const currLng = "lng" in currPt ? currPt.lng : currPt.longitude;

          cumulativeDistance += calculateDistance(
            prevLat,
            prevLng,
            currLat,
            currLng
          );
        }

        const currentKmMark = Math.floor(cumulativeDistance / 1000);

        // 새로운 km 지점을 지났는지 확인 (사라지지 않도록 수정)
        if (currentKmMark > lastShownKm && currentKmMark > 0) {
          setLastShownKm(currentKmMark);

          // 새 km 마커 표시 (계속 보이도록 수정)
          setVisibleKmMarkers((prev) => new Set([...prev, currentKmMark]));
          console.log(
            `🏃 ${currentKmMark}km 지점 통과! (실제 거리: ${(cumulativeDistance / 1000).toFixed(2)}km)`
          );
        }

        // 실시간 진행 상황 로깅 (10% 단위로)
        if (
          Math.floor(actualProgress * 10) !==
          Math.floor((actualProgress - 0.01) * 10)
        ) {
        }

        // CoursePoint는 latitude/longitude, GpxCoordinate는 lat/lng 사용
        const pointLat = "lat" in point ? point.lat : point.latitude;
        const pointLng = "lng" in point ? point.lng : point.longitude;

        map.easeTo({
          center: [pointLng, pointLat],
          zoom: FLIGHT_CONFIG.FLIGHT_ZOOM,
          pitch: FLIGHT_CONFIG.FLIGHT_PITCH,
          bearing: FLIGHT_CONFIG.FLIGHT_BEARING,
          duration: 200, // 더 부드러운 전환
          essential: true,
        });

        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 애니메이션 종료 시점 디버깅 정보
        const lastPoint = points[pointCount - 1];

        // 애니메이션 완료 - 마지막 포인트로 확실히 이동
        const lastPointLat =
          "lat" in lastPoint ? lastPoint.lat : lastPoint.latitude;
        const lastPointLng =
          "lng" in lastPoint ? lastPoint.lng : lastPoint.longitude;

        map.easeTo({
          center: [lastPointLng, lastPointLat],
          zoom: FLIGHT_CONFIG.FLIGHT_ZOOM,
          pitch: FLIGHT_CONFIG.FLIGHT_PITCH,
          bearing: FLIGHT_CONFIG.FLIGHT_BEARING,
          duration: 500, // 조금 더 긴 시간으로 확실한 이동
          essential: true,
        });

        // 애니메이션 완료 후 약간의 지연을 두고 전체보기로 전환
        setTimeout(() => {
          setIsAnimating(false);
          setIsFullRouteView(true);
          setAnimationProgress(1); // 전체 노선 표시
          setSavedProgress(0); // 완료 후 저장된 진행률 리셋

          // 완료 후 전체보기로 전환
          setTimeout(() => {
            showFullRoute();
          }, FLIGHT_CONFIG.COMPLETION_DELAY);
        }, 600); // easeTo 완료 후 실행
      }
    };

    // 저장된 위치가 있으면 해당 포인트로, 없으면 첫 번째 포인트로 이동
    const startPointIndex = Math.min(
      Math.floor(startProgress * pointCount),
      pointCount - 1
    );
    const startPoint = points[startPointIndex] || points[0];

    const startPointLat =
      "lat" in startPoint ? startPoint.lat : startPoint.latitude;
    const startPointLng =
      "lng" in startPoint ? startPoint.lng : startPoint.longitude;

    map.easeTo({
      center: [startPointLng, startPointLat],
      zoom: FLIGHT_CONFIG.FLIGHT_ZOOM,
      pitch: FLIGHT_CONFIG.FLIGHT_PITCH,
      bearing: FLIGHT_CONFIG.FLIGHT_BEARING,
      duration: startProgress > 0 ? 200 : 500, // 재시작이면 0.2초, 처음이면 0.5초
      essential: true,
    });

    // 애니메이션 시작 (재시작이면 0.2초, 처음이면 0.5초 후)
    setTimeout(
      () => {
        animationRef.current = requestAnimationFrame(animate);
      },
      startProgress > 0 ? 200 : 500
    );
  }, [trailData, isAnimating, savedProgress]);

  // 전체 경로 보기 (애니메이션 중단 시 진행률 저장)
  const showFullRoute = useCallback(() => {
    if (!trailData || !mapRef.current) return;

    // 진행 중인 애니메이션 중단하고 현재 진행률 저장
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;

      // 현재 진행률이 100%가 아니라면 저장 (중단된 상태)
      if (animationProgress < 1 && animationProgress > 0) {
        setSavedProgress(animationProgress);
      }
    }

    setIsAnimating(false);
    setIsFullRouteView(true);
    setAnimationProgress(1); // 전체 노선 표시
    setVisibleKmMarkers(new Set()); // km 마커 숨기기

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
  }, [trailData, animationProgress]);

  // 애니메이션 진행률에 따른 부분 GeoJSON 생성 (gpx_coordinates 기반)
  const getAnimatedGeoJSON = useCallback(() => {
    if (!trailData?.course?.gpx_coordinates) return null;

    // gpx_coordinates에서 좌표 파싱
    let coordinates: GpxCoordinate[] = [];
    try {
      coordinates = JSON.parse(trailData.course.gpx_coordinates);
    } catch (e) {
      console.error("Failed to parse gpx_coordinates for GeoJSON:", e);
      return null;
    }

    // 애니메이션 중이 아니거나 완료되었으면 전체 노선 표시
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

    // 애니메이션 중이면 진행률에 따라 부분 노선만 표시
    const totalPoints = coordinates.length;
    const currentPointIndex = Math.min(
      Math.floor(animationProgress * (totalPoints - 1)),
      totalPoints - 1
    );

    // 현재까지의 좌표들만 포함 (최소 2개 포인트는 보장)
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

  // 트레일 라인 스타일
  const trailLineLayer = {
    id: "trail-line",
    type: "line" as const,
    paint: {
      "line-color": "#ff004b",
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
      "line-color": "#B8860B",
      "line-width": 6,
      "line-opacity": 0.7,
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
              {/* 지도 위 컨트롤 버튼 */}
              <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={
                    isAnimating
                      ? showFullRoute
                      : isFullRouteView
                        ? startTrailAnimation
                        : showFullRoute
                  }
                  className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
                  title={
                    isAnimating
                      ? "비행 중단하고 전체보기"
                      : isFullRouteView
                        ? savedProgress > 0
                          ? `경로 추적 재시작 (${(savedProgress * 100).toFixed(0)}%부터)`
                          : "경로 추적 비행"
                        : "전체보기"
                  }
                >
                  {isAnimating ? (
                    <Square className="w-4 h-4" />
                  ) : isFullRouteView ? (
                    <Navigation className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>

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
                    const coords = JSON.parse(trailData.course.gpx_coordinates);
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
                    const coords = JSON.parse(trailData.course.gpx_coordinates);
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
            </Map>
          </div>

          {/* 코스 정보 푸터 */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-t">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  {trailData.course.title}
                </h3>

                {/* 속도 설정 및 진행률 표시 (개발용) */}
                <div className="text-xs text-gray-500 text-right">
                  <div>속도: {FLIGHT_CONFIG.BASE_DURATION_PER_POINT}ms/pt</div>
                  {savedProgress > 0 && (
                    <div>저장됨: {(savedProgress * 100).toFixed(0)}%</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      {trailData.stats.totalDistance.toFixed(1)} km
                    </div>
                    <div className="text-xs text-gray-500">거리</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      {formatTime(trailData.stats.estimatedTime)}
                    </div>
                    <div className="text-xs text-gray-500">예상 시간</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      +{trailData.stats.elevationGain.toFixed(0)}m
                    </div>
                    <div className="text-xs text-gray-500">고도 상승</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      trailData.course.difficulty === "easy"
                        ? "bg-green-500"
                        : trailData.course.difficulty === "medium"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-gray-800 capitalize">
                      {trailData.stats.difficulty}
                    </div>
                    <div className="text-xs text-gray-500">난이도</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 코스 설명 */}
            {trailData.course.description && (
              <div className="pt-4 border-t border-gray-200">
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
