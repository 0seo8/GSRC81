"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface RippleEffectProps {
  x: number;
  y: number;
  isVisible: boolean;
  onComplete?: () => void;
}

export function RippleEffect({ x, y, isVisible, onComplete }: RippleEffectProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 600); // 애니메이션 완료 시간
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed pointer-events-none z-50"
          style={{
            left: x - 50,
            top: y - 50,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          exit={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* 외부 링 */}
          <div className="w-24 h-24 rounded-full border-4 border-blue-400 opacity-60" />
          
          {/* 내부 링 */}
          <motion.div
            className="absolute top-2 left-2 w-20 h-20 rounded-full border-2 border-blue-300"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          
          {/* 중심점 */}
          <motion.div
            className="absolute top-4 left-4 w-16 h-16 rounded-full bg-blue-400 opacity-40"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}