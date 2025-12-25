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
          // Status Bar 설정
          try {
            const { StatusBar, Style } = await import("@capacitor/status-bar");

            // iOS: 라이트 컨텐츠 (흰색 텍스트)
            // Android: 다크 컨텐츠 (검은색 텍스트)
            if (platform === "ios") {
              await StatusBar.setStyle({ style: Style.Light });
              await StatusBar.setBackgroundColor({ color: "#000000" });
            } else {
              await StatusBar.setStyle({ style: Style.Dark });
              await StatusBar.setBackgroundColor({ color: "#E8E4DF" });
            }
          } catch (error) {
            console.warn("StatusBar plugin not available:", error);
          }

          // Keyboard 설정
          try {
            const { Keyboard } = await import("@capacitor/keyboard");
            await Keyboard.setAccessoryBarVisible({ isVisible: true });
            await Keyboard.setScroll({ isDisabled: false });
          } catch (error) {
            console.warn("Keyboard plugin not available:", error);
          }
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
