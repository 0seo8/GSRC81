/**
 * 비행 모드 설정 기본값 및 제한
 * - FLIGHT_CONFIG의 보완
 * - 관리자 페이지에서 사용하는 제한값
 */

export const FLIGHT_DEFAULTS = {
  // 기본 비행 속도 (km/h)
  SPEED_KMH: 2.5,

  // 최소/최대 애니메이션 시간 (ms)
  MIN_DURATION: 15000, // 15초
  MAX_DURATION: 90000, // 90초

  // 예상 소요시간 계산 기준 속도 (km/h)
  ESTIMATION_SPEED: 5,
} as const;

export const FLIGHT_SETTING_LIMITS = {
  // 속도 범위 (km/h)
  SPEED: {
    MIN: 1,
    MAX: 10,
    STEP: 0.5,
    RECOMMENDED_MIN: 2.5,
    RECOMMENDED_MAX: 5,
  },

  // 최소 시간 범위 (초)
  MIN_DURATION: {
    MIN: 5,
    MAX: 60,
    STEP: 1,
    DEFAULT: 15,
  },

  // 최대 시간 범위 (초)
  MAX_DURATION: {
    MIN: 30,
    MAX: 300,
    STEP: 10,
    DEFAULT: 90,
    RECOMMENDED: 180,
  },
} as const;

/**
 * 예상 비행 시간 계산
 */
export function calculateFlightDuration(
  distanceKm: number,
  speedKmh: number,
  minDuration: number,
  maxDuration: number,
): number {
  const hoursNeeded = distanceKm / speedKmh;
  const calculatedDuration = hoursNeeded * 60 * 60 * 1000; // ms

  return Math.min(Math.max(calculatedDuration, minDuration), maxDuration);
}

/**
 * 거리별 예상 시간 계산 (초 단위)
 */
export function getEstimatedTime(
  distanceKm: number,
  speedKmh: number,
  minDurationMs: number,
  maxDurationMs: number,
): number {
  const durationMs = calculateFlightDuration(
    distanceKm,
    speedKmh,
    minDurationMs,
    maxDurationMs,
  );
  return Math.round(durationMs / 1000);
}
