"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import {
  verifyAccessCode,
  isUserVerified,
} from "@/shared/lib/auth/verification";
import { AppHeader } from "@/shared/components/layout/app-header";

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const kakaoUserId = params.get("uid");

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // 페이지 진입 시 자동으로 인증 상태 체크
  // 이미 검증된 사용자라면 /map으로 리다이렉트 (미들웨어가 처리하지 못한 경우)
  useEffect(() => {
    const checkExistingUser = async () => {
      if (!kakaoUserId) {
        setChecking(false);
        return;
      }

      const verified = await isUserVerified(kakaoUserId);

      if (verified) {
        // 이미 검증됨 → NextAuth 세션 갱신 후 /map으로
        await updateSession();
        router.push("/map");
        router.refresh();
        return;
      }

      setChecking(false);
    };

    checkExistingUser();
  }, [kakaoUserId, router, updateSession]);

  const handleVerify = async () => {
    if (!kakaoUserId) {
      setError("잘못된 접근입니다. 다시 로그인해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    // 접근 코드 검증 및 사용자 연결
    const result = await verifyAccessCode(code, kakaoUserId);

    if (!result.success) {
      setError(`❌ ${result.error}`);
      setLoading(false);
      return;
    }

    // 검증 성공 → NextAuth 세션 갱신 후 /map으로
    await updateSession();
    router.push("/map");
    router.refresh();
  };

  // 검증 상태 확인 중
  if (checking) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        <AppHeader background="gray" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
            <p className="text-gray-500 text-sm mt-4">인증 상태 확인 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* 공통 헤더 */}
      <AppHeader background="gray" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 pt-16">
        {/* Verification Form */}
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-black text-2xl font-bold mb-4">
              접근 코드 인증
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-2">
              관리자에게 발급받은 코드를 입력하세요.
            </p>
            <p className="text-gray-500 text-xs leading-relaxed">
              최초 1회 인증만 필요합니다.
            </p>
          </div>

          {/* Access Code Input */}
          <div className="mb-6">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-4 text-center text-lg font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="접근 코드를 입력하세요"
              maxLength={20}
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              lang="en"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleVerify}
            disabled={loading || !code.trim()}
            className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200"
          >
            {loading ? "확인 중..." : "인증하기"}
          </button>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs leading-relaxed">
              코드를 받지 못하셨나요?
              <br />
              관리자에게 문의해 주세요.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Safe Area */}
      <div className="h-8"></div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <AppHeader background="gray" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
            </div>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
