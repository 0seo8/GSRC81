"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  const textLines = [
    "RUN",
    "OUR ROUTE,", 
    "MAKE",
    "YOUR STORY.",
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), 1000),
      setTimeout(() => setCurrentStep(2), 2000),
      setTimeout(() => setCurrentStep(3), 3000),
      setTimeout(() => setIsTextComplete(true), 4200), // 텍스트 완성
      setTimeout(() => setShowLogo(true), 5000),       // 로고 표시
      setTimeout(() => onComplete(), 7000),            // 로그인으로 전환
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Progressive Text Animation */}
      <AnimatePresence>
        {!showLogo && (
          <motion.div 
            className="text-center mb-12 min-h-[200px] flex flex-col justify-center"
            exit={{ 
              opacity: 0, 
              y: -100, 
              transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
            }}
          >
            <div className="text-landing-slogan text-white leading-tight space-y-2">
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

      {/* GSRC81 MAPS Logo */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 1.0, 
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            <div className="mb-6">
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

      {/* Loading indicator */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
