"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 인증 상태 확인
    const checkAuth = () => {
      try {
        const authCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('gsrc81-auth='));
        
        if (authCookie) {
          const authData = JSON.parse(decodeURIComponent(authCookie.split('=')[1]));
          const isValid = Date.now() - authData.timestamp < 24 * 60 * 60 * 1000; // 24시간
          
          if (isValid && authData.authenticated) {
            // 로그인된 상태면 지도 페이지로
            router.replace('/map');
            return;
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
      
      // 로그인이 안된 상태면 로그인 페이지로
      router.replace('/login');
    };

    checkAuth();
  }, [router]);

  // 로딩 화면
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col justify-center items-center">
      <div className="mb-4">
        <h1 className="text-black text-xl font-semibold tracking-wide text-center">
          GSRC81 MAPS
        </h1>
      </div>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
    </div>
  );
}
