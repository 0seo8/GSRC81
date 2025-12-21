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
      launchShowDuration: 100, // 네이티브 스플래시 최소 표시 시간
      launchAutoHide: false, // React에서 직접 제어
      launchFadeOutDuration: 0, // 즉시 사라짐
      backgroundColor: "#000000", // React 스플래시 배경과 동일
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
