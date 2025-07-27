'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { ANIMATION_CONFIG, STORAGE_KEYS } from '@/lib/constants';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 스플래시 화면이 이미 표시되었는지 확인
    const hasShownSplash = localStorage.getItem(STORAGE_KEYS.SPLASH_SHOWN);
    
    if (hasShownSplash) {
      // 이미 표시했다면 즉시 완료
      onComplete();
      setIsVisible(false);
      return;
    }

    // 첫 방문이면 애니메이션 실행
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.SPLASH_SHOWN, 'true');
      setIsVisible(false);
      setTimeout(onComplete, ANIMATION_CONFIG.FADE_DURATION);
    }, ANIMATION_CONFIG.SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 flex items-center justify-center z-50"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: ANIMATION_CONFIG.FADE_DURATION / 1000 }}
        >
          <div className="text-center">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1
              }}
              className="mb-8"
            >
              <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
                <MapPin className="w-12 h-12 text-orange-500" />
              </div>
            </motion.div>

            {/* Title Animation */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              GSRC81
            </motion.h1>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-xl md:text-2xl text-white/90 mb-8"
            >
              러너 매퍼
            </motion.h2>

            {/* Subtitle Animation */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="text-white/80 text-lg"
            >
              은평구 러닝 코스 지도
            </motion.p>

            {/* Loading Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-12"
            >
              <div className="flex space-x-1 justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}