"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const savedAuth = localStorage.getItem('gsrc81-auth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        // 세션이 24시간 이내인지 확인
        const isValid = Date.now() - authData.timestamp < 24 * 60 * 60 * 1000;
        if (isValid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('gsrc81-auth');
        }
      }
    } catch (err) {
      console.error('Auth check error:', err);
      localStorage.removeItem('gsrc81-auth');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      // Supabase에서 access_links 테이블 확인 및 비밀번호 검증
      const { data, error } = await supabase
        .from('access_links')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Access link check error:', error);
        setError('접근 권한을 확인할 수 없습니다.');
        return false;
      }

      if (!data || data.length === 0) {
        setError('유효한 접근 링크가 없습니다.');
        return false;
      }

      // 비밀번호 검증 (해시된 값과 평문 모두 지원)
      const storedHash = data[0].password_hash;
      let isValidPassword = false;
      
      // bcrypt 해시인지 확인
      if (storedHash.startsWith('$2b$')) {
        isValidPassword = await bcrypt.compare(password, storedHash);
      } else {
        // 평문 비교
        isValidPassword = password === storedHash;
      }
      
      if (!isValidPassword) {
        setError('비밀번호가 올바르지 않습니다.');
        return false;
      }

      // 인증 성공
      const authData = {
        authenticated: true,
        timestamp: Date.now()
      };
      
      localStorage.setItem('gsrc81-auth', JSON.stringify(authData));
      setIsAuthenticated(true);
      return true;

    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('gsrc81-auth');
    setIsAuthenticated(false);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      login,
      logout,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}