// GSRC81 MAPS - 비행 애니메이션 + 1km 마커 + 코스 노트 통합 Hook
// processGpxFile.ts의 dist 데이터를 활용한 완전한 비행 시스템

import { useState, useRef, useCallback, useEffect } from "react";
import { MapRef } from "react-map-gl/mapbox";
import {
  ProcessedGPXData,
  GPXPoint,
  extractKmMarkers,
} from "@/lib/processGpxFile";

// ====================================================================
// 타입 정의
// ====================================================================

export interface CourseNote {
  id: string;
  course_id: string;
  latitude: number;
  longitude: number;
  title: string;
  content: string | null;
  memo_type: "general" | "warning" | "highlight" | "rest";
  show_during_animation: boolean;
  created_at: string;
}

export interface KmMarker {
  km: number;
  point: GPXPoint;
  position: { lat: number; lng: number };
  isVisible: boolean;
}

export interface FlightAnimationState {
  isAnimating: boolean;
  isFullRouteView: boolean;
  animationProgress: number; // 0-1
  currentPointIndex: number;
  currentKm: number;
  elapsed: number; // 애니메이션 시작 후 경과 시간(ms)
}

export interface FlightAnimationControls {
  startAnimation: () => void;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  stopAnimation: () => void;
  showFullRoute: () => void;
  jumpToKm: (km: number) => void;
  jumpToProgress: (progress: number) => void;
}

export interface FlightAnimationConfig {
  speedMultiplier: number; // 1.0 = 기본 속도, 2.0 = 2배속
  kmMarkerShowDuration: number; // km 마커 표시 지속 시간(ms)
  noteShowDistance: number; // 노트 표시 거리 임계값(미터)
  smoothTransition: boolean; // 부드러운 전환 여부
  autoHideMarkers: boolean; // 지나간 마커 자동 숨김
}

// ====================================================================
// 기본 설정
// ====================================================================

const DEFAULT_CONFIG: FlightAnimationConfig = {
  speedMultiplier: 1.0,
  kmMarkerShowDuration: 3000, // 3초
  noteShowDistance: 50, // 50m 이내
  smoothTransition: true,
  autoHideMarkers: true,
};

const FLIGHT_SETTINGS = {
  zoom: 17,
  pitch: 60,
  bearing: 0,
  baseSpeed: 80, // ms per point (기본 속도)
  minSpeed: 20,
  maxSpeed: 200,
};

// ====================================================================
// 거리 계산 유틸리티
// ====================================================================

