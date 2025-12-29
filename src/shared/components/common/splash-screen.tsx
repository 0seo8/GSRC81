"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPLASH_TIMINGS, SPLASH_TEXT_LINES } from "@/shared/constants/splash";

interface SplashScreenProps {
  onComplete: () => void;
}

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
        // Exit 애니메이션 완료 후에만 페이지 전환
        if (showLogo) {
          document.body.style.overflow = "auto";
        }
      }}
    >
      {/* Login 페이지와 완전히 동일한 구조 */}
      <div className="flex-1 flex flex-col items-center px-6">
        {/* Logo Section - Login과 정확히 동일 */}
        <div className="flex-1 flex items-center justify-center min-h-0 pt-8">
          <AnimatePresence mode="wait">
            {!showLogo ? (
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
                className="text-center"
              >
                <img
                  src="/logo.png"
                  alt="GSRC81 MAPS Logo"
                  width={296}
                  height={187}
                  className="mx-auto"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Login Form 영역 - Login과 정확히 동일 */}
        <div className="w-full max-w-sm pb-8 safe-area-bottom invisible">
          {/* 버튼 높이 */}
          <div className="py-3.5">
            <div className="h-5"></div>
          </div>
          {/* Terms 영역 높이 */}
          <div className="px-6 sm:px-8 mt-8 pb-10">
            <p className="text-xs leading-relaxed mb-3">
              카카오톡으로 로그인하면 GSRC81의 회칙 및 개인정보 처리방침에
              동의하게 됩니다.
            </p>
            <p className="text-xs leading-relaxed">
              By logging in with KakaoTalk, you confirm that you agree to GSRC81
              &apos; s Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
