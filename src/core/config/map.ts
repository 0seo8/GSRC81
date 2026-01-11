/**
 * 지도 관련 상수 정의
 */

// 은평구 중심 좌표
export const EUNPYEONG_CENTER: [number, number] = [126.9285, 37.6176];

// 기본 줌 레벨
export const DEFAULT_ZOOM = 11.5;

// 현재 위치 이동 시 줌 레벨
export const CURRENT_LOCATION_ZOOM = 14;

// 지도 이동 애니메이션 시간 (ms)
export const FLY_TO_DURATION = 1000;

// 현재 위치 버튼 스타일
export const LOCATION_BUTTON_STYLES = {
  position: "absolute" as const,
  top: "4rem", // top-16
  right: "1rem", // right-4
  zIndex: 20,
};

// Geolocation 옵션
export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // 5분
};

// Mapbox 스타일 (map 페이지용)
export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

// 환경변수
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

// =============================================================================
// 클러스터링 설정
// =============================================================================

/**
 * Mapbox 클러스터링 설정
 */
export const CLUSTER_CONFIG = {
  /** 클러스터링이 활성화되는 최대 줌 레벨 */
  MAX_ZOOM: 12,
  /** 클러스터 반경 (픽셀) */
  RADIUS: 50,
} as const;

// =============================================================================
// 마커 오프셋 설정
// =============================================================================

/** 바텀시트 스냅 포인트 타입 */
export type SnapPoint = "closed" | "medium" | "full";

/**
 * 바텀시트 상태별 마커 오프셋 비율
 *
 * 마커가 바텀시트 위 가시 영역의 적절한 위치에 오도록 조정
 * - closed: 오프셋 없음 (화면 중앙)
 * - medium/full: 화면 상단 25% 지점에 마커 위치
 */
export const MARKER_OFFSET_RATIO = {
  /** 바텀시트 닫힘 - 오프셋 없음 */
  closed: 0,
  /** 바텀시트 중간 (60vh) - 화면 높이의 25% 위로 */
  medium: 0.25,
  /** 바텀시트 전체 (95vh) - 화면 높이의 25% 위로 */
  full: 0.25,
} as const;

/**
 * 바텀시트 스냅 포인트에 따른 마커 오프셋 계산
 *
 * Mapbox의 `easeTo`/`flyTo` offset 파라미터에 사용됩니다.
 * - 양수: 지도 중심이 아래로 이동 → 마커가 화면 위쪽에 보임
 * - 음수: 지도 중심이 위로 이동 → 마커가 화면 아래쪽에 보임
 *
 * @param snapPoint - 바텀시트 스냅 상태 ("closed" | "medium" | "full")
 * @returns 픽셀 단위 Y 오프셋 (음수 = 마커가 위로 이동)
 *
 * @example
 * ```typescript
 * const offsetY = getMarkerOffset("medium");
 * map.easeTo({
 *   center: [lng, lat],
 *   offset: [0, offsetY],
 * });
 * ```
 */
export function getMarkerOffset(snapPoint: SnapPoint): number {
  if (typeof window === "undefined") return 0;

  const vh = window.innerHeight;
  const ratio = MARKER_OFFSET_RATIO[snapPoint];

  // 음수 = 마커가 화면 위쪽으로 이동
  return -(vh * ratio);
}

// =============================================================================
// 마커 애니메이션 설정
// =============================================================================

/**
 * 마커 클릭 시 easeTo 애니메이션 설정
 */
export const MARKER_ANIMATION = {
  /** 최소 애니메이션 시간 (ms) */
  MIN_DURATION: 200,
  /** 최대 애니메이션 시간 (ms) */
  MAX_DURATION: 800,
  /** 거리당 시간 계수 (픽셀당 ms) */
  DURATION_PER_PIXEL: 2,
} as const;

// =============================================================================
// 맵 바운드 설정
// =============================================================================

/**
 * fitBounds 설정
 */
export const FIT_BOUNDS_CONFIG = {
  /** 좌표 범위에 대한 패딩 비율 (15%) */
  PADDING_RATIO: 0.15,
  /** 최소 패딩 (좌표 단위) */
  MIN_PADDING: 0.01,
  /** UI 요소를 위한 픽셀 패딩 */
  UI_PADDING: 80,
  /** fitBounds 최대 줌 레벨 */
  MAX_ZOOM: 12.5,
} as const;
