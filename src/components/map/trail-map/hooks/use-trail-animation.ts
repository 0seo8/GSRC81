import { useState, useRef, useCallback, useEffect } from "react";
import { MapRef } from "react-map-gl/mapbox";
import { TrailData, GpxCoordinate } from "../types";
import { FLIGHT_CONFIG } from "../constants";
import { calculateDistance, calculateKmMarkers } from "../utils";
import { CoursePoint } from "@/types";

export const useTrailAnimation = (
  mapRef: React.RefObject<MapRef>,
  trailData: TrailData | null,
  onKmMarkerShow: (km: number) => void,
  onResetKmMarkers: () => void
) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFullRouteView, setIsFullRouteView] = useState(true); // 초기에는 전체 보기로 시작
  const [animationProgress, setAnimationProgress] = useState(1); // 전체 경로 표시
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
    onResetKmMarkers();

    // gpx_coordinates에서 포인트 추출
    let points: GpxCoordinate[] | CoursePoint[] = [];
    if (trailData.course.gpx_coordinates) {
      try {
        points = JSON.parse(trailData.course.gpx_coordinates);
      } catch {
        points = trailData.points;
      }
    } else {
      points = trailData.points;
    }

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

    // 저장된 진행률부터 시작
    const startProgress = savedProgress;
    const startTime = Date.now() - startProgress * totalDuration;
    let currentIndex = Math.min(
      Math.floor(startProgress * (pointCount - 1)),
      pointCount - 1
    );

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const timeProgress = Math.min(elapsed / totalDuration, 1);

      currentIndex = Math.min(
        Math.floor(timeProgress * (pointCount - 1)),
        pointCount - 1
      );

      const actualProgress = currentIndex / (pointCount - 1);
      setAnimationProgress(actualProgress);

      if (timeProgress < 1 && currentIndex < pointCount - 1) {
        const point = points[currentIndex];

        // km 마커 표시 로직
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

        // 새로운 km 지점을 지났는지 확인
        if (currentKmMark > 0) {
          onKmMarkerShow(currentKmMark);
        }

        const pointLat = "lat" in point ? point.lat : point.latitude;
        const pointLng = "lng" in point ? point.lng : point.longitude;

        map.easeTo({
          center: [pointLng, pointLat],
          zoom: FLIGHT_CONFIG.FLIGHT_ZOOM,
          pitch: FLIGHT_CONFIG.FLIGHT_PITCH,
          bearing: FLIGHT_CONFIG.FLIGHT_BEARING,
          duration: 200,
          essential: true,
        });

        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 애니메이션 완료
        const lastPoint = points[pointCount - 1];
        const lastPointLat =
          "lat" in lastPoint ? lastPoint.lat : lastPoint.latitude;
        const lastPointLng =
          "lng" in lastPoint ? lastPoint.lng : lastPoint.longitude;

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
          setSavedProgress(0);

          setTimeout(() => {
            showFullRoute();
          }, FLIGHT_CONFIG.COMPLETION_DELAY);
        }, 600);
      }
    };

    // 시작 포인트로 이동
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
      duration: startProgress > 0 ? 200 : 500,
      essential: true,
    });

    setTimeout(
      () => {
        animationRef.current = requestAnimationFrame(animate);
      },
      startProgress > 0 ? 200 : 500
    );
  }, [trailData, isAnimating, savedProgress, mapRef, onKmMarkerShow, onResetKmMarkers]);

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
      }
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
    savedProgress,
    startTrailAnimation,
    showFullRoute,
    stopAnimation,
  };
};