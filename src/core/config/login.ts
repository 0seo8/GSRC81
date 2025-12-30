/**
 * Login Page Configuration
 *
 * 로그인 페이지 UI 관련 상수 및 설정
 * - 브랜드 일관성을 위한 중앙 집중식 설정
 * - SplashScreen, LoginPage, AdminLoginPage에서 공통 사용
 */

export const LOGIN_CONFIG = {
  /**
   * 브랜드 로고 설정
   * @see BrandLogo 컴포넌트에서 사용
   */
  LOGO: {
    WIDTH: 296,
    HEIGHT: 187,
    SRC: "/logo.png",
    ALT: "GSRC81 MAPS - RUN OUR ROUTE, MAKE YOUR STORY",
  },

  /**
   * 레이아웃 간격 설정
   */
  SPACING: {
    /** 로고와 버튼 사이 간격 (사용 안 함 - flex로 자동 조정) */
    LOGO_BOTTOM: "mb-12",
    /** 브랜드와 버튼 사이 간격 (사용 안 함 - flex로 자동 조정) */
    BRAND_BOTTOM: "mb-24",
    /** 버튼과 약관 사이 간격 (32px) - 8pt grid 준수 */
    TERMS_TOP: "mt-8",
    /** Safe area 여백 */
    SAFE_AREA: "h-8",
  },

  /**
   * 색상 설정
   * - Light/Dark 모드 대응
   */
  COLORS: {
    /** 배경색: Light(#EBE7E4), Dark(Lola-950) */
    BACKGROUND: "bg-base dark:bg-lola-950",
    /** 보조 텍스트 색상 */
    TEXT_SECONDARY: "text-lola-600 dark:text-lola-400",
    /** 주요 텍스트 색상 */
    TEXT_PRIMARY: "text-lola-950 dark:text-lola-50",
    /** 링크 호버 색상 */
    LINK_HOVER: "hover:text-lola-700 dark:hover:text-lola-300",
    /** 로고 텍스트 색상 */
    LOGO_TEXT: "text-lola-950 dark:text-lola-50",
  },

  /**
   * 텍스트 콘텐츠
   */
  TEXT: {
    TITLE: "GSRC81 MAPS",
    LOGIN_BUTTON: "카카오톡 계정으로 계속하기",
    TERMS_KO:
      "카카오톡으로 로그인하면 GSRC81의 회칙 및 개인정보 처리방침에 동의하게 됩니다.",
    TERMS_EN:
      "By logging in with KakaoTalk, you confirm that you agree to GSRC81's Terms of Service and Privacy Policy.",
    LOADING: "Loading...",
  },

  /**
   * 라우트 경로
   */
  ROUTES: {
    LOGIN: "/login",
    MAP: "/map",
    VERIFY: "/verify",
  },
} as const;
