'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { LoginForm } from '@/components/auth/LoginForm';
import { STORAGE_KEYS } from '@/lib/constants';

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 인증 상태 확인
    const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (authToken === 'authenticated') {
      setIsAuthenticated(true);
      // 이미 인증된 사용자는 바로 지도로 이동
      router.push('/map');
    }
    setIsLoading(false);
  }, [router]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (showSplash && !isAuthenticated) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // 인증된 사용자는 이미 /map으로 리다이렉트됨
  return null;
}
