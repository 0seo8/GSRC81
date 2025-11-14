"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  isAuthenticated: boolean;
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  kakaoUserId: string | null;
  kakaoNickname: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  checkVerificationStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kakaoUserId, setKakaoUserId] = useState<string | null>(null);
  const [kakaoNickname, setKakaoNickname] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const authCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("gsrc81-auth="));

      if (authCookie) {
        const authData = JSON.parse(
          decodeURIComponent(authCookie.split("=")[1])
        );
        const isValid = Date.now() - authData.timestamp < 24 * 60 * 60 * 1000;

        if (isValid && authData.authenticated) {
          setIsAuthenticated(true);

          // 카카오 사용자 정보 설정 (콜백에서 이미 검증 완료)
          if (authData.kakaoUserId) {
            setKakaoUserId(authData.kakaoUserId);
            setKakaoNickname(authData.kakaoNickname || null);
            setIsVerified(true); // 콜백에서 이미 검증된 사용자만 여기 도달
          }
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const checkVerificationStatusForUser = async (
    userId: string
  ): Promise<boolean> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await supabase
        .from("access_links")
        .select("*")
        .eq("kakao_user_id", userId);

      return !result.error && result.data && result.data.length > 0;
    } catch (error) {
      console.error("Verification check error:", error);
      return false;
    }
  };

  const checkVerificationStatus = async (): Promise<boolean> => {
    if (!kakaoUserId) return false;
    return checkVerificationStatusForUser(kakaoUserId);
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      const expected = process.env.NEXT_PUBLIC_APP_PASSWORD || "gsrc81";
      const isValid =
        password === expected ||
        (process.env.NODE_ENV === "development" &&
          (password === "gsrc81" || password === "admin123"));

      if (!isValid) {
        setError("비밀번호가 올바르지 않습니다.");
        return false;
      }

      const authData = {
        authenticated: true,
        timestamp: Date.now(),
      };

      document.cookie = `gsrc81-auth=${encodeURIComponent(JSON.stringify(authData))}; Max-Age=86400; path=/`;
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      setError("로그인 중 오류가 발생했습니다.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    document.cookie = "gsrc81-auth=; Max-Age=0; path=/";
    setIsAuthenticated(false);
    setIsVerified(false);
    setKakaoUserId(null);
    setKakaoNickname(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isVerified,
        isLoading,
        error,
        kakaoUserId,
        kakaoNickname,
        login,
        logout,
        checkVerificationStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
