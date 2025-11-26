import React, { useEffect, useState, useRef, useCallback } from "react";
import Map, { Source, Layer, Marker, MapRef } from "react-map-gl/mapbox";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mountain,
  Eye,
  Coffee,
  Trees,
  Droplets,
  Utensils,
  AlertTriangle,
  Flag,
  Navigation,
  Trophy,
} from "lucide-react";
import {
  loadGPXData,
  TrailData,
  calculateZoomLevel,
  POIPoint,
  TrailPoint,
} from "@/lib/gpx-loader";

import "mapbox-gl/dist/mapbox-gl.css";

interface TrailMapProps {
  courseId: string;
  className?: string;
  hoveredPoint?: {
    lat: number;
    lon: number;
    elevation: number;
    distance: number;
  } | null;
}

// POI 타입별 아이콘과 색상 매핑
const POI_CONFIG = {
  start: { icon: Flag, color: "bg-green-500", textColor: "text-green-100" },
  end: { icon: Flag, color: "bg-red-500", textColor: "text-red-100" },
  viewpoint: { icon: Eye, color: "bg-blue-500", textColor: "text-blue-100" },
  rest: { icon: Coffee, color: "bg-gray-500", textColor: "text-gray-100" },
  landmark: {
    icon: Trees,
    color: "bg-purple-500",
    textColor: "text-purple-100",
  },
  water: { icon: Droplets, color: "bg-cyan-500", textColor: "text-cyan-100" },
  food: {
    icon: Utensils,
    color: "bg-yellow-500",
    textColor: "text-yellow-100",
  },
  danger: {
    icon: AlertTriangle,
    color: "bg-red-600",
    textColor: "text-red-100",
  },
  waypoint: {
    icon: Navigation,
    color: "bg-gray-500",
    textColor: "text-gray-100",
  },
};

// POI 마커 컴포넌트
const POIMarker: React.FC<{ poi: POIPoint; onClick?: () => void }> = ({
  poi,
  onClick,
}) => {
  const config = POI_CONFIG[poi.type];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={`
        ${config.color} ${config.textColor} 
        rounded-full p-2 shadow-lg border-2 border-white cursor-pointer
        hover:scale-110 transition-transform duration-200
        relative group
      `}
      onClick={onClick}
      style={{ width: "32px", height: "32px" }}
    >
      <IconComponent className="w-4 h-4" />

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        {poi.name}
        {poi.elevation && (
          <div className="text-xs opacity-75">{Math.round(poi.elevation)}m</div>
        )}
      </div>
    </motion.div>
  );
};

