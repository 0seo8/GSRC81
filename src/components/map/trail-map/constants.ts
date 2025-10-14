export const FLIGHT_CONFIG = {
  // 기본 비행 속도 (포인트당 지속시간 ms) - 낮을수록 빠름
  BASE_DURATION_PER_POINT: 200,

  // 최소/최대 총 애니메이션 시간 (ms)
  MIN_TOTAL_DURATION: 30000,  // 30초
  MAX_TOTAL_DURATION: 60000,  // 60초

  // 카메라 설정
  FLIGHT_ZOOM: 16,
  FLIGHT_PITCH: 60,
  FLIGHT_BEARING: 0,

  // 애니메이션 완료 후 전체보기 전환 지연시간
  COMPLETION_DELAY: 1500,
} as const;

export const MAP_STYLES = {
  trailLineLayer: {
    id: "trail-line",
    type: "line" as const,
    paint: {
      "line-color": "#000000",
      "line-width": 4,
    },
    layout: {
      "line-join": "round" as const,
      "line-cap": "round" as const,
    },
  },
  trailOutlineLayer: {
    id: "trail-outline",
    type: "line" as const,
    paint: {},
    layout: {
      "line-join": "round" as const,
      "line-cap": "round" as const,
    },
  },
};

export const INITIAL_VIEW_STATE = {
  longitude: 129.0,
  latitude: 35.2,
  zoom: 14,
  pitch: 0,
  bearing: 0,
};

export const DIFFICULTY_MAP = {
  easy: "Easy",
  medium: "Moderate",
  hard: "Hard",
} as const;