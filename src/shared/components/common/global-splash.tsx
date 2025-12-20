"use client";

import { useEffect, useState } from "react";
import { SplashScreen } from "@/shared/components/common/splash-screen";

const SPLASH_KEY = "gsrc81_splash_shown";

export function GlobalSplash({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // sessionStorage 사용: 브라우저 탭이 열려있는 동안만 유효
    // 탭을 닫고 다시 열면 다시 스플래시 표시 (디즈니+ 스타일)
    const hasSeenSplash = sessionStorage.getItem(SPLASH_KEY);

    if (hasSeenSplash === "true") {
      // 이미 이 세션에서 스플래시를 본 경우
      setShowSplash(false);
    }

    setIsChecking(false);
  }, []);

  const handleSplashComplete = () => {
    // 이 세션에서 스플래시를 봤다고 표시
    sessionStorage.setItem(SPLASH_KEY, "true");

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