const TrailMap: React.FC<TrailMapProps> = ({
  courseId,
  className = "",
  hoveredPoint,
}) => {
  const [trailData, setTrailData] = useState<TrailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [selectedPOI, setSelectedPOI] = useState<POIPoint | null>(null);
  const [showPOIs] = useState(true);
  const mapRef = useRef<MapRef>(null);
  const animationRef = useRef<number | null>(null);

  // 실시간 트레킹 정보 - 주석처리된 UI에서 사용
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentDistance, setCurrentDistance] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [elapsedTime, setElapsedTime] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentElevation, setCurrentElevation] = useState(0);

  // 완주 이펙트
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);

  // 전체 루트 보기 상태 추적
  const [isFullRouteView, setIsFullRouteView] = useState(false);

  // 애니메이션 시작 트리거
  const shouldStartAnimation = useRef(false);

  const [viewState, setViewState] = useState({
    longitude: 129.0,
    latitude: 35.2,
    zoom: 14, // 적당한 거리에서 시작
    pitch: 60, // 고저차가 잘 보이는 각도
    bearing: -15, // 약간 기울여서 입체감 증가
  });

  // GPX 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await loadGPXData(courseId);
        setTrailData(data);

        // 지도 중심과 줌 레벨 설정
        const bounds = data.stats.bounds;
        const centerLon = (bounds.minLon + bounds.maxLon) / 2;
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;
        const baseZoom = calculateZoomLevel(bounds);
        // 적당한 거리에서 보기 위해 줌 레벨을 적절히 조정
        const adjustedZoom = Math.min(baseZoom + 1, 15);

        setViewState((prev) => ({
          ...prev,
          longitude: centerLon,
          latitude: centerLat,
          zoom: adjustedZoom,
          // 3D 모드일 때 고저차가 잘 보이도록 각도 유지
          pitch: is3D ? 65 : prev.pitch,
          bearing: is3D ? -15 : prev.bearing,
        }));

        // 데이터 로드 후 즉시 애니메이션 시작 (지도 렌더링 완료를 위해 짧은 지연)
        // startTrailAnimation은 자동으로 시작하지 않음 - 사용자가 버튼을 클릭하거나 맵이 로드되면 시작
      } catch (err) {
        console.error("Failed to load trail data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load trail data",
        );
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadData();
    }
  }, [courseId, is3D]);

  // 3D 토글 - 입체적 지형뷰와 2D 뷰 전환 (주석처리된 UI에서 사용)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggle3D = useCallback(() => {
    setIs3D((prev) => {
      const new3D = !prev;
      setViewState((prevState) => ({
        ...prevState,
        pitch: new3D ? 65 : 0, // 고저차가 더 잘 보이는 65도
        bearing: new3D ? -15 : 0, // 약간 기울여서 입체감 증가
      }));
      return new3D;
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resetNorth = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      bearing: 0,
    }));
  }, []);

  // 전체 루트 보기 ↔ 애니메이션 토글
  const toggleRouteView = useCallback(() => {
    if (!trailData || !mapRef.current) return;

    if (isFullRouteView) {
      // 현재 전체보기 상태 → 애니메이션 시작
      setIsFullRouteView(false);
      shouldStartAnimation.current = true;
    } else {
      // 현재 애니메이션 상태 → 전체보기로 전환
      setIsFullRouteView(true);

      // 현재 진행 중인 애니메이션 중단
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setIsAnimating(false);
      setAnimationProgress(1);

      const bounds = trailData.stats.bounds;
      const padding = 0.001;
      const adjustedBounds = {
        minLon: bounds.minLon - padding,
        maxLon: bounds.maxLon + padding,
        minLat: bounds.minLat - padding,
        maxLat: bounds.maxLat + padding,
      };

      // 전체 루트가 보이도록 설정
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
        },
      );
    }
  }, [isFullRouteView, trailData]);

  // 두 점 사이의 방향 계산 (베어링)
  const calculateBearing = useCallback(
    (startLat: number, startLon: number, endLat: number, endLon: number) => {
      const startLatRad = (startLat * Math.PI) / 180;
      const startLonRad = (startLon * Math.PI) / 180;
      const endLatRad = (endLat * Math.PI) / 180;
      const endLonRad = (endLon * Math.PI) / 180;

      const deltaLon = endLonRad - startLonRad;

      const y = Math.sin(deltaLon) * Math.cos(endLatRad);
      const x =
        Math.cos(startLatRad) * Math.sin(endLatRad) -
        Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(deltaLon);

      const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      return bearing;
    },
    [],
  );

  // 지형 특성 분석 - 현재 위치 주변의 고도 변화를 분석
  const analyzeTerrainCharacteristics = useCallback(
    (points: TrailPoint[], currentIndex: number, windowSize: number = 10) => {
      if (!points || points.length === 0)
        return {
          elevationVariance: 0,
          avgElevation: 0,
          elevationRange: 0,
          isHighTerrain: false,
          terrainRoughness: 0,
        };

      const start = Math.max(0, currentIndex - windowSize);
      const end = Math.min(points.length, currentIndex + windowSize);
      const window = points.slice(start, end);

      if (window.length === 0)
        return {
          elevationVariance: 0,
          avgElevation: 0,
          elevationRange: 0,
          isHighTerrain: false,
          terrainRoughness: 0,
        };

      // 평균 고도 계산
      const avgElevation =
        window.reduce((sum: number, p: TrailPoint) => sum + (p.ele || 0), 0) /
        window.length;

      // 고도 변화량 계산 (분산)
      const elevationVariance =
        window.reduce((sum: number, p: TrailPoint) => {
          const diff = (p.ele || 0) - avgElevation;
          return sum + diff * diff;
        }, 0) / window.length;

      // 최고점과 최저점의 차이
      const elevations = window.map((p: TrailPoint) => p.ele || 0);
      const minEle = Math.min(...elevations);
      const maxEle = Math.max(...elevations);
      const elevationRange = maxEle - minEle;

      // 고지대 여부 판단 (평균 고도 + 고도 변화량 고려)
      const isHighTerrain =
        avgElevation > 300 || elevationRange > 100 || elevationVariance > 2500;

      return {
        elevationVariance,
        avgElevation,
        elevationRange,
        isHighTerrain,
        terrainRoughness: Math.sqrt(elevationVariance), // 지형 험준도
      };
    },
    [],
  );

  // 지형에 따른 카메라 설정 계산 - 비행하는 느낌을 위해 조정
  const calculateCameraSettings = useCallback(
    (
      terrainData: {
        elevationVariance: number;
        avgElevation: number;
        elevationRange: number;
        isHighTerrain: boolean;
        terrainRoughness: number;
      },
      currentElevation: number,
    ) => {
      const baseZoom = 15.5; // 더 넓은 시야로 비행감 증대
      const basePitch = 55; // 낮은 각도로 더 비행기 시점
      const baseDistance = 120; // 더 먼 거리에서 비행감 연출

      let zoomAdjustment = 0;
      let pitchAdjustment = 0;
      let distanceOffset = baseDistance;
      let elevationOffset = 80; // 더 높은 고도에서 비행

      if (terrainData.isHighTerrain) {
        // 산악 지형: 높이 날아가기
        zoomAdjustment = -0.3;
        pitchAdjustment = 10; // 더 위에서 내려다보기
        distanceOffset = 200; // 더 멀리서
        elevationOffset = 150; // 훨씬 높은 고도
      } else if (terrainData.elevationRange < 30) {
        // 평지: 낮게 비행
        zoomAdjustment = 0.2;
        pitchAdjustment = -5; // 더 수평으로
        distanceOffset = 100; // 적당한 거리
        elevationOffset = 60; // 낮은 고도
      } else {
        // 일반 지형: 중간 비행
        zoomAdjustment = 0;
        pitchAdjustment = 0;
        distanceOffset = 120;
        elevationOffset = 80;
      }

      // 지형 험준도에 따른 추가 조정
      const roughnessAdjustment = Math.min(
        terrainData.terrainRoughness / 100,
        1,
      );
      zoomAdjustment -= roughnessAdjustment * 0.15;
      distanceOffset += roughnessAdjustment * 50; // 험한 지형에서는 더 멀리
      elevationOffset += roughnessAdjustment * 30; // 더 높이

      return {
        zoom: Math.max(14.5, Math.min(16.5, baseZoom + zoomAdjustment)), // 더 넓은 줌 범위
        pitch: Math.max(45, Math.min(65, basePitch + pitchAdjustment)), // 비행기 각도 범위
        distanceOffset: Math.max(80, Math.min(250, distanceOffset)), // 80-250m 범위로 확장
        elevationOffset, // 카메라가 지형보다 높이 위치할 오프셋
        cameraElevation: currentElevation + elevationOffset, // 실제 카메라 고도
      };
    },
    [],
  );

  // 카메라 오프셋을 적용한 위치 계산
  const calculateCameraPosition = useCallback(
    (lat: number, lon: number, bearing: number, distanceOffset: number) => {
      if (distanceOffset === 0) return [lon, lat];

      // bearing의 반대 방향으로 거리만큼 오프셋
      const offsetBearing = (bearing + 180) % 360;
      const offsetBearingRad = (offsetBearing * Math.PI) / 180;

      // 거리 오프셋을 위경도로 변환 (대략적 계산)
      const earthRadius = 6371000; // 미터
      const latOffset =
        ((distanceOffset * Math.cos(offsetBearingRad)) / earthRadius) *
        (180 / Math.PI);
      const lonOffset =
        ((distanceOffset * Math.sin(offsetBearingRad)) /
          (earthRadius * Math.cos((lat * Math.PI) / 180))) *
        (180 / Math.PI);

      return [lon + lonOffset, lat + latOffset];
    },
    [],
  );

  // 트레일 애니메이션 시작 - 카메라가 경로를 따라 이동
  const startTrailAnimation = useCallback(() => {
    if (!trailData || isAnimating || !mapRef.current) return;

    // 애니메이션 중단
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setIsAnimating(true);
    setAnimationProgress(0);
    setCurrentAnimationPoint(null); // 애니메이션 시작 시 초기화
    setCurrentDistance(0);
    setElapsedTime(0);
    setCurrentElevation(trailData.points[0]?.ele || 0);
    setShowCompletionEffect(false); // 이펙트 초기화
    setIsFullRouteView(false); // 애니메이션 시작 시 전체보기 해제

    // 거리 기반 duration 계산 (극단적으로 느린 속도)
    const totalDistanceKm = trailData.stats.totalDistance;
    const speedKmPerHour = 2.3; // 시속 2.3km (15% 속도 증가)
    const hoursNeeded = totalDistanceKm / speedKmPerHour;
    const calculatedDuration = hoursNeeded * 3600 * 1000; // 밀리초로 변환

    // 최소 26초, 최대 104초로 제한 (15% 감소)
    const duration = Math.max(26000, Math.min(104000, calculatedDuration));

    const startTime = Date.now();
    const map = mapRef.current.getMap();
    const points = trailData.points;

    if (points.length < 2) return;

    // 애니메이션 시작 전에 버드뷰(3D 각도)로 전환
    const firstPoint = points[0];
    const lookAheadPoint = points[Math.min(10, points.length - 1)];
    const initialBearing = calculateBearing(
      firstPoint.lat,
      firstPoint.lon,
      lookAheadPoint.lat,
      lookAheadPoint.lon,
    );

    // 시작 위치로 카메라 이동 (비행 시작 각도)
    map.easeTo({
      center: [firstPoint.lon, firstPoint.lat],
      zoom: 15.0, // 더 넓은 시야로 시작
      pitch: 50, // 비행기 시점으로 시작
      bearing: initialBearing - 15, // 약간 더 기울어진 각도
      duration: 2000, // 2초 동안 부드럽게 이동
      essential: true,
    });

    // 선형 이동 - 일정한 속도
    const linear = (t: number) => t;

    // 약간의 가속/감속만 원한다면 아래 사용
    // const easeInOutSine = (t: number) => {
    //   return -(Math.cos(Math.PI * t) - 1) / 2;
    // };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      let linearProgress = Math.min(elapsed / duration, 1);

      // 초반 1.5초 동안은 속도를 50%로 줄임
      if (elapsed < 1500) {
        // 1.5초까지는 절반 속도로 진행
        linearProgress = (elapsed / 1500) * 0.5 * (1500 / duration);
      } else {
        // 1.5초 이후에는 남은 거리를 남은 시간에 맞춰 진행
        const remainingTime = duration - 1500;
        const elapsedAfterSlow = elapsed - 1500;
        const slowProgress = 0.5 * (1500 / duration);
        const normalProgress =
          (elapsedAfterSlow / remainingTime) * (1 - slowProgress);
        linearProgress = slowProgress + normalProgress;
      }

      const easedProgress = linear(linearProgress);

      setAnimationProgress(easedProgress);

      // 거리 기반으로 현재 위치 계산
      const totalDistance = trailData.stats.totalDistance;
      const targetDistance = totalDistance * easedProgress;

      // 현재 거리에 해당하는 포인트 찾기
      let currentIndex = 0;
      let currentPoint = points[0];
      let nextPoint = points[1];

      // targetDistance에 해당하는 두 포인트 찾기
      for (let i = 0; i < points.length - 1; i++) {
        if (
          points[i].distance <= targetDistance &&
          points[i + 1].distance > targetDistance
        ) {
          currentIndex = i;
          currentPoint = points[i];
          nextPoint = points[i + 1];
          break;
        }
      }

      // 두 포인트 사이의 거리 비율 계산
      const segmentDistance = nextPoint.distance - currentPoint.distance;
      const segmentProgress =
        segmentDistance > 0
          ? (targetDistance - currentPoint.distance) / segmentDistance
          : 0;

      if (currentIndex < points.length - 1) {
        // 거리 비율에 따른 위치 보간
        const currentLat =
          currentPoint.lat +
          (nextPoint.lat - currentPoint.lat) * segmentProgress;
        const currentLon =
          currentPoint.lon +
          (nextPoint.lon - currentPoint.lon) * segmentProgress;
        const currentElevation =
          (currentPoint.ele || 0) +
          ((nextPoint.ele || 0) - (currentPoint.ele || 0)) * segmentProgress;

        // 현재 애니메이션 위치 업데이트 (라인 그리기용)
        setCurrentAnimationPoint({
          index: currentIndex,
          lat: currentLat,
          lon: currentLon,
          progress: segmentProgress,
        });

        // 실시간 정보 업데이트
        setCurrentDistance(targetDistance);

        // 실제 트레킹 소요 시간 계산
        // 전체 예상 시간 * 진행률 = 현재까지의 트레킹 시간
        const totalEstimatedHours = trailData.stats.estimatedTime; // 시간 단위
        const trekkedTimeHours = totalEstimatedHours * easedProgress;
        setElapsedTime(trekkedTimeHours * 3600); // 초 단위로 변환

        setCurrentElevation(currentElevation);

        // 지형 특성 분석
        const terrainData = analyzeTerrainCharacteristics(
          points,
          currentIndex,
          15,
        );

        // 지형에 따른 카메라 설정 계산 (현재 고도 전달)
        const cameraSettings = calculateCameraSettings(
          terrainData,
          currentElevation,
        );

        // 진행 방향 계산 (더 먼 미래 지점을 보고 부드러운 방향 결정)
        let bearing = 0;
        const lookAhead = Math.min(50, points.length - currentIndex - 1); // 더 먼 지점을 봐서 부드럽게
        if (lookAhead > 0) {
          const futurePoint = points[currentIndex + lookAhead];
          bearing = calculateBearing(
            currentLat,
            currentLon,
            futurePoint.lat,
            futurePoint.lon,
          );
        }

        // 카메라 위치 계산 (지형에 따른 거리 오프셋 적용)
        const [cameraLon, cameraLat] = calculateCameraPosition(
          currentLat,
          currentLon,
          bearing,
          cameraSettings.distanceOffset,
        );

        // 카메라를 즉시 이동 (노선과 완전 동기화)
        map.easeTo({
          center: [cameraLon, cameraLat],
          bearing: bearing - 10, // 진행 방향에서 약간 기울어진 각도
          zoom: cameraSettings.zoom, // 지형에 따른 적응적 줌
          pitch: cameraSettings.pitch, // 지형에 따른 적응적 각도
          duration: 0, // 즉시 이동
          essential: true,
        });
      } else if (easedProgress === 1 && points.length > 0) {
        // 애니메이션이 끝났을 때 마지막 포인트 처리
        const lastPoint = points[points.length - 1];
        mapRef.current?.getMap().jumpTo({
          center: [lastPoint.lon, lastPoint.lat],
          zoom: 16,
          pitch: 60,
          bearing: 0,
        });
      }

      if (linearProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setAnimationProgress(1);

        // 마지막 포인트로 설정
        if (points.length > 0) {
          setCurrentAnimationPoint({
            index: points.length - 1,
            lat: points[points.length - 1].lat,
            lon: points[points.length - 1].lon,
            progress: 1,
          });
        }

        // 0.5초 딜레이 후 완주 축하 이펙트 표시
        setTimeout(() => {
          setShowCompletionEffect(true);

          // 3초 후 이펙트 숨기고 top-view로 전환
          setTimeout(() => {
            setShowCompletionEffect(false);

            // 1초 후 top-view로 전환
            setTimeout(() => {
              if (trailData && mapRef.current) {
                const bounds = trailData.stats.bounds;

                // 시작점과 도착점이 모두 보이도록 bounds 계산
                const padding = 0.001; // 약간의 여백 추가
                const adjustedBounds = {
                  minLon: bounds.minLon - padding,
                  maxLon: bounds.maxLon + padding,
                  minLat: bounds.minLat - padding,
                  maxLat: bounds.maxLat + padding,
                };

                // fitBounds를 사용하여 시작점과 도착점이 모두 보이도록 설정
                mapRef.current.getMap().fitBounds(
                  [
                    [adjustedBounds.minLon, adjustedBounds.minLat],
                    [adjustedBounds.maxLon, adjustedBounds.maxLat],
                  ],
                  {
                    padding: { top: 50, bottom: 50, left: 50, right: 50 },
                    pitch: 0, // Top view를 위해 pitch를 0으로
                    bearing: 0, // 북쪽 정렬
                    duration: 3000, // 부드러운 전환
                    essential: true,
                  },
                );

                // 애니메이션 완료 후 전체보기 모드로 설정
                setIsFullRouteView(true);
              }
            }, 1000);
          }, 3000);
        }, 500);
      }
    };

    // 카메라가 시작점에 도착한 후 애니메이션 시작 (2초 카메라 이동 + 0.5초 추가 대기)
    setTimeout(() => {
      // 애니메이션 시작 직전에 첫 포인트 설정
      animationRef.current = requestAnimationFrame(() => {
        // 첫 번째 포인트로 초기화 (이제 라인이 그려지기 시작)
        setCurrentAnimationPoint({
          index: 0,
          lat: firstPoint.lat,
          lon: firstPoint.lon,
          progress: 0,
        });
        // 다음 프레임에서 animate 시작
        animationRef.current = requestAnimationFrame(animate);
      });
    }, 2500);
  }, [
    trailData,
    isAnimating,
    calculateBearing,
    analyzeTerrainCharacteristics,
    calculateCameraSettings,
    calculateCameraPosition,
  ]);

  // 현재 애니메이션 위치 상태 저장
  const [currentAnimationPoint, setCurrentAnimationPoint] = useState<{
    index: number;
    lat: number;
    lon: number;
    progress: number;
  } | null>(null);

  // 애니메이션을 위한 부분적 GeoJSON 생성 - 거리 기반 보간
  const getAnimatedGeoJSON = useCallback(() => {
    // 데이터가 없으면 null 반환
    if (!trailData?.geoJSON) {
      return null;
    }

    // 애니메이션이 완료되었거나 시작되지 않은 경우
    if (animationProgress === 1 || (!currentAnimationPoint && !isAnimating)) {
      return trailData.geoJSON;
    }

    // 애니메이션 중이지만 currentAnimationPoint가 없는 경우
    if (!currentAnimationPoint) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalCoordinates = (trailData.geoJSON.features[0].geometry as any)
      .coordinates;
    const points = trailData.points;

    // currentAnimationPoint.index까지의 좌표들
    const animatedCoordinates = originalCoordinates.slice(
      0,
      currentAnimationPoint.index + 1,
    );

    // 마지막 점을 현재 위치로 업데이트
    if (animatedCoordinates.length > 0 && currentAnimationPoint.progress > 0) {
      const lastCoord = [
        currentAnimationPoint.lon,
        currentAnimationPoint.lat,
        points[currentAnimationPoint.index].ele,
      ];

      // 부분적으로 진행된 경우 새로운 점 추가
      if (
        currentAnimationPoint.progress > 0 &&
        currentAnimationPoint.index < originalCoordinates.length - 1
      ) {
        animatedCoordinates.push(lastCoord);
      }
    }

    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: animatedCoordinates,
          },
        },
      ],
    };
  }, [trailData, currentAnimationPoint, animationProgress, isAnimating]);

  // 애니메이션 시작 요청 처리
  useEffect(() => {
    if (shouldStartAnimation.current && !isAnimating && trailData) {
      shouldStartAnimation.current = false;
      startTrailAnimation();
    }
  }, [isFullRouteView, isAnimating, trailData, startTrailAnimation]);

  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 트레일 중심으로 이동 (전체보기) - 주석처리된 UI에서 사용
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fitToTrail = useCallback(() => {
    if (trailData && mapRef.current) {
      const bounds = trailData.stats.bounds;

      // 애니메이션이 진행 중이면 중단
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        setIsAnimating(false);
        setAnimationProgress(1); // 애니메이션을 완료 상태로 설정
      }

      // 시작점과 도착점이 모두 보이도록 bounds 계산
      const padding = 0.001; // 약간의 여백 추가
      const adjustedBounds = {
        minLon: bounds.minLon - padding,
        maxLon: bounds.maxLon + padding,
        minLat: bounds.minLat - padding,
        maxLat: bounds.maxLat + padding,
      };

      // fitBounds를 사용하여 시작점과 도착점이 모두 보이도록 설정
      mapRef.current.getMap().fitBounds(
        [
          [adjustedBounds.minLon, adjustedBounds.minLat],
          [adjustedBounds.maxLon, adjustedBounds.maxLat],
        ],
        {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          pitch: 0, // 완전한 Top view (위에서 직접 내려다보기)
          bearing: 0, // 북쪽 정렬
          duration: 1000,
          essential: true,
        },
      );

      // 전체보기 모드로 설정
      setIsFullRouteView(true);
    }
  }, [trailData]);

  // GPX 파일 다운로드 핸들러 - 주석처리된 UI에서 사용
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGPXDownload = useCallback(() => {
    const gpxUrl = `/gpx/${courseId}.gpx`;
    const link = document.createElement("a");
    link.href = gpxUrl;
    link.download = `course-${courseId}.gpx`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [courseId]);

  // 시간 포맷 함수 (실시간 정보용)
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

  // 맵 로드 시 3D 지형 설정 및 애니메이션 준비
  const onMapLoad = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    // 지도 로드 완료 시 전체보기 모드로 설정
    const handleMapIdle = () => {
      if (trailData && !isAnimating && animationProgress === 0) {
        setTimeout(() => {
          // 초기에는 전체보기 모드로 시작
          if (mapRef.current) {
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
                duration: 2000,
                essential: true,
              },
            );

            setIsFullRouteView(true);
          }
        }, 1000);
        map.off("idle", handleMapIdle);
      }
    };

    map.on("idle", handleMapIdle);

    // 한국어 라벨 설정
    try {
      // Mapbox GL JS는 기본적으로 CJK 문자를 지원하므로
      // 별도의 폰트 설정 없이 한국어 필드만 우선 표시하도록 설정

      // 모든 지명 관련 레이어에 대해 한국어 필드 우선 표시
      const labelLayers = [
        "country-label",
        "state-label",
        "place-city-large-s",
        "place-city-medium-s",
        "place-city-small-s",
        "place-town",
        "place-village",
        "place-neighbourhood",
        "place-suburb",
        "poi-label",
        "road-label-simple",
      ];

      // 지도가 완전히 로드된 후 라벨 설정
      const setKoreanLabels = () => {
        labelLayers.forEach((layerId) => {
          if (map.getLayer(layerId)) {
            try {
              // 한국어 필드를 우선적으로 표시하도록 설정
              map.setLayoutProperty(layerId, "text-field", [
                "coalesce",
                ["get", "name_ko"],
                ["get", "name:ko"],
                ["get", "name_kr"],
                ["get", "name"],
              ]);
            } catch {}
          }
        });
      };

      // 즉시 실행하고, 스타일 로드 완료 후에도 한 번 더 실행
      setKoreanLabels();
      map.on("styledata", setKoreanLabels);
    } catch {}

    // 3D 지형을 위한 DEM 소스 추가
    if (!map.getSource("mapbox-dem")) {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
    }

    // 하늘 레이어 추가 (3D 모드에서만 보임)
    if (!map.getLayer("sky")) {
      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 90.0],
          "sky-atmosphere-sun-intensity": 15,
        },
      });
    }
  }, [trailData, isAnimating, animationProgress]);

  // 3D 모드 변경 시 지형 적용
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    if (is3D) {
      // 고저차를 더 명확하게 보이도록 지형 과장 효과 증가
      map.setTerrain({ source: "mapbox-dem", exaggeration: 2.5 });
    } else {
      map.setTerrain(null);
    }
  }, [is3D]);

  // 트레일 라인 스타일 (3D에서는 화이트, 2D에서는 검은색)
  const trailLineLayer = {
    id: "trail-line",
    type: "line" as const,
    paint: {
      "line-color": is3D ? "#ffffff" : "#000000", // 3D: 화이트, 2D: 검은색
      "line-width": 5,
      "line-opacity": 0.9,
    },
    layout: {
      "line-join": "round" as const,
      "line-cap": "round" as const,
    },
  };

  // 트레일 외곽선 레이어 (3D: 검은색 외곽선, 2D: 회색 외곽선)
  const trailOutlineLayer = {
    id: "trail-outline",
    type: "line" as const,
    paint: {
      "line-color": is3D ? "#000000" : "#666666", // 3D: 검은색, 2D: 회색
      "line-width": 7,
      "line-opacity": is3D ? 0.4 : 0.3,
    },
    layout: {
      "line-join": "round" as const,
      "line-cap": "round" as const,
    },
  };

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="">
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
      <Card className={`${className}`}>
        <CardContent className="">
          <div className="text-center">
            <Mountain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              트레일 지도를 로드할 수 없습니다
            </h3>
            <p className="text-gray-500">
              {error || "GPX 파일을 찾을 수 없습니다."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          {/* <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {trailData.name}
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
                  <Badge
                    className={getDifficultyColor(trailData.stats.difficulty)}
                  >
                    {trailData.stats.difficulty === "Easy"
                      ? "쉬움"
                      : trailData.stats.difficulty === "Moderate"
                      ? "보통"
                      : trailData.stats.difficulty === "Hard"
                      ? "어려움"
                      : trailData.stats.difficulty}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startTrailAnimation}
                  disabled={isAnimating}
                  className="text-xs"
                >
                  <Play className="w-3 h-3 mr-1" />
                  {isAnimating
                    ? "지형 추적 중..."
                    : animationProgress > 0
                    ? "다시 비행하기"
                    : "지형 추적 비행"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPOIs(!showPOIs)}
                  className={`text-xs transition-colors ${
                    showPOIs ? "bg-green-100 text-green-700" : ""
                  }`}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  POI {showPOIs ? "ON" : "OFF"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fitToTrail}
                  className="text-xs"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  전체보기
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggle3D}
                  className={`text-xs transition-colors ${
                    is3D ? "bg-blue-100 text-blue-700" : ""
                  }`}
                >
                  {is3D ? (
                    <ToggleRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 mr-1" />
                  )}
                  {is3D ? "3D" : "2D"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGPXDownload}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  GPX 다운로드
                </Button>
              </div>
            </div>
          </div> */}

          {/* 지도 */}
          <div className="relative h-[500px] overflow-hidden">
            <Map
              ref={mapRef}
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/light-v11"
              onLoad={onMapLoad}
            >
              {/* 커스텀 한글 네비게이션 컨트롤 */}
              <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
                {/* 전체 루트 보기 ↔ 애니메이션 토글 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleRouteView}
                  className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
                  title={isFullRouteView ? "애니메이션 시작" : "전체 루트 보기"}
                >
                  <Mountain className="w-4 h-4" />
                </Button>

                {/* <Button
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
                </Button> */}
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={resetNorth}
                  className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
                  title="북쪽으로 회전"
                >
                  <Compass className="w-4 h-4" />
                </Button> */}
              </div>

              {/* 트레일 레이어 */}
              {(() => {
                const geoJSONData = getAnimatedGeoJSON();
                return (
                  geoJSONData && (
                    <Source
                      id="trail"
                      type="geojson"
                      data={geoJSONData}
                      // Mapbox Source는 순수한 지오JSON 데이터만 받아야 함
                    >
                      <Layer {...trailOutlineLayer} />
                      <Layer {...trailLineLayer} />
                    </Source>
                  )
                );
              })()}

              {/* POI 마커들 */}
              {showPOIs &&
                trailData?.pois.map((poi, index) => (
                  <Marker
                    key={`poi-${index}`}
                    longitude={poi.lon}
                    latitude={poi.lat}
                  >
                    <POIMarker poi={poi} onClick={() => setSelectedPOI(poi)} />
                  </Marker>
                ))}

              {/* 호버 마커 */}
              {hoveredPoint && (
                <Marker
                  longitude={hoveredPoint.lon}
                  latitude={hoveredPoint.lat}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-lg"
                  />
                </Marker>
              )}
            </Map>

            {/* 로딩 오버레이 */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    GPX 지도를 로드하는 중...
                  </p>
                </div>
              </div>
            )}

            {/* 실시간 트레킹 정보 오버레이 */}
            {isAnimating && trailData && <></>}

            {/* 완주 축하 이펙트 */}
            <AnimatePresence>
              {showCompletionEffect && (
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
                    <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      완주 성공! 🎉
                    </h2>
                    <p className="text-lg text-gray-600 mb-2">
                      {trailData.stats.totalDistance.toFixed(1)}km 트레일을
                      완주했습니다!
                    </p>
                    <p className="text-md text-gray-500">
                      소요 시간:{" "}
                      {formatElapsedTime(trailData.stats.estimatedTime * 3600)}
                    </p>
                    {trailData.stats.elevationGain > 0 && (
                      <p className="text-md text-gray-500 mt-1">
                        누적 상승: {trailData.stats.elevationGain.toFixed(0)}m
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

                  {/* 별 이펙트 */}
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={`star-${i}`}
                      className="absolute text-yellow-400"
                      style={{
                        left: `${50 + (Math.random() - 0.5) * 60}%`,
                        top: `${50 + (Math.random() - 0.5) * 60}%`,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1.5, 1],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: Math.random() * 1,
                        repeat: 2,
                      }}
                    >
                      ⭐
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* POI 정보 팝업 */}
            {selectedPOI && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-20"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`${POI_CONFIG[selectedPOI.type].color} ${
                      POI_CONFIG[selectedPOI.type].textColor
                    } rounded-full p-2`}
                  >
                    {React.createElement(POI_CONFIG[selectedPOI.type].icon, {
                      className: "w-4 h-4",
                    })}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {selectedPOI.name}
                    </h3>
                    {selectedPOI.elevation && (
                      <p className="text-sm text-gray-600 mt-1">
                        고도: {Math.round(selectedPOI.elevation)}m
                      </p>
                    )}
                    {selectedPOI.description && (
                      <p className="text-sm text-gray-700 mt-2">
                        {selectedPOI.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPOI(null)}
                    className="p-1 h-auto"
                  >
                    ✕
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* 하단 통계 */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {trailData.pois.length}개
                </div>
                <div className="text-xs text-gray-600">관심 지점</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TrailMap;
