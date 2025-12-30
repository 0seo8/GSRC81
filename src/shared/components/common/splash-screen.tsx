"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPLASH_TIMINGS, SPLASH_TEXT_LINES } from "@/shared/constants/splash";
import { BrandLogo } from "@/shared/components/common/brand-logo";

interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * 브랜드 스플래시 스크린
 *
 * @description
 * - 디즈니+/넷플릭스 스타일의 브랜드 인트로 애니메이션
 * - 텍스트 애니메이션 → 로고 전환 → 페이드아웃
 * - LoginLayout과 동일한 구조로 매끄러운 전환 보장
 *
 * 애니메이션 플로우:
 * 1. "RUN" (600ms)
 * 2. "OUR ROUTE," (1200ms)
 * 3. "MAKE" (1800ms)
 * 4. "YOUR STORY." (2400ms)
 * 5. 로고 등장 (3400ms)
 * 6. 페이드아웃 → 로그인 화면 (4200ms)
 */
export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), SPLASH_TIMINGS.TEXT_1),
      setTimeout(() => setCurrentStep(2), SPLASH_TIMINGS.TEXT_2),
      setTimeout(() => setCurrentStep(3), SPLASH_TIMINGS.TEXT_3),
      setTimeout(() => setCurrentStep(4), SPLASH_TIMINGS.TEXT_4),
      setTimeout(() => setShowLogo(true), SPLASH_TIMINGS.LOGO_SHOW),
      setTimeout(() => onComplete(), SPLASH_TIMINGS.COMPLETE),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // 중앙 영역 콘텐츠 (텍스트 애니메이션 or 로고)
  const centerContent = (
    <AnimatePresence mode="wait">
      {!showLogo ? (
        // 텍스트 애니메이션 단계
        <motion.div
          key="text"
          exit={{
            opacity: 0,
            transition: { duration: 0.4, ease: "easeOut" },
          }}
          style={{
            willChange: "opacity",
            backfaceVisibility: "hidden",
            WebkitFontSmoothing: "antialiased",
          }}
        >
          <div className="text-landing-slogan text-black leading-tight flex flex-col gap-[0.6875rem]">
            {SPLASH_TEXT_LINES.map((line, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: index <= currentStep ? 1 : 0,
                }}
                transition={{
                  duration: SPLASH_TIMINGS.ANIMATION_DURATION / 1000,
                  ease: "easeOut",
                }}
                style={{
                  willChange: index === currentStep ? "opacity" : "auto",
                  backfaceVisibility: "hidden" as const,
                }}
              >
                {line}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        // 로고 등장 단계
        <motion.div
          key="logo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
          style={{
            willChange: "opacity",
            backfaceVisibility: "hidden",
            WebkitFontSmoothing: "antialiased",
          }}
        >
          <BrandLogo priority />
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 하단 플레이스홀더 (LoginPage와 동일한 높이 확보)
  const bottomPlaceholder = (
    <div className="invisible" aria-hidden="true">
      {/* 버튼 높이 */}
      <div className="py-3.5">
        <div className="h-5"></div>
      </div>
      {/* Terms 영역 높이 */}
      <div className="px-6 sm:px-8 mt-8 pb-10">
        <p className="text-xs leading-relaxed mb-3">
          카카오톡으로 로그인하면 GSRC81의 회칙 및 개인정보 처리방침에 동의하게
          됩니다.
        </p>
        <p className="text-xs leading-relaxed">
          By logging in with KakaoTalk, you confirm that you agree to GSRC81
          &apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-base flex flex-col overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: SPLASH_TIMINGS.FADE_OUT_DURATION / 1000,
        ease: "easeOut",
      }}
      style={{
        willChange: "opacity",
        backfaceVisibility: "hidden",
      }}
      onAnimationComplete={() => {
        // Exit 애니메이션 완료 후 스크롤 복원
        if (showLogo) {
          document.body.style.overflow = "auto";
        }
      }}
    >
      {/* LoginPage와 완전히 동일한 구조 */}
      <div className="flex-1 flex flex-col items-center px-6">
        {/* Center Content - 완벽한 수직 중앙 정렬 */}
        <div className="flex-1 grid place-items-center min-h-0 w-full">
          {centerContent}
        </div>

        {/* Bottom Placeholder - LoginPage와 동일한 높이 */}
        <div className="w-full max-w-sm pb-8 safe-area-bottom">
          {bottomPlaceholder}
        </div>
      </div>
    </motion.div>
  );
}
