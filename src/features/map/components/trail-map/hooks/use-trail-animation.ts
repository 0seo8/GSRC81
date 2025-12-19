import { useState, useRef, useCallback, useEffect } from "react";
import { MapRef } from "react-map-gl/mapbox";
import { TrailData, GpxCoordinate, KmMarker } from "../types";
import { FLIGHT_CONFIG } from "../constants";
import { calculateDistance } from "../utils";

export const useTrailAnimation = (
  mapRef: React.RefObject<MapRef | null>,
  trailData: TrailData | null,
  onKmMarkerShow: (km: number) => void,
  onResetKmMarkers: () => void,
  setKmMarkers: (markers: KmMarker[]) => void,
) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFullRouteView, setIsFullRouteView] = useState(true); // 초기에는 전체 보기로 시작
  const [animationProgress, setAnimationProgress] = useState(1); // 전체 경로 표시
  const [currentActualDistanceKm, setCurrentActualDistanceKm] = useState(0); // 실제 누적 거리 (km)
  const [savedProgress, setSavedProgress] = useState(0);
  const animationRef = useRef<number | null>(null);

  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startTrailAnimation = useCallback(() => {
    if (!trailData || isAnimating || !mapRef.current) return;

    setIsAnimating(true);
    setIsFullRouteView(false);
    setCurrentActualDistanceKm(0); // 거리 초기화
    onResetKmMarkers();

    // V2 구조에서 포인트 추출 - trailData.course.gpx_data.points 사용
    let points: GpxCoordinate[] = [];

    // 1순위: TrailMapV2에서 전달된 geoJSON 좌표
    const coordinates = trailData.geoJSON.features[0]?.geometry.coordinates;
    if (coordinates && coordinates.length > 0) {
      points = coordinates.map((coord) => ({
        lng: coord[0],
        lat: coord[1],
        ele: coord[2] || 0,
      }));
    }
    // 2순위는 제거 - Course 타입에 gpx_data 속성이 없음
    // 3순위 (레거시): gpx_coordinates 파싱
    else if (trailData.course.gpx_coordinates) {
      try {
        points = JSON.parse(trailData.course.gpx_coordinates);
      } catch {
        console.error("❌ Failed to parse gpx_coordinates");
      }
    }

    if (points.length === 0) {
      return;
    }

    // km 마커 위치 미리 계산
    const kmMarkerPositions: KmMarker[] = [];
    let cumulativeDistance = 0;
    let nextKmTarget = 1;

    for (let i = 1; i < points.length; i++) {
      const prevPt = points[i - 1];
      const currPt = points[i];

      const segmentDistance = calculateDistance(
        prevPt.lat,
        prevPt.lng,
        currPt.lat,
        currPt.lng,
      );

      cumulativeDistance += segmentDistance;

      // 1km 지점마다 마커 위치 저장
      if (cumulativeDistance >= nextKmTarget * 1000) {
        kmMarkerPositions.push({
          km: nextKmTarget,
          position: { lat: currPt.lat, lng: currPt.lng },
        });

        nextKmTarget++;
      }
    }

    // km 마커들을 useKmMarkers에 설정
    setKmMarkers(kmMarkerPositions);

    const map = mapRef.current.getMap();

    // 거리 기반으로 일정한 속도 계산
    const pointCount = points.length;
    const totalDistanceKm = trailData.stats.totalDistance;

    // 거리 기반 duration 계산 (시속 2.5km)
    const hoursNeeded = totalDistanceKm / FLIGHT_CONFIG.FLIGHT_SPEED_KMH;
    const calculatedDuration = hoursNeeded * 3600 * 1000; // 밀리초로 변환

    // 최소/최대 시간으로 제한
    const totalDuration = Math.min(
      Math.max(calculatedDuration, FLIGHT_CONFIG.MIN_TOTAL_DURATION),
      FLIGHT_CONFIG.MAX_TOTAL_DURATION,
    );

    // 저장된 진행률부터 시작 (새로운 애니메이션은 항상 0부터 시작)
    const startProgress = 0; // savedProgress를 사용하지 않고 항상 처음부터 시작
    const startTime = Date.now();

    let currentIndex = Math.min(
      Math.floor(startProgress * (pointCount - 1)),
      pointCount - 1,
    );

    // km 마커 표시를 위한 변수들
    const shownKmMarkers = new Set<number>();
    let lastCalculatedIndex = 0;
    let lastCumulativeDistance = 0;

    // 거리 기반으로 포인트 인덱스 찾기 (선형 보간 포함)
    const findIndexAtDistance = (
      targetDistanceMeters: number,
    ): { index: number; ratio: number } => {
      let cumulativeDistance = 0;

      for (let i = 1; i < points.length; i++) {
        const segmentDistance = calculateDistance(
          points[i - 1].lat,
          points[i - 1].lng,
          points[i].lat,
          points[i].lng,
        );

        if (cumulativeDistance + segmentDistance >= targetDistanceMeters) {
          // 선형 보간으로 정확한 위치 계산
          const remaining = targetDistanceMeters - cumulativeDistance;
          const ratio = segmentDistance > 0 ? remaining / segmentDistance : 0;
          return { index: i - 1, ratio: Math.min(Math.max(ratio, 0), 1) };
        }

        cumulativeDistance += segmentDistance;
      }

      return { index: points.length - 1, ratio: 0 };
    };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const timeProgress = Math.min(elapsed / totalDuration, 1);

      // ✅ 실제 거리 기반으로 포인트 찾기 (포인트 인덱스 대신)
      const targetDistanceMeters = timeProgress * totalDistanceKm * 1000;
      const { index: baseIndex, ratio: interpolationRatio } =
        findIndexAtDistance(targetDistanceMeters);

      currentIndex = baseIndex;
      const actualProgress = currentIndex / (pointCount - 1);
      setAnimationProgress(actualProgress);

      if (timeProgress < 1 && currentIndex < pointCount - 1) {
        const point = points[currentIndex];

        // km 마커 표시 로직 - 실제 애니메이션 진행과 정확히 동기화
        // 효율적인 증분 거리 계산 (이전 계산에서 이어서)
        if (currentIndex > lastCalculatedIndex) {
          for (let i = lastCalculatedIndex + 1; i <= currentIndex; i++) {
            const prevPt = points[i - 1];
            const currPt = points[i];

            lastCumulativeDistance += calculateDistance(
              prevPt.lat,
              prevPt.lng,
              currPt.lat,
              currPt.lng,
            );
          }
          lastCalculatedIndex = currentIndex;
        }

        // 실제 누적 거리를 state로 노출 (댓글 동기화용)
        const distanceKm = lastCumulativeDistance / 1000;
        setCurrentActualDistanceKm(distanceKm);

        const currentKmMark = Math.floor(distanceKm);

        // 새로운 km 지점을 지났는지 확인 (이미 표시되지 않은 것만)
        if (currentKmMark > 0 && !shownKmMarkers.has(currentKmMark)) {
          onKmMarkerShow(currentKmMark);
          shownKmMarkers.add(currentKmMark);
        }

        // ✅ 선형 보간으로 정확한 위치 계산
        const currentPoint = points[currentIndex];
        const nextIndex = Math.min(currentIndex + 1, points.length - 1);
        const nextPoint = points[nextIndex];

        // 두 포인트 사이를 보간하여 정확한 위치 계산
        const targetLat =
          currentPoint.lat +
          (nextPoint.lat - currentPoint.lat) * interpolationRatio;
        const targetLng =
          currentPoint.lng +
          (nextPoint.lng - currentPoint.lng) * interpolationRatio;

        // easeTo를 사용하여 부드러운 카메라 이동
        // duration을 짧게 설정하여 requestAnimationFrame과 동기화
        // 60fps 기준 약 3-5 프레임 (50-80ms) 정도가 자연스러움
        map.easeTo({
          center: [targetLng, targetLat],
          zoom: FLIGHT_CONFIG.FLIGHT_ZOOM,
          pitch: FLIGHT_CONFIG.FLIGHT_PITCH,
          bearing: FLIGHT_CONFIG.FLIGHT_BEARING,
          duration: 50, // 짧은 duration으로 부드러운 전환
          easing: (t: number) => t, // 선형 easing (일정한 속도)
        });

        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 애니메이션 완료 - 왜 종료되었는지 분석

        const lastPoint = points[pointCount - 1];
        const lastPointLat = lastPoint.lat;
        const lastPointLng = lastPoint.lng;

        map.easeTo({
          center: [lastPointLng, lastPointLat],
          zoom: FLIGHT_CONFIG.FLIGHT_ZOOM,
          pitch: FLIGHT_CONFIG.FLIGHT_PITCH,
          bearing: FLIGHT_CONFIG.FLIGHT_BEARING,
          duration: 500,
          essential: true,
        });

        setTimeout(() => {
          setIsAnimating(false);
          setIsFullRouteView(true);
          setAnimationProgress(1);
          setCurrentActualDistanceKm(0); // 거리 리셋
          setSavedProgress(0);

          setTimeout(() => {
            // Show full route after animation completes
            setIsFullRouteView(true);
            setAnimationProgress(1);
            const bounds = trailData.stats.bounds;
            mapRef.current?.getMap().fitBounds(
              [
                [bounds.minLng, bounds.minLat],
                [bounds.maxLng, bounds.maxLat],
              ],
              {
                padding: { top: 80, bottom: 80, left: 80, right: 80 },
                pitch: 0,
                bearing: 0,
                duration: 1000,
                essential: true,
              },
            );
          }, FLIGHT_CONFIG.COMPLETION_DELAY);
        }, 600);
      }
    };

    // 시작 포인트로 이동 (항상 첫 번째 포인트부터)
    const startPointIndex = 0;
    const startPoint = points[startPointIndex];

    const startPointLat = startPoint.lat;
    const startPointLng = startPoint.lng;

    map.easeTo({
      center: [startPointLng, startPointLat],
      zoom: FLIGHT_CONFIG.FLIGHT_ZOOM,
      pitch: FLIGHT_CONFIG.FLIGHT_PITCH,
      bearing: FLIGHT_CONFIG.FLIGHT_BEARING,
      duration: 500,
      essential: true,
    });

    const delay = 500; // 항상 500ms 지연

    setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, delay);
  }, [
    trailData,
    isAnimating,
    savedProgress,
    mapRef,
    onKmMarkerShow,
    onResetKmMarkers,
    setKmMarkers,
  ]);

  const showFullRoute = useCallback(() => {
    if (!trailData || !mapRef.current) return;

    // 진행 중인 애니메이션 중단하고 현재 진행률 저장
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;

      if (animationProgress < 1 && animationProgress > 0) {
        setSavedProgress(animationProgress);
      }
    }

    setIsAnimating(false);
    setIsFullRouteView(true);
    setAnimationProgress(1);
    setCurrentActualDistanceKm(0); // 거리 리셋

    const bounds = trailData.stats.bounds;

    // 전체 경로가 잘 보이도록 fitBounds 사용
    mapRef.current.getMap().fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      {
        padding: { top: 80, bottom: 80, left: 80, right: 80 }, // 더 큰 패딩으로 여백 확보
        pitch: 0,
        bearing: 0,
        duration: 1000,
        essential: true,
      },
    );
  }, [trailData, animationProgress, mapRef]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;

      if (animationProgress < 1 && animationProgress > 0) {
        setSavedProgress(animationProgress);
      }
    }
    setIsAnimating(false);
  }, [animationProgress]);

  return {
    isAnimating,
    isFullRouteView,
    animationProgress,
    currentActualDistanceKm, // 실제 거리 노출 (댓글 동기화용)
    savedProgress,
    startTrailAnimation,
    showFullRoute,
    stopAnimation,
  };
};
