// GSRC81 MAPS - GPX 파일 처리 파이프라인
// GPX 업로드 → dist 계산 → DB 저장용 JSON 생성

import GPXParser from "gpxparser";

// ====================================================================
// 타입 정의
// ====================================================================

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

export interface ProcessingResult {
  success: boolean;
  data?: ProcessedGPXData;
  error?: string;
  warnings?: string[];
}

// ====================================================================
// 거리 계산 (Haversine Formula)
// ====================================================================

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // 지구 반지름 (미터)

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위
}

// ====================================================================
// 고도 계산
// ====================================================================

function calculateElevationGain(points: GPXPoint[]): number {
  let totalGain = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    if (prev.ele !== undefined && curr.ele !== undefined) {
      const gain = curr.ele - prev.ele;
      if (gain > 0) {
        totalGain += gain;
      }
    }
  }

  return Math.round(totalGain);
}

// ====================================================================
// 예상 시간 계산 (Naismith's Rule 기반)
// ====================================================================

function estimateDuration(distanceKm: number, elevationGainM: number): number {
  // 기본: 5km/h 속도
  const baseTimeHours = distanceKm / 5;

  // 고도 보정: 100m당 15분 추가
  const elevationTimeHours = (elevationGainM / 100) * 0.25;

  const totalHours = baseTimeHours + elevationTimeHours;
  return Math.round(totalHours * 60); // 분 단위
}

// ====================================================================
// 경계 계산
// ====================================================================

function calculateBounds(points: GPXPoint[]): GPXBounds {
  if (points.length === 0) {
    throw new Error("Cannot calculate bounds: no points provided");
  }

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  return { minLat, maxLat, minLng, maxLng };
}

// ====================================================================
// GPX 파일 처리 메인 함수
// ====================================================================

