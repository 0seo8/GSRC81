/**
 * Login Page Configuration
 * 로그인 페이지 UI 관련 상수 및 설정
 */

export const LOGIN_CONFIG = {
  LOGO: {
    WIDTH: 296,
    HEIGHT: 187,
    SRC: "/logo.png",
    ALT: "GSRC81 MAPS - RUN OUR ROUTE, MAKE YOUR STORY",
  },
  SPACING: {
    LOGO_BOTTOM: "mb-12",
    BRAND_BOTTOM: "mb-24", // 로고와 버튼 사이 간격 증가 (64px → 96px) - 시각적 분리 강화
    TERMS_TOP: "mt-8", // 버튼과 약관 사이 간격 (24px → 32px) - 8pt grid 준수
    SAFE_AREA: "h-8",
  },
  COLORS: {
    BACKGROUND: "bg-base dark:bg-lola-950", // Light: #EBE7E4, Dark: Lola-950
    TEXT_SECONDARY: "text-lola-600 dark:text-lola-400", // 다크모드 대응
    TEXT_PRIMARY: "text-lola-950 dark:text-lola-50", // 다크모드 대응
    LINK_HOVER: "hover:text-lola-700 dark:hover:text-lola-300", // 링크 hover 색상
    LOGO_TEXT: "text-lola-950 dark:text-lola-50", // 로고 텍스트
  },
  TEXT: {
    TITLE: "GSRC81 MAPS",
    LOGIN_BUTTON: "카카오톡 계정으로 계속하기",
    TERMS_KO:
      "카카오톡으로 로그인하면 GSRC81의 회칙 및 개인정보 처리방침에 동의하게 됩니다.",
    TERMS_EN:
      "By logging in with KakaoTalk, you confirm that you agree to GSRC81's Terms of Service and Privacy Policy.",
    LOADING: "Loading...",
  },
  ROUTES: {
    LOGIN: "/login",
    MAP: "/map",
    VERIFY: "/verify",
  },
} as const;
