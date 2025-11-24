"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
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
  kakaoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const isLoading = status === "loading";
  const isAuthenticated = !!session;
  const kakaoUserId = session?.user?.id || null;
  const kakaoNickname = session?.user?.name || null;

  useEffect(() => {
    if (session?.user) {
      // 세션이 있으면 검증 상태 확인
      setIsVerified(true); // NextAuth 콜백에서 이미 검증됨
    } else {
      setIsVerified(false);
    }
  }, [session]);

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

      const expected = process.env.NEXT_PUBLIC_APP_PASSWORD || "gsrc81";
      const isValid =
        password === expected ||
        (process.env.NODE_ENV === "development" &&
          (password === "gsrc81" || password === "admin123"));

      if (!isValid) {
        setError("비밀번호가 올바르지 않습니다.");
        return false;
      }

      // 세션 기반이므로 별도의 로그인 처리가 필요하지 않음
      return true;
    } catch (err) {
      console.error("Login error:", err);
      setError("로그인 중 오류가 발생했습니다.");
      return false;
    }
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const kakaoLogin = async () => {
    // 로그인 후 NextAuth 콜백에서 처리하도록 함
    const result = await signIn("kakao", { redirect: false });

    if (result?.ok) {
      // 로그인 성공 후 세션 갱신
      window.location.reload();
    }
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
        kakaoLogin,
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
