// GSRC81 Maps Constants

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: {
    lng: 126.9227,
    lat: 37.6176,
  } as const,
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18,
  CLUSTER_RADIUS: 500, // meters
  MAX_COURSES_PER_CLUSTER: 5,
} as const;

// Mapbox Styles
export const MAP_STYLES = {
  SATELLITE: "mapbox://styles/mapbox/satellite-v9",
  STREETS: "mapbox://styles/mapbox/streets-v12",
  LIGHT: "mapbox://styles/mapbox/light-v11",
} as const;

// Course Difficulty Colors
export const DIFFICULTY_COLORS = {
  easy: "#6b7280", // gray-500
  medium: "#4b5563", // gray-600
  hard: "#374151", // gray-700
} as const;

// Course Difficulty Labels
export const DIFFICULTY_LABELS = {
  easy: "초급",
  medium: "중급",
  hard: "고급",
} as const;

// Animation Configuration
export const ANIMATION_CONFIG = {
  MASCOT_SPEED: 2000, // ms per animation cycle
  FADE_DURATION: 300,
  SLIDE_DURATION: 400,
} as const;

// UI Configuration
export const UI_CONFIG = {
  COMMENT_MAX_LENGTH: 200,
  NICKNAME_MAX_LENGTH: 50,
  COURSE_TITLE_MAX_LENGTH: 200,
  COURSE_DESCRIPTION_MAX_LENGTH: 1000,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "gsrc81_auth_token",
  MAP_VIEW_STATE: "gsrc81_map_view_state",
  USER_PREFERENCES: "gsrc81_user_preferences",
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  COURSES: "/api/courses",
  COMMENTS: "/api/comments",
  AUTH: "/api/auth",
  ADMIN: "/api/admin",
  UPLOAD: "/api/upload",
} as const;

// Brand Colors (GSRC81) - Monochrome
export const BRAND_COLORS = {
  PRIMARY: "#1f2937", // 주요 색상 (다크 그레이)
  SECONDARY: "#1a1a1a", // 어두운 회색
  ACCENT: "#374151", // 액센트 색상 (미디엄 그레이)
  SUCCESS: "#4b5563", // 성공 색상 (그레이)
  WARNING: "#6b7280", // 경고 색상 (라이트 그레이)
  ERROR: "#374151", // 에러 색상 (미디엄 그레이)
  NEUTRAL: "#6b7280", // 중성 색상 (그레이)
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NICKNAME_MIN_LENGTH: 2,
  MESSAGE_MIN_LENGTH: 1,
  GPX_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_GPX_TYPES: ["application/gpx+xml", "text/xml", "application/xml"],
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  AUTHENTICATION_FAILED: "비밀번호가 올바르지 않습니다.",
  NETWORK_ERROR: "네트워크 연결을 확인해주세요.",
  FILE_TOO_LARGE: "파일 크기가 너무 큽니다.",
  INVALID_FILE_TYPE: "지원하지 않는 파일 형식입니다.",
  REQUIRED_FIELD: "필수 입력 항목입니다.",
  INVALID_COORDINATES: "올바르지 않은 좌표입니다.",
  GPX_PARSE_ERROR: "GPX 파일을 읽을 수 없습니다.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "로그인되었습니다.",
  COMMENT_POSTED: "댓글이 등록되었습니다.",
  COURSE_CREATED: "코스가 생성되었습니다.",
  COURSE_UPDATED: "코스가 수정되었습니다.",
  COURSE_DELETED: "코스가 삭제되었습니다.",
} as const;
