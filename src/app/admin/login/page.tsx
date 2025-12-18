"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { KakaoLoginButton } from "@/features/auth/components/kakao-login-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 이미 로그인되어 있고 관리자인 경우
    if (session?.user?.isAdmin) {
      router.replace("/admin");
    }
    // 로그인은 되어 있지만 관리자가 아닌 경우
    else if (session?.user && !session.user.isAdmin) {
      router.replace("/map?error=unauthorized");
    }
  }, [session, router]);

  // 로딩 중
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 이미 인증된 경우 null 반환 (리다이렉트 중)
  if (session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">관리자 로그인</CardTitle>
          <CardDescription>
            관리자 권한이 있는 카카오 계정으로 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <KakaoLoginButton />
          <p className="text-sm text-gray-500 text-center">
            관리자 권한이 없는 경우 접근이 제한됩니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