function distanceBetweenPoints(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
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

// ====================================================================
// 메인 Hook
// ====================================================================

export function useFlightAnimation(
  mapRef: React.RefObject<MapRef>,
  gpxData: ProcessedGPXData | null,
  courseNotes: CourseNote[] = [],
  config: Partial<FlightAnimationConfig> = {},
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 상태 관리
  const [state, setState] = useState<FlightAnimationState>({
    isAnimating: false,
    isFullRouteView: true,
    animationProgress: 0,
    currentPointIndex: 0,
    currentKm: 0,
    elapsed: 0,
  });

  const [kmMarkers, setKmMarkers] = useState<KmMarker[]>([]);
  const [visibleNotes, setVisibleNotes] = useState<CourseNote[]>([]);

  // 애니메이션 제어
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const pausedProgressRef = useRef<number>(0);

  // ====================================================================
  // 1km 마커 초기화
  // ====================================================================

  useEffect(() => {
    if (!gpxData?.points) {
      setKmMarkers([]);
      return;
    }

    const markers = extractKmMarkers(gpxData.points).map((point) => ({
      km: Math.round(point.dist / 1000),
      point,
      position: { lat: point.lat, lng: point.lng },
      isVisible: false,
    }));

    setKmMarkers(markers);
  }, [gpxData]);

  // ====================================================================
  // 애니메이션 로직
  // ====================================================================

  const animate = useCallback(() => {
    if (!gpxData?.points || !mapRef.current) return;

    const points = gpxData.points;
    const totalPoints = points.length;
    const currentTime = Date.now();
    const elapsed = currentTime - startTimeRef.current;

    // 속도 계산 (config.speedMultiplier 적용)
    const pointDuration =
      FLIGHT_SETTINGS.baseSpeed / finalConfig.speedMultiplier;
    const totalDuration = totalPoints * pointDuration;

    // 진행률 계산
    let progress = elapsed / totalDuration;
    if (isPausedRef.current) {
      progress = pausedProgressRef.current;
    } else {
      progress = Math.min(progress, 1);
    }

    const currentPointIndex = Math.floor(progress * (totalPoints - 1));
    const currentPoint = points[currentPointIndex];

    if (!currentPoint) return;

    // 상태 업데이트
    setState((prev) => ({
      ...prev,
      animationProgress: progress,
      currentPointIndex,
      currentKm: Math.floor(currentPoint.dist / 1000),
      elapsed,
    }));

    // 지도 이동
    const map = mapRef.current.getMap();
    map.easeTo({
      center: [currentPoint.lng, currentPoint.lat],
      zoom: FLIGHT_SETTINGS.zoom,
      pitch: FLIGHT_SETTINGS.pitch,
      bearing: FLIGHT_SETTINGS.bearing,
      duration: finalConfig.smoothTransition ? pointDuration * 0.8 : 0,
      essential: true,
    });

    // 1km 마커 표시 로직
    setKmMarkers((prev) =>
      prev.map((marker) => {
        const distanceToMarker = Math.abs(
          currentPoint.dist - marker.point.dist,
        );
        const shouldShow = distanceToMarker <= 100; // 100m 이내에서 표시

        if (shouldShow && !marker.isVisible) {
          // 자동 숨김 설정
          if (finalConfig.autoHideMarkers) {
            setTimeout(() => {
              setKmMarkers((markers) =>
                markers.map((m) =>
                  m.km === marker.km ? { ...m, isVisible: false } : m,
                ),
              );
            }, finalConfig.kmMarkerShowDuration);
          }
        }

        return { ...marker, isVisible: shouldShow };
      }),
    );

    // 코스 노트 표시 로직
    const nearbyNotes = courseNotes.filter((note) => {
      if (!note.show_during_animation) return false;

      const noteDistance = distanceBetweenPoints(
        currentPoint.lat,
        currentPoint.lng,
        note.latitude,
        note.longitude,
      );

      return noteDistance <= finalConfig.noteShowDistance;
    });

    setVisibleNotes(nearbyNotes);

    // 애니메이션 계속 또는 종료
    if (progress < 1 && !isPausedRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (progress >= 1) {
      setState((prev) => ({ ...prev, isAnimating: false }));
      setTimeout(() => {
        showFullRoute();
      }, 1000);
    }
  }, [gpxData, mapRef, courseNotes, finalConfig]);

  // ====================================================================
  // 제어 함수들
  // ====================================================================

  const startAnimation = useCallback(() => {
    if (!gpxData?.points || state.isAnimating) return;

    setState((prev) => ({
      ...prev,
      isAnimating: true,
      isFullRouteView: false,
      animationProgress: 0,
      currentPointIndex: 0,
      elapsed: 0,
    }));

    startTimeRef.current = Date.now();
    isPausedRef.current = false;
    pausedProgressRef.current = 0;

    // 시작점으로 이동
    const startPoint = gpxData.points[0];
    const map = mapRef.current?.getMap();
    if (map) {
      map.easeTo({
        center: [startPoint.lng, startPoint.lat],
        zoom: FLIGHT_SETTINGS.zoom,
        pitch: FLIGHT_SETTINGS.pitch,
        bearing: FLIGHT_SETTINGS.bearing,
        duration: 1000,
        essential: true,
      });

      setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate);
      }, 1200);
    }
  }, [gpxData, state.isAnimating, animate, mapRef]);

  const pauseAnimation = useCallback(() => {
    if (!state.isAnimating || isPausedRef.current) return;

    isPausedRef.current = true;
    pausedProgressRef.current = state.animationProgress;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [state.isAnimating, state.animationProgress]);

  const resumeAnimation = useCallback(() => {
    if (!state.isAnimating || !isPausedRef.current) return;

    isPausedRef.current = false;
    startTimeRef.current =
      Date.now() -
      pausedProgressRef.current *
        (gpxData?.points.length || 0) *
        (FLIGHT_SETTINGS.baseSpeed / finalConfig.speedMultiplier);

    animationRef.current = requestAnimationFrame(animate);
  }, [state.isAnimating, gpxData, finalConfig.speedMultiplier, animate]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isAnimating: false,
      animationProgress: 0,
      currentPointIndex: 0,
      elapsed: 0,
    }));

    isPausedRef.current = false;
    pausedProgressRef.current = 0;

    // 모든 마커 숨기기
    setKmMarkers((prev) =>
      prev.map((marker) => ({ ...marker, isVisible: false })),
    );
    setVisibleNotes([]);
  }, []);

  const showFullRoute = useCallback(() => {
    if (!gpxData?.bounds || !mapRef.current) return;

    const map = mapRef.current.getMap();

    map.fitBounds(
      [
        [gpxData.bounds.minLng, gpxData.bounds.minLat],
        [gpxData.bounds.maxLng, gpxData.bounds.maxLat],
      ],
      {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        pitch: 0,
        bearing: 0,
        duration: 1000,
        essential: true,
      },
    );

    setState((prev) => ({ ...prev, isFullRouteView: true }));
  }, [gpxData, mapRef]);

  const jumpToKm = useCallback(
    (targetKm: number) => {
      if (!gpxData?.points) return;

      const targetDist = targetKm * 1000;
      const closestPointIndex = gpxData.points.findIndex(
        (point) => Math.abs(point.dist - targetDist) < 50,
      );

      if (closestPointIndex >= 0) {
        const progress = closestPointIndex / (gpxData.points.length - 1);
        jumpToProgress(progress);
      }
    },
    [gpxData],
  );

  const jumpToProgress = useCallback(
    (targetProgress: number) => {
      if (!gpxData?.points || !mapRef.current) return;

      const clampedProgress = Math.max(0, Math.min(1, targetProgress));
      const targetIndex = Math.floor(
        clampedProgress * (gpxData.points.length - 1),
      );
      const targetPoint = gpxData.points[targetIndex];

      setState((prev) => ({
        ...prev,
        animationProgress: clampedProgress,
        currentPointIndex: targetIndex,
        currentKm: Math.floor(targetPoint.dist / 1000),
      }));

      const map = mapRef.current.getMap();
      map.easeTo({
        center: [targetPoint.lng, targetPoint.lat],
        zoom: FLIGHT_SETTINGS.zoom,
        pitch: FLIGHT_SETTINGS.pitch,
        bearing: FLIGHT_SETTINGS.bearing,
        duration: 1000,
        essential: true,
      });
    },
    [gpxData, mapRef],
  );

  // ====================================================================
  // 정리
  // ====================================================================

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // ====================================================================
  // 반환값
  // ====================================================================

  const controls: FlightAnimationControls = {
    startAnimation,
    pauseAnimation,
    resumeAnimation,
    stopAnimation,
    showFullRoute,
    jumpToKm,
    jumpToProgress,
  };

  return {
    state,
    controls,
    kmMarkers,
    visibleNotes,

    // 편의 속성들
    isReady: !!gpxData?.points,
    totalKm: gpxData ? Math.ceil(gpxData.stats.totalDistance) : 0,
    isPaused: isPausedRef.current,

    // 현재 위치 정보
    currentPoint: gpxData?.points[state.currentPointIndex] || null,
    currentDistance: gpxData?.points[state.currentPointIndex]?.dist || 0,

    // 디버깅용
    debug: {
      totalPoints: gpxData?.points.length || 0,
      currentIndex: state.currentPointIndex,
      kmMarkersCount: kmMarkers.length,
      visibleNotesCount: visibleNotes.length,
    },
  };
}

