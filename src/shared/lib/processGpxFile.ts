export interface GPXPoint {
  lat: number;
  lng: number;
  ele?: number;
  dist: number; // 🔥 시작점부터 누적거리 (미터)
}

export interface GPXBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface GPXStats {
  totalDistance: number; // km 단위 (예: 5.234)
  elevationGain: number; // 미터 단위 (예: 230)
  estimatedDuration: number; // 분 단위 (예: 45)
}

export interface ProcessedGPXData {
  version: "1.1";
  points: GPXPoint[];
  bounds: GPXBounds;
  stats: GPXStats;
  metadata?: {
    startPoint: { lat: number; lng: number };
    endPoint: { lat: number; lng: number };
    nearestStation?: string;
    importedAt: string;
  };
}

export function extractKmMarkers(points: GPXPoint[]): GPXPoint[] {
  // 1km(1000m) 마다 ±10m 오차 범위 내의 점들 추출
  return points.filter((point) => {
    const kmRemainder = point.dist % 1000;
    return kmRemainder <= 10 || kmRemainder >= 990;
  });
}
