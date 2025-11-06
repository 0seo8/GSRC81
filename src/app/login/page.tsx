"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SplashScreen } from "@/components/splash-screen";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { isOnboardingComplete, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();
  const { isAuthenticated, isVerified, isLoading: authLoading, kakaoUserId } = useAuth();
  
  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  const handleSplashComplete = () => {
    completeOnboarding();
    // 스플래시 완료 후 인증 상태에 따른 라우팅
    if (isAuthenticated && kakaoUserId) {
      if (isVerified) {
        router.push("/map");
      } else {
        router.push(`/verify?uid=${kakaoUserId}`);
      }
    }
    // 로그인 안된 경우는 현재 페이지(로그인)에 그대로 있음
  };

  // 인증 상태 체크 후 자동 라우팅 (onboarding 완료된 경우)
  useEffect(() => {
    if (isOnboardingComplete && !authLoading) {
      if (isAuthenticated && kakaoUserId) {
        if (isVerified) {
          router.push("/map");
        } else {
          router.push(`/verify?uid=${kakaoUserId}`);
        }
      }
    }
  }, [isOnboardingComplete, authLoading, isAuthenticated, isVerified, kakaoUserId, router]);

  // Show loading state while checking onboarding status
  if (onboardingLoading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show splash screen for first-time users
  if (!isOnboardingComplete) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6">
        {/* Logo */}
        <div className="mb-12">
          <h1 className="text-black text-lg font-semibold tracking-wide text-center">
            GSRC81 MAPS
          </h1>
        </div>

        {/* Brand Logo */}
        <div className="mb-16">
          <div className="text-center">
            <Image
              src="/logo.png"
              alt="GSRC81 MAPS - RUN OUR ROUTE, MAKE YOUR STORY"
              width={296}
              height={187}
              className="mx-auto"
              priority
            />
          </div>
        </div>

        {/* Kakao Login Section */}
        <div className="w-full max-w-sm">
          {/* Kakao Login Button */}
          <button
            onClick={handleKakaoLogin}
            className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-black font-semibold py-4 px-6 rounded-xl shadow-sm transition-colors duration-200 mb-4"
          >
            카카오톡 계정으로 계속하기
          </button>

          {/* Terms Agreement */}
          <div className="px-2">
            <p className="text-gray-600 text-sm text-center leading-relaxed mb-2">
              카카오톡으로 로그인하면{" "}
              <span className="font-medium">GSRC81의 회칙</span> 및{" "}
              <span className="font-medium">개인정보 처리방침</span>에 동의하게
              됩니다.
            </p>
            <p className="text-gray-500 text-xs text-center leading-relaxed">
              By logging in with KakaoTalk, you confirm that you agree to
              GSRC81&apos;s Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Safe Area */}
      <div className="h-8"></div>
    </div>
  );
}
