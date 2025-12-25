// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gsrc81.maps",
  appName: "GSRC81 Maps",
  webDir: "out", // 사용되지 않지만 남겨도 무방 ('.next'는 피하세요)
  server: {
    url: "https://gsrc-81.vercel.app", // ✅ 프로덕션 배포 URL
    allowNavigation: ["https://gsrc-81.vercel.app"],
  },
  plugins: {
    SplashScreen: {
      // React 스플래시로 빠르게 전환하기 위해 네이티브 스플래시를 최소화
      launchShowDuration: 200, // 네이티브 스플래시 최소 표시 시간 (200ms)
      launchAutoHide: false, // React에서 직접 제어
      launchFadeOutDuration: 0, // 즉시 사라짐 (React가 페이드 처리)
      backgroundColor: "#E8E4DF", // DESIGN_SYSTEM.md bg-base 색상
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      iosSpinnerStyle: "small", // iOS 스피너 스타일
      spinnerColor: "#000000", // 검은색 스피너
      showSpinner: false, // React에서 애니메이션 처리
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
