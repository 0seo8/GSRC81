"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FigmaButton } from "@/shared/components/ui/figma-button";
import { LOGIN_CONFIG } from "@/core/config/login";

/**
 * 카카오 로그인 버튼 (클라이언트 컴포넌트)
 * NextAuth signIn 호출을 위해 클라이언트 컴포넌트 필요
 *
 * 성능 최적화:
 * - 이중 리다이렉트 제거: /login → /map 대신 바로 /map으로
 * - 로딩 상태 UI 제공: 사용자 피드백 개선
 */
export function KakaoLoginButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleKakaoLogin = async () => {
    setIsLoading(true);

    try {
      const result = await signIn("kakao", { redirect: false });

      if (result?.ok) {
        // 로그인 성공 → 바로 /map으로 이동 (이중 리다이렉트 방지)
        router.push(LOGIN_CONFIG.ROUTES.MAP);
        router.refresh();
      } else {
        // 로그인 실패 시 로딩 상태 해제
        setIsLoading(false);
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      setIsLoading(false);
    }
  };

  return (
    <FigmaButton
      variant="default"
      size={null}
      onClick={handleKakaoLogin}
      disabled={isLoading}
      className="w-full relative"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            style={{ color: "#000000" }}
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-100"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="font-bold" style={{ color: "#000000" }}>
            로그인 중...
          </span>
        </span>
      ) : (
        LOGIN_CONFIG.TEXT.LOGIN_BUTTON
      )}
    </FigmaButton>
  );
}
