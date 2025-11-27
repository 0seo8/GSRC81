"use client";

import { SessionProvider } from "next-auth/react";
import { AdminProvider } from "@/features/admin/context/AdminContext";
import { SafeAreaProvider } from "@/providers/safe-area-provider";
import { GlobalSplash } from "@/shared/components/common/global-splash";
import { Toaster } from "@/shared/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <GlobalSplash>
          <AdminProvider>
            {children}
            <Toaster />
          </AdminProvider>
        </GlobalSplash>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
