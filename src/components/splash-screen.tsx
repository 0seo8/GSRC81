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

  const textLines = [
    "RUN",
    "OUR ROUTE,", 
    "MAKE",
    "YOUR STORY.",
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), 600),       // RUN
      setTimeout(() => setCurrentStep(2), 1200),      // OUR ROUTE,
      setTimeout(() => setCurrentStep(3), 1800),      // MAKE
      setTimeout(() => setCurrentStep(4), 2400),      // YOUR STORY.
      setTimeout(() => setShowLogo(true), 3200),      // 로고 표시
      setTimeout(() => onComplete(), 4500),           // 로그인으로 전환
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[#F5F5F5] flex flex-col"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Content - 로그인 페이지와 동일한 레이아웃 */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 pt-16">
        {/* Progressive Text Animation */}
        <AnimatePresence>
          {!showLogo && (
            <motion.div
              className="text-center"
              exit={{
                opacity: 0,
                y: -100,
                transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
              }}
            >
              <div className="text-landing-slogan text-black leading-tight space-y-2">
                {textLines.map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                      opacity: index <= currentStep ? 1 : 0,
                      y: index <= currentStep ? 0 : 30
                    }}
                    transition={{
                      duration: 0.8,
                      ease: [0.25, 0.1, 0.25, 1],
                      delay: index === currentStep ? 0 : 0
                    }}
                    className="overflow-hidden"
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GSRC81 MAPS Logo - 로그인 페이지와 동일한 위치 */}
        <AnimatePresence>
          {showLogo && (
            <motion.div
              className="mb-16"
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1]
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

      {/* Bottom Safe Area - 로그인 페이지와 동일 */}
      <div className="h-8"></div>
    </motion.div>
  );
}
