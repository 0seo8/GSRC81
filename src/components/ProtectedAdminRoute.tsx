"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedAdminRoute({ children, redirectTo = '/admin/login' }: ProtectedAdminRouteProps) {
  const { isAdminAuthenticated } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isAdminAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAdminAuthenticated, router, redirectTo]);

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}