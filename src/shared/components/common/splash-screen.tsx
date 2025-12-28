"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 pt-16">
        {/* Progressive Text Animation - Enhanced */}
        <AnimatePresence mode="wait">
          {!showLogo && (
            <motion.div
              className="w-full mb-16"
              exit={{
                opacity: 0,
                y: -30,
                transition: { duration: 0.4, ease: "easeOut" },
              }}
              style={{
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <div className="text-landing-slogan text-black leading-tight flex flex-col gap-[0.6875rem]">
                {SPLASH_TEXT_LINES.map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                      opacity: index <= currentStep ? 1 : 0,
                      y: index <= currentStep ? 0 : 30,
                    }}
                    transition={{
                      duration: SPLASH_TIMINGS.ANIMATION_DURATION / 1000,
                      ease: [0.25, 0.1, 0.25, 1],
                      delay: index === currentStep ? 0 : 0,
                    }}
                    className="overflow-hidden"
                    style={{
                      willChange:
                        index === currentStep ? "transform, opacity" : "auto",
                      transform: "translate3d(0, 0, 0)",
                      backfaceVisibility: "hidden" as const,
                    }}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GSRC81 MAPS Logo - Enhanced entrance */}
        <AnimatePresence mode="wait">
          {showLogo && (
            <motion.div
              className="mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
              }}
              style={{
                willChange: "transform, opacity",
                transform: "translate3d(0, 0, 0)", // GPU acceleration
                backfaceVisibility: "hidden",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <div className="text-center">
                <Image
                  src="/logo.png"
                  alt="GSRC81 MAPS Logo"
                  width={296}
                  height={187}
                  className="mx-auto"
                  priority
                  unoptimized
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
