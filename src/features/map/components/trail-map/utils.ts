import { Course, CoursePoint } from "@/types";
import { GpxCoordinate, KmMarker, DIFFICULTY_MAP } from "./types";

// 두 좌표 간 거리 계산 (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
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
export const calculateKmMarkers = (
  points: GpxCoordinate[] | CoursePoint[],
): KmMarker[] => {
  const markers: KmMarker[] = [];
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
      currLng,
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

// 통계 계산 함수
export const calculateStats = (points: CoursePoint[], course: Course) => {
  const elevations = points.filter((p) => p.elevation).map((p) => p.elevation!);
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
    minLng: Math.min(...points.map((p) => p.longitude)),
    maxLng: Math.max(...points.map((p) => p.longitude)),
  };

  return {
    totalDistance: course.distance_km,
    elevationGain: course.elevation_gain || elevationGain,
    estimatedTime: (course.avg_time_min || 60) / 60, // 시간 단위로 변환
    maxElevation,
    minElevation,
    elevationLoss,
    difficulty: DIFFICULTY_MAP[course.difficulty] || course.difficulty,
    bounds,
  };
};

// 시간 포맷팅 함수
export const formatTime = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
};

// 줌 레벨 계산 함수
export const calculateZoomLevel = (bounds: {
  maxLat: number;
  minLat: number;
  maxLon: number;
  minLon: number;
}): number => {
  const latDiff = bounds.maxLat - bounds.minLat;
  const lonDiff = bounds.maxLon - bounds.minLon;
  const maxDiff = Math.max(latDiff, lonDiff);

  let zoom = 14;
  if (maxDiff < 0.001) zoom = 17;
  else if (maxDiff < 0.005) zoom = 16;
  else if (maxDiff < 0.01) zoom = 15;
  else if (maxDiff < 0.05) zoom = 13;

  return Math.min(zoom + 1, 17);
};
