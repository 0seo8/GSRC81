"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { SplashScreen } from "@/components/splash-screen";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { FigmaButton } from "@/components/ui/figma-button";

const CONSTANTS = {
  LOGO: {
    WIDTH: 296,
    HEIGHT: 187,
    SRC: "/logo.png",
    ALT: "GSRC81 MAPS - RUN OUR ROUTE, MAKE YOUR STORY"
  },
  SPACING: {
    LOGO_BOTTOM: "mb-12",
    BRAND_BOTTOM: "mb-16", 
    TERMS_TOP: "mt-6",
    SAFE_AREA: "h-8"
  },
  COLORS: {
    BACKGROUND: "bg-gray-100",
    TEXT_SECONDARY: "text-gray-500",
    TEXT_PRIMARY: "text-black"
  },
  TEXT: {
    TITLE: "GSRC81 MAPS",
    LOGIN_BUTTON: "카카오톡 계정으로 계속하기",
    TERMS_KO: "카카오톡으로 로그인하면 GSRC81의 회칙 및 개인정보 처리방침에 동의하게 됩니다.",
    TERMS_EN: "By logging in with KakaoTalk, you confirm that you agree to GSRC81's Terms of Service and Privacy Policy.",
    LOADING: "Loading..."
  },
  ROUTES: {
    MAP: "/map"
  }
};

export default function LoginPage() {
  const { completeOnboarding } = useOnboarding();
  const { isAuthenticated, isLoading: authLoading, kakaoLogin, checkVerificationStatus, kakaoUserId } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const handleKakaoLogin = () => {
    kakaoLogin();
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
    completeOnboarding();
  };

  // 로그인 성공시 인증 상태 확인 후 적절한 페이지로 리다이렉트
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!authLoading && isAuthenticated && !showSplash && kakaoUserId) {
        const isVerified = await checkVerificationStatus();

        if (isVerified) {
          window.location.href = CONSTANTS.ROUTES.MAP;
        } else {
          window.location.href = `/verify?uid=${kakaoUserId}`;
        }
      }
    };

    checkAndRedirect();
  }, [authLoading, isAuthenticated, showSplash, kakaoUserId, checkVerificationStatus]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">{CONSTANTS.TEXT.LOADING}</div>
      </div>
    );
  }

  // 인증되었고 스플래시도 끝났으면 리다이렉트
  if (isAuthenticated && !showSplash) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Redirecting...</div>
      </div>
    );
  }

  // 항상 스플래시를 먼저 표시 (매번 인트로 애니메이션)
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className={`min-h-screen ${CONSTANTS.COLORS.BACKGROUND} flex flex-col`}>
      <div className="flex-1 flex flex-col justify-center items-center px-6">
        <div className={CONSTANTS.SPACING.LOGO_BOTTOM}>
          <h1 className={`${CONSTANTS.COLORS.TEXT_PRIMARY} text-lg font-semibold tracking-wide text-center`}>
            {CONSTANTS.TEXT.TITLE}
          </h1>
        </div>

        <div className={CONSTANTS.SPACING.BRAND_BOTTOM}>
          <div className="text-center">
            <Image
              src={CONSTANTS.LOGO.SRC}
              alt={CONSTANTS.LOGO.ALT}
              width={CONSTANTS.LOGO.WIDTH}
              height={CONSTANTS.LOGO.HEIGHT}
              className="mx-auto"
              priority
            />
          </div>
        </div>

        <div className="w-full max-w-sm">
          <FigmaButton variant="default" onClick={handleKakaoLogin}>
            {CONSTANTS.TEXT.LOGIN_BUTTON}
          </FigmaButton>

          <div className={`px-2 ${CONSTANTS.SPACING.TERMS_TOP}`}>
            <p className={`${CONSTANTS.COLORS.TEXT_SECONDARY} text-xs text-center leading-relaxed mb-2`}>
              카카오톡으로 로그인하면{" "}
              <span className={`font-medium ${CONSTANTS.COLORS.TEXT_PRIMARY}`}>GSRC81의 회칙</span> 및{" "}
              <span className={`font-medium ${CONSTANTS.COLORS.TEXT_PRIMARY}`}>개인정보 처리방침</span>
              에 동의하게 됩니다.
            </p>
            <p className={`${CONSTANTS.COLORS.TEXT_SECONDARY} text-xs text-center leading-relaxed`}>
              {CONSTANTS.TEXT.TERMS_EN}
            </p>
          </div>
        </div>
      </div>

      <div className={CONSTANTS.SPACING.SAFE_AREA}></div>
    </div>
  );
}