// ====================================================================
// 사용 예시
// ====================================================================

/*
// 코스 상세 페이지에서의 사용법:

import { useFlightAnimation } from '@/hooks/useFlightAnimation';

const CourseDetailPage = ({ course, notes }) => {
  const mapRef = useRef<MapRef>(null);
  
  const flight = useFlightAnimation(
    mapRef,
    course.gpx_data,
    notes,
    {
      speedMultiplier: 1.5, // 1.5배속
      autoHideMarkers: true,
      noteShowDistance: 100 // 100m 이내 노트 표시
    }
  );
  
  return (
    <div>
      <Map ref={mapRef}>
        // 기본 경로 렌더링
        <Source id="route" type="geojson" data={routeGeoJSON}>
          <Layer {...routeStyle} />
        </Source>
        
        // 1km 마커들
        {flight.kmMarkers.map(marker => 
          marker.isVisible && (
            <Marker
              key={marker.km}
              longitude={marker.position.lng}
              latitude={marker.position.lat}
            >
              <div className="km-marker">{marker.km}km</div>
            </Marker>
          )
        )}
        
        // 노트들
        {flight.visibleNotes.map(note => (
          <Marker
            key={note.id}
            longitude={note.longitude}
            latitude={note.latitude}
          >
            <div className="course-note">{note.title}</div>
          </Marker>
        ))}
      </Map>
      
      // 컨트롤 UI
      <div className="flight-controls">
        <button onClick={flight.controls.startAnimation}>
          비행 시작
        </button>
        <button onClick={flight.controls.pauseAnimation}>
          일시정지
        </button>
        <button onClick={flight.controls.showFullRoute}>
          전체 보기
        </button>
        
        // 진행률 표시
        <div>
          진행률: {(flight.state.animationProgress * 100).toFixed(1)}%
          현재: {flight.state.currentKm}km
        </div>
      </div>
    </div>
  );
};
*/
