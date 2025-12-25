"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showLogo, setShowLogo] = useState(false);

  const textLines = ["RUN", "OUR ROUTE,", "MAKE", "YOUR STORY."];

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), 600), // RUN
      setTimeout(() => setCurrentStep(2), 1200), // OUR ROUTE,
      setTimeout(() => setCurrentStep(3), 1800), // MAKE
      setTimeout(() => setCurrentStep(4), 2400), // YOUR STORY.
      setTimeout(() => setShowLogo(true), 3400), // 로고 표시 (텍스트 exit 후)
      setTimeout(() => onComplete(), 4200), // 로그인으로 전환 (exit 애니메이션 고려)
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-base flex flex-col overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
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
                {textLines.map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                      opacity: index <= currentStep ? 1 : 0,
                      y: index <= currentStep ? 0 : 30,
                    }}
                    transition={{
                      duration: 0.8,
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
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
