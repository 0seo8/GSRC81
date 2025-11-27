"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLoginForm } from "@/features/admin/components/admin-login-form";
import { useAdmin } from "@/features/admin/context/AdminContext";

export default function AdminLoginPage() {
  const { isAdminAuthenticated } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (isAdminAuthenticated) {
      router.replace("/admin");
    }
  }, [isAdminAuthenticated, router]); // router 제거

  if (isAdminAuthenticated) {
    return null; // 리다이렉트 중
  }

  return <AdminLoginForm />;
}
