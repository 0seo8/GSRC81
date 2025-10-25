"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const textSequence = [
    "RUN",
    "RUN OUR ROUTE,",
    "RUN OUR ROUTE, MAKE",
    "RUN OUR ROUTE, MAKE YOUR STORY.",
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), 800),
      setTimeout(() => setCurrentStep(2), 1600),
      setTimeout(() => setCurrentStep(3), 2400),
      setTimeout(() => setIsComplete(true), 3200),
      setTimeout(() => onComplete(), 4500),
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
      <div className="text-center mb-12">
        <motion.h1
          className="text-white text-3xl md:text-4xl font-bold leading-tight"
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {textSequence[currentStep]}
        </motion.h1>
      </div>

      {/* GSRC81 MAPS Logo */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-black font-bold text-2xl">G</span>
            </div>
            <h2 className="text-white text-xl font-semibold">GSRC81 MAPS</h2>
            <p className="text-gray-400 text-sm mt-2">러닝 코스 가이드</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      <AnimatePresence>
        {isComplete && (
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
