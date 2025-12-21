"use client";

import { useEffect, useState } from "react";
import { SplashScreen } from "@/shared/components/common/splash-screen";
import { Capacitor } from "@capacitor/core";
import { SplashScreen as CapacitorSplash } from "@capacitor/splash-screen";

const SPLASH_KEY = "gsrc81_splash_shown";

// Capacitor 앱 여부 감지
const isNativeApp =
  typeof window !== "undefined" && Capacitor.isNativePlatform();

export function GlobalSplash({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSplash = async () => {
      // Capacitor 네이티브 앱이면 네이티브 스플래시를 즉시 숨김
      if (isNativeApp) {
        await CapacitorSplash.hide({ fadeOutDuration: 0 });
      }

      // 환경에 따라 다른 Storage 사용
      const storage = isNativeApp ? localStorage : sessionStorage;
      const hasSeenSplash = storage.getItem(SPLASH_KEY);

      if (hasSeenSplash === "true") {
        setShowSplash(false);
      }

      setIsChecking(false);
    };

    checkSplash();
  }, []);

  const handleSplashComplete = () => {
    // 환경에 따라 다른 Storage에 저장
    const storage = isNativeApp ? localStorage : sessionStorage;
    storage.setItem(SPLASH_KEY, "true");

    // Exit 애니메이션 시간(500ms)을 고려하여 지연
    setTimeout(() => {
      setShowSplash(false);
    }, 600);
  };

  // 체크 중에는 로딩 표시 (깜빡임 방지)
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-[#B8FF3A] border-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  // 스플래시 표시
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // 앱 콘텐츠 표시
  return <>{children}</>;
}
