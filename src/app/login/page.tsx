"use client";

import React from "react";
import { SplashScreen } from "@/components/splash-screen";
import { useOnboarding } from "@/hooks/use-onboarding";

export default function LoginPage() {
  const { isOnboardingComplete, isLoading, completeOnboarding } =
    useOnboarding();
  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show splash screen for first-time users
  if (!isOnboardingComplete) {
    return <SplashScreen onComplete={completeOnboarding} />;
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

        {/* Brand Message */}
        <div className="mb-16">
          <div className="text-center">
            <h2 className="text-black text-4xl sm:text-5xl font-black leading-tight mb-6">
              <div>RUN</div>
              <div>OUR ROUTE,</div>
              <div>MAKE</div>
              <div>YOUR STORY.</div>
            </h2>
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