export async function processGpxFile(
  file: File,
  options: {
    nearestStation?: string;
    minPointDistance?: number; // 미터 단위, 너무 가까운 점들 필터링
    maxPoints?: number; // 최대 포인트 수 제한
  } = {},
): Promise<ProcessingResult> {
  const warnings: string[] = [];

  try {
    // 1) 파일 읽기
    const fileContent = await file.text();

    // 2) GPX 파싱
    const gpx = new GPXParser();
    gpx.parse(fileContent);

    if (!gpx.tracks || gpx.tracks.length === 0) {
      return {
        success: false,
        error: "GPX 파일에 트랙 데이터가 없습니다.",
      };
    }

    // 첫 번째 트랙의 첫 번째 세그먼트 사용
    const track = gpx.tracks[0];
    const segment = track.points as Array<{
      lat: number;
      lon: number;
      ele?: number;
    }>;

    if (!segment || segment.length < 2) {
      return {
        success: false,
        error: "트랙에 충분한 포인트가 없습니다. (최소 2개 필요)",
      };
    }

    // 3) 원본 포인트 추출
    let rawPoints = segment.map((pt) => ({
      lat: pt.lat,
      lng: pt.lon, // GPXParser는 lon을 사용
      ele: pt.ele || undefined,
    }));

    // 4) 포인트 필터링 (옵션)
    if (options.minPointDistance && options.minPointDistance > 0) {
      const filtered = [rawPoints[0]]; // 첫 점은 항상 포함

      for (let i = 1; i < rawPoints.length; i++) {
        const prev = filtered[filtered.length - 1];
        const curr = rawPoints[i];

        const distance = haversineDistance(
          prev.lat,
          prev.lng,
          curr.lat,
          curr.lng,
        );

        if (distance >= options.minPointDistance) {
          filtered.push(curr);
        }
      }

      if (filtered.length !== rawPoints.length) {
        warnings.push(
          `포인트 필터링: ${rawPoints.length} → ${filtered.length} (${options.minPointDistance}m 간격)`,
        );
      }

      rawPoints = filtered;
    }

    // 5) 최대 포인트 수 제한
    if (options.maxPoints && rawPoints.length > options.maxPoints) {
      const step = Math.ceil(rawPoints.length / options.maxPoints);
      const sampled = [];

      for (let i = 0; i < rawPoints.length; i += step) {
        sampled.push(rawPoints[i]);
      }

      // 마지막 점은 항상 포함
      if (sampled[sampled.length - 1] !== rawPoints[rawPoints.length - 1]) {
        sampled.push(rawPoints[rawPoints.length - 1]);
      }

      warnings.push(
        `포인트 샘플링: ${rawPoints.length} → ${sampled.length} (최대 ${options.maxPoints}개)`,
      );

      rawPoints = sampled;
    }

    // 6) 🔥 dist 계산 (핵심!)
    const pointsWithDist: GPXPoint[] = [];
    let cumulativeDistance = 0;

    for (let i = 0; i < rawPoints.length; i++) {
      const point = rawPoints[i];

      if (i === 0) {
        // 첫 번째 점은 거리 0
        pointsWithDist.push({
          ...point,
          dist: 0,
        });
      } else {
        // 이전 점으로부터의 거리 계산
        const prevPoint = rawPoints[i - 1];
        const segmentDistance = haversineDistance(
          prevPoint.lat,
          prevPoint.lng,
          point.lat,
          point.lng,
        );

        cumulativeDistance += segmentDistance;

        pointsWithDist.push({
          ...point,
          dist: Math.round(cumulativeDistance), // 미터 단위, 정수로 반올림
        });
      }
    }

    // 7) 통계 계산
    const totalDistanceKm = cumulativeDistance / 1000;
    const elevationGain = calculateElevationGain(pointsWithDist);
    const estimatedDurationMin = estimateDuration(
      totalDistanceKm,
      elevationGain,
    );

    // 8) 경계 계산
    const bounds = calculateBounds(pointsWithDist);

    // 9) 최종 데이터 구성
    const processedData: ProcessedGPXData = {
      version: "1.1",
      points: pointsWithDist,
      bounds,
      stats: {
        totalDistance: Math.round(totalDistanceKm * 1000) / 1000, // 소수점 3자리
        elevationGain,
        estimatedDuration: estimatedDurationMin,
      },
      metadata: {
        startPoint: {
          lat: pointsWithDist[0].lat,
          lng: pointsWithDist[0].lng,
        },
        endPoint: {
          lat: pointsWithDist[pointsWithDist.length - 1].lat,
          lng: pointsWithDist[pointsWithDist.length - 1].lng,
        },
        nearestStation: options.nearestStation,
        importedAt: new Date().toISOString(),
      },
    };

    return {
      success: true,
      data: processedData,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "GPX 파일 처리 중 오류가 발생했습니다.",
    };
  }
}

// ====================================================================
// 1km 마커 추출 유틸리티
// ====================================================================

export function extractKmMarkers(points: GPXPoint[]): GPXPoint[] {
  // 1km(1000m) 마다 ±10m 오차 범위 내의 점들 추출
  return points.filter((point) => {
    const kmRemainder = point.dist % 1000;
    return kmRemainder <= 10 || kmRemainder >= 990;
  });
}

// ====================================================================
// 검증 함수
// ====================================================================

export function validateGPXData(data: unknown): data is ProcessedGPXData {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;
  const bounds = obj.bounds as Record<string, unknown> | null;
  const stats = obj.stats as Record<string, unknown> | null;

  return (
    obj.version === "1.1" &&
    Array.isArray(obj.points) &&
    obj.points.length >= 2 &&
    obj.points.every((p: unknown) => {
      const point = p as Record<string, unknown>;
      return (
        typeof point.lat === "number" &&
        typeof point.lng === "number" &&
        typeof point.dist === "number"
      );
    }) &&
    typeof obj.bounds === "object" &&
    bounds !== null &&
    typeof bounds.minLat === "number" &&
    typeof bounds.maxLat === "number" &&
    typeof bounds.minLng === "number" &&
    typeof bounds.maxLng === "number" &&
    typeof obj.stats === "object" &&
    stats !== null &&
    typeof stats.totalDistance === "number" &&
    typeof stats.elevationGain === "number" &&
    typeof stats.estimatedDuration === "number"
  );
}
