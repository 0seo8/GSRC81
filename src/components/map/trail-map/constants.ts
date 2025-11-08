export const FLIGHT_CONFIG = {
  // 거리 기반 비행 속도 (km/h) - 일정한 속도 유지
  FLIGHT_SPEED_KMH: 2.5, // 시속 2.5km
  
  // 최소/최대 총 애니메이션 시간 (ms)
  MIN_TOTAL_DURATION: 15000, // 15초 (짧은 코스용)
  MAX_TOTAL_DURATION: 90000, // 90초 (긴 코스용)

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
