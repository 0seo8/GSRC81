"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { SafeAreaProvider } from "@/providers/safe-area-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <AuthProvider>
          <AdminProvider>
            {children}
          </AdminProvider>
        </AuthProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}