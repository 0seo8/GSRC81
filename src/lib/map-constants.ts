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

// Mapbox 스타일
export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

// 환경변수
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";