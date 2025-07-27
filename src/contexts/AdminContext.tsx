"use client";

import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  error: string | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      // admin 테이블에서 사용자 확인
      const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('username', username)
        .limit(1);

      if (error) {
        throw new Error(`관리자 조회 실패: ${error.message}`);
      }

      if (!data || data.length === 0) {
        setError('존재하지 않는 관리자입니다.');
        return false;
      }

      const admin = data[0];
      
      // 개발용 평문 비밀번호 비교
      if (admin.password_hash !== password) {
        setError('비밀번호가 올바르지 않습니다.');
        return false;
      }

      // 관리자 인증 성공
      const adminAuth = {
        authenticated: true,
        username: admin.username,
        timestamp: Date.now()
      };
      
      localStorage.setItem('gsrc81-admin-auth', JSON.stringify(adminAuth));
      setIsAdminAuthenticated(true);
      return true;

    } catch (err) {
      console.error('Admin login error:', err);
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('gsrc81-admin-auth');
    setIsAdminAuthenticated(false);
    setError(null);
  };

  // 페이지 로드 시 관리자 인증 상태 확인
  React.useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('gsrc81-admin-auth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        // 세션이 24시간 이내인지 확인
        const isValid = Date.now() - authData.timestamp < 24 * 60 * 60 * 1000;
        if (isValid) {
          setIsAdminAuthenticated(true);
        } else {
          localStorage.removeItem('gsrc81-admin-auth');
        }
      }
    } catch (err) {
      console.error('Admin auth check error:', err);
      localStorage.removeItem('gsrc81-admin-auth');
    }
  }, []);

  return (
    <AdminContext.Provider value={{
      isAdminAuthenticated,
      isLoading,
      adminLogin,
      adminLogout,
      error
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}