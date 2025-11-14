import * as turf from "@turf/turf";

interface GPXPoint {
  lat: number;
  lng: number;
}

/**
 * 클릭한 지점이 GPX 노선으로부터 지정된 거리 내에 있는지 확인
 * @param clickPoint 클릭한 지점 (위도, 경도)
 * @param gpxPoints GPX 노선 포인트 배열
 * @param maxDistanceMeters 허용 거리 (미터)
 * @returns 노선 범위 내에 있으면 true
 */
export function isWithinGPXRange(
  clickPoint: [number, number], // [longitude, latitude]
  gpxPoints: GPXPoint[],
  maxDistanceMeters: number = 50
): boolean {
  if (gpxPoints.length < 2) {
    return false;
  }

  try {
    // GPX 포인트들을 GeoJSON LineString으로 변환
    const lineCoordinates = gpxPoints.map(point => [point.lng, point.lat]);
    const lineString = turf.lineString(lineCoordinates);

    // 클릭 지점을 GeoJSON Point로 변환
    const clickPointGeoJSON = turf.point(clickPoint);

    // 클릭 지점에서 노선까지의 최단 거리 계산
    const distance = turf.pointToLineDistance(
      clickPointGeoJSON,
      lineString,
      { units: "meters" }
    );

    return distance <= maxDistanceMeters;
  } catch (error) {
    console.error("GPX 거리 계산 오류:", error);
    return false;
  }
}

/**
 * 클릭한 지점에서 GPX 노선 상의 가장 가까운 지점 찾기
 * @param clickPoint 클릭한 지점
 * @param gpxPoints GPX 노선 포인트 배열
 * @returns 가장 가까운 노선상의 지점과 거리 정보
 */
export function findNearestPointOnGPX(
  clickPoint: [number, number],
  gpxPoints: GPXPoint[]
): {
  nearestPoint: [number, number];
  distance: number;
  routeIndex: number;
} | null {
  if (gpxPoints.length < 2) {
    return null;
  }

  try {
    const lineCoordinates = gpxPoints.map(point => [point.lng, point.lat]);
    const lineString = turf.lineString(lineCoordinates);
    const clickPointGeoJSON = turf.point(clickPoint);

    // 노선 상의 가장 가까운 지점 찾기
    const nearestPointOnLine = turf.nearestPointOnLine(lineString, clickPointGeoJSON);
    
    return {
      nearestPoint: nearestPointOnLine.geometry.coordinates as [number, number],
      distance: turf.distance(clickPointGeoJSON, nearestPointOnLine, { units: "meters" }),
      routeIndex: nearestPointOnLine.properties.index || 0,
    };
  } catch (error) {
    console.error("가장 가까운 지점 계산 오류:", error);
    return null;
  }
}