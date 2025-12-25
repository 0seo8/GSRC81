/**
 * 스플래시 스크린 애니메이션 타이밍 상수
 * - 브랜드 일관성을 위해 중앙 관리
 * - 디자이너와 협업 시 타이밍 조정 용이
 */

export const SPLASH_TIMINGS = {
  // 텍스트 애니메이션 타이밍 (ms)
  TEXT_1: 600, // "RUN"
  TEXT_2: 1200, // "OUR ROUTE,"
  TEXT_3: 1800, // "MAKE"
  TEXT_4: 2400, // "YOUR STORY."

  // 로고 전환 타이밍 (ms)
  LOGO_SHOW: 3400, // 텍스트 퇴장 후 로고 등장

  // 완료 타이밍 (ms)
  COMPLETE: 4200, // 로그인 화면으로 전환

  // 애니메이션 지속 시간 (ms)
  ANIMATION_DURATION: 800, // 개별 텍스트 애니메이션 시간
  FADE_OUT_DURATION: 500, // 스플래시 페이드아웃 시간
} as const;

export const SPLASH_TEXT_LINES = [
  "RUN",
  "OUR ROUTE,",
  "MAKE",
  "YOUR STORY.",
] as const;
