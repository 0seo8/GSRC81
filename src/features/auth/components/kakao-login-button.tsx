"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FigmaButton } from "@/shared/components/ui/figma-button";
import { LOGIN_CONFIG } from "@/core/config/login";

/**
 * 카카오 로그인 버튼 (클라이언트 컴포넌트)
 * NextAuth signIn 호출을 위해 클라이언트 컴포넌트 필요
 */
export function KakaoLoginButton() {
  const router = useRouter();

  const handleKakaoLogin = async () => {
    const result = await signIn("kakao", { redirect: false });
    if (result?.ok) {
      // 로그인 성공 → 미들웨어가 자동으로 /map 또는 /verify로 리다이렉트
      router.push(LOGIN_CONFIG.ROUTES.LOGIN);
      router.refresh();
    }
  };

  return (
    <FigmaButton
      variant="default"
      size={null}
      onClick={handleKakaoLogin}
      className="w-full"
    >
      {LOGIN_CONFIG.TEXT.LOGIN_BUTTON}
    </FigmaButton>
  );
}
