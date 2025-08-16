// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gsrc81.maps",
  appName: "GSRC81 Maps",
  webDir: "out", // 사용되지 않지만 남겨도 무방 ('.next'는 피하세요)
  server: {
    url: "http://192.168.45.4:3001", // ✅ 개발용 로컬 서버
    cleartext: true, // ✅ HTTP(비TLS)일 때 필요
    allowNavigation: ["http://192.168.45.4:3001", "https://gsrc-81.vercel.app"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: "#f97316",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
