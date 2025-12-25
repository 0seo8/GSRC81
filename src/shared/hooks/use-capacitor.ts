/**
 * Capacitor 환경 감지 및 초기화 Hook
 * - 네이티브 플랫폼 감지
 * - 스플래시 스크린 제어
 * - 상태바 설정
 */

import { useEffect, useState } from "react";

interface CapacitorStatus {
  isNative: boolean;
  platform: "ios" | "android" | "web";
  isReady: boolean;
}

export function useCapacitor() {
  const [status, setStatus] = useState<CapacitorStatus>({
    isNative: false,
    platform: "web",
    isReady: false,
  });

  useEffect(() => {
    const initializeCapacitor = async () => {
      try {
        // Capacitor 동적 import
        const { Capacitor } = await import("@capacitor/core");
        const isNative = Capacitor.isNativePlatform();
        const platform = Capacitor.getPlatform() as "ios" | "android" | "web";

        if (isNative) {
          console.log("🚀 Capacitor native platform detected:", platform);
          // Status Bar와 Keyboard 설정은 플러그인이 설치된 경우에만 작동
          // 현재는 기본 설정으로 진행
        }

        setStatus({
          isNative,
          platform,
          isReady: true,
        });

        console.log("✅ Capacitor initialized:", { isNative, platform });
      } catch (error) {
        console.error("❌ Capacitor initialization failed:", error);
        setStatus({
          isNative: false,
          platform: "web",
          isReady: true,
        });
      }
    };

    initializeCapacitor();
  }, []);

  return status;
}

/**
 * Capacitor 스플래시 스크린 숨기기 헬퍼
 */
export async function hideCapacitorSplash() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { SplashScreen } = await import("@capacitor/splash-screen");
      await SplashScreen.hide();
      console.log("✅ Native splash screen hidden");
    }
  } catch (error) {
    console.error("❌ Failed to hide splash screen:", error);
  }
}
