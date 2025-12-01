"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/features/admin/context/AdminContext";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedAdminRoute({
  children,
  redirectTo = "/admin/login",
}: ProtectedAdminRouteProps) {
  const { data: session, status } = useSession();
  const { isAdminAuthenticated } = useAdmin();
  const router = useRouter();

  // NextAuth 세션의 isAdmin 또는 AdminContext의 인증 체크
  const isAdmin = session?.user?.isAdmin || isAdminAuthenticated;
  const isLoading = status === "loading";

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace(redirectTo);
    }
  }, [isAdmin, isLoading, redirectTo, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
