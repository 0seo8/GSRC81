"use client";

import { SessionProvider } from "next-auth/react";
import { AdminProvider } from "@/contexts/AdminContext";
import { SafeAreaProvider } from "@/providers/safe-area-provider";
import { GlobalSplash } from "@/components/global-splash";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <GlobalSplash>
          <AdminProvider>
            {children}
          </AdminProvider>
        </GlobalSplash>
      </SessionProvider>
    </SafeAreaProvider>
  );
}