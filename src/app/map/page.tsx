'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { STORAGE_KEYS } from '@/lib/constants';

export default function MapPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (authToken !== 'authenticated') {
      router.push('/');
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="relative">
        {/* 임시 지도 영역 */}
        <div className="h-[calc(100vh-4rem)] bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              GSRC81 러닝 코스 지도
            </h1>
            <p className="text-gray-600">
              Mapbox 지도 컴포넌트가 여기에 표시됩니다
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}