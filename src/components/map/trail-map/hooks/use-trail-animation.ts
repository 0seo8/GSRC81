import { useState, useRef, useCallback, useEffect } from "react";
import { MapRef } from "react-map-gl/mapbox";
import { TrailData, GpxCoordinate, KmMarker } from "../types";
import { FLIGHT_CONFIG } from "../constants";
import { calculateDistance, calculateKmMarkers } from "../utils";
import { CoursePoint } from "@/types";

export const useTrailAnimation = (
  mapRef: React.RefObject<MapRef>,
  trailData: TrailData | null,
  onKmMarkerShow: (km: number) => void,
  onResetKmMarkers: () => void,
  setKmMarkers: (markers: KmMarker[]) => void
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

    console.log('🚁 Starting trail animation...');
    console.log('📊 Trail data:', {
      course: trailData.course.title,
      hasGpxCoordinates: !!trailData.course.gpx_coordinates,
      pointsLength: trailData.points.length,
      geoJSONFeatures: trailData.geoJSON.features.length,
      geoJSONCoordinates: trailData.geoJSON.features[0]?.geometry.coordinates.length
    });

    setIsAnimating(true);
    setIsFullRouteView(false);
    onResetKmMarkers();

    // V2 구조에서 포인트 추출 - trailData.course.gpx_data.points 사용
    let points: GpxCoordinate[] = [];
    
    // 1순위: TrailMapV2에서 전달된 geoJSON 좌표
    const coordinates = trailData.geoJSON.features[0]?.geometry.coordinates;
    if (coordinates && coordinates.length > 0) {
      points = coordinates.map(coord => ({
        lng: coord[0],
        lat: coord[1],
        ele: coord[2] || 0
      }));
      console.log('📍 Using geoJSON coordinates for animation');
    } 
    // 2순위: 원본 gpx_data.points에서 직접 추출
    else if (trailData.course.gpx_data?.points) {
      points = trailData.course.gpx_data.points.map(point => ({
        lng: point.lng,
        lat: point.lat,
        ele: point.ele || 0
      }));
      console.log('📍 Using gpx_data.points for animation');
    }
    // 3순위 (레거시): gpx_coordinates 파싱
    else if (trailData.course.gpx_coordinates) {
      try {
        points = JSON.parse(trailData.course.gpx_coordinates);
        console.log('📍 Using legacy gpx_coordinates for animation');
      } catch {
        console.error('❌ Failed to parse gpx_coordinates');
      }
    }

    console.log(`📍 Extracted ${points.length} points for animation`);
    if (points.length === 0) {
      console.error('❌ No points available for animation');
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
        currPt.lng
      );
      
      cumulativeDistance += segmentDistance;
      
      // 1km 지점마다 마커 위치 저장
      if (cumulativeDistance >= nextKmTarget * 1000) {
        kmMarkerPositions.push({
          km: nextKmTarget,
          position: { lat: currPt.lat, lng: currPt.lng }
        });
        console.log(`📍 ${nextKmTarget}km 마커 위치 설정: ${currPt.lat}, ${currPt.lng}`);
        nextKmTarget++;
      }
    }
    
    // km 마커들을 useKmMarkers에 설정
    setKmMarkers(kmMarkerPositions);
    console.log(`📍 총 ${kmMarkerPositions.length}개의 km 마커 설정 완료`);

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

    console.log(`⏱️ Animation settings:`, {
      pointCount,
      totalDuration: `${totalDuration}ms`,
      baseDurationPerPoint: FLIGHT_CONFIG.BASE_DURATION_PER_POINT,
      minDuration: FLIGHT_CONFIG.MIN_TOTAL_DURATION,
      maxDuration: FLIGHT_CONFIG.MAX_TOTAL_DURATION
    });

    // 저장된 진행률부터 시작 (새로운 애니메이션은 항상 0부터 시작)
    const startProgress = 0; // savedProgress를 사용하지 않고 항상 처음부터 시작
    const startTime = Date.now();
    
    console.log(`🚀 Animation starting from progress: ${startProgress}, startTime: ${startTime}`);
    let currentIndex = Math.min(
      Math.floor(startProgress * (pointCount - 1)),
      pointCount - 1
    );
    
    // km 마커 표시를 위한 변수들
    let shownKmMarkers = new Set<number>();
    let lastCalculatedIndex = 0;
    let lastCumulativeDistance = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const timeProgress = Math.min(elapsed / totalDuration, 1);
      
      // 첫 번째 animate 호출 확인
      if (elapsed < 1000) {
        console.log(`🎯 Animate function called! elapsed=${elapsed}ms, timeProgress=${timeProgress.toFixed(3)}`);
      }

      currentIndex = Math.min(
        Math.floor(timeProgress * (pointCount - 1)),
        pointCount - 1
      );

      const actualProgress = currentIndex / (pointCount - 1);
      setAnimationProgress(actualProgress);

      // 디버깅: 애니메이션 진행 상황 로깅
      if (currentIndex % 100 === 0) { // 100포인트마다 로그
        console.log(`✈️ Animation progress: ${(timeProgress * 100).toFixed(1)}%, Point: ${currentIndex}/${pointCount - 1}, elapsed: ${elapsed}ms`);
      }

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
              currPt.lng
            );
          }
          lastCalculatedIndex = currentIndex;
        }
        
        const currentKmMark = Math.floor(lastCumulativeDistance / 1000);
        
        // 새로운 km 지점을 지났는지 확인 (이미 표시되지 않은 것만)
        if (currentKmMark > 0 && !shownKmMarkers.has(currentKmMark)) {
          onKmMarkerShow(currentKmMark);
          shownKmMarkers.add(currentKmMark);
          console.log(`🏃 ${currentKmMark}km 지점 통과! (실제 거리: ${(lastCumulativeDistance/1000).toFixed(2)}km, 포인트: ${currentIndex})`);
        }

        const pointLat = point.lat;
        const pointLng = point.lng;

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
        // 애니메이션 완료 - 왜 종료되었는지 분석
        console.log(`🏁 Animation STOPPED! Progress: ${(timeProgress * 100).toFixed(1)}%, Point: ${currentIndex}/${pointCount - 1}, elapsed: ${elapsed}ms`);
        console.log(`🔍 Termination conditions:`);
        console.log(`   - timeProgress >= 1? ${timeProgress >= 1} (${timeProgress.toFixed(6)})`);
        console.log(`   - currentIndex >= pointCount-1? ${currentIndex >= pointCount - 1} (${currentIndex} >= ${pointCount - 1})`);
        console.log(`   - totalDuration: ${totalDuration}ms`);
        console.log(`   - Should continue? ${timeProgress < 1 && currentIndex < pointCount - 1}`);
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
          setSavedProgress(0);

          setTimeout(() => {
            showFullRoute();
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
    console.log(`⏰ Starting animation in ${delay}ms...`);
    
    setTimeout(
      () => {
        console.log(`🎬 Starting animation loop now...`);
        animationRef.current = requestAnimationFrame(animate);
      },
      delay
    );
  }, [trailData, isAnimating, savedProgress, mapRef, onKmMarkerShow, onResetKmMarkers, setKmMarkers]);

  const showFullRoute = useCallback(() => {
    if (!trailData || !mapRef.current) return;

    console.log(`🔄 showFullRoute called! Current animation state: isAnimating=${isAnimating}, progress=${animationProgress}`);

    // 진행 중인 애니메이션 중단하고 현재 진행률 저장
    if (animationRef.current) {
      console.log(`🛑 Cancelling animation...`);
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