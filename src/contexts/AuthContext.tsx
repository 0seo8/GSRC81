"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const authCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("gsrc81-auth="));

      if (authCookie) {
        const authData = JSON.parse(
          decodeURIComponent(authCookie.split("=")[1]),
        );
        const isValid = Date.now() - authData.timestamp < 24 * 60 * 60 * 1000;

        if (isValid && authData.authenticated) {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    document.cookie = "gsrc81-auth=; Max-Age=0; path=/";
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        logout,
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
