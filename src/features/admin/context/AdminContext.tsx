"use client";

import React, { createContext, useContext, useState } from "react";
import {
  loginAdmin,
  logoutAdmin,
  getAdminSession,
} from "@/app/actions/admin-auth";

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

  const handleAdminLogin = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      // Server Action을 사용하여 로그인 (RLS 우회)
      const result = await loginAdmin(username, password);

      if (!result.success) {
        setError(result.error || "로그인에 실패했습니다.");
        return false;
      }

      setIsAdminAuthenticated(true);
      return true;
    } catch (err) {
      console.error("Admin login error:", err);
      setError(
        err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.",
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    await logoutAdmin();
    setIsAdminAuthenticated(false);
    setError(null);
  };

  // 페이지 로드 시 관리자 인증 상태 확인 (Server Action 사용)
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getAdminSession();
        if (session) {
          setIsAdminAuthenticated(true);
        }
      } catch (err) {
        console.error("Admin auth check error:", err);
      }
    };

    checkSession();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        isAdminAuthenticated,
        isLoading,
        adminLogin: handleAdminLogin,
        adminLogout: handleAdminLogout,
        error,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
