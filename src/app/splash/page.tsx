"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin } from 'lucide-react';

export default function SplashPage() {
  const [showLogo, setShowLogo] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 인증 체크
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
      return;
    }

    // 스플래시 애니메이션 - 첫 방문 시에만 표시
    const hasSeenSplash = localStorage.getItem('gsrc81-splash-seen');
    
    if (hasSeenSplash) {
      // 이미 본 경우 바로 메인으로
      router.replace('/map');
      return;
    }

    // 3초 후 메인 페이지로 이동
    const timer = setTimeout(() => {
      localStorage.setItem('gsrc81-splash-seen', 'true');
      setShowLogo(false);
      
      // 페이드아웃 후 이동
      setTimeout(() => {
        router.replace('/map');
      }, 800);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-orange-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: showLogo ? 1 : 0, 
          scale: showLogo ? 1 : 1.2,
          y: showLogo ? 0 : -50
        }}
        transition={{ 
          duration: showLogo ? 0.8 : 0.8,
          ease: showLogo ? "easeOut" : "easeIn"
        }}
        className="text-center"
      >
        {/* 로고 아이콘 */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: 0.2,
            duration: 1,
            type: "spring",
            stiffness: 200,
            damping: 15
          }}
          className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl"
        >
          <MapPin className="w-12 h-12 text-orange-500" />
        </motion.div>

        {/* 앱 이름 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            GSRC81
          </h1>
          <h2 className="text-xl text-white/90 font-medium">
            구파발 러너 매퍼
          </h2>
        </motion.div>

        {/* 서브텍스트 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="text-white/80 mt-4 text-sm"
        >
          은평구 러닝 코스를 찾아보세요
        </motion.p>

        {/* 로딩 인디케이터 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.3 }}
          className="flex justify-center mt-8"
        >
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
                className="w-2 h-2 bg-white rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 배경 원형 그라데이션 */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-white rounded-full"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.05 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-yellow-300 rounded-full"
        />
      </div>
    </div>
  );
}