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
    BRAND_BOTTOM: "mb-16",
    TERMS_TOP: "mt-6",
    SAFE_AREA: "h-8",
  },
  COLORS: {
    BACKGROUND: "bg-gray-100",
    TEXT_SECONDARY: "text-gray-500",
    TEXT_PRIMARY: "text-black",
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
