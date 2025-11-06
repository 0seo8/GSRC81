"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const kakaoUserId = params.get("uid");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 페이지 진입 시 자동으로 인증 상태 체크
  useEffect(() => {
    const checkExistingUser = async () => {
      if (!kakaoUserId) return;
      
      const { data: existingUser } = await supabase
        .from("access_links")
        .select("*")
        .eq("kakao_user_id", kakaoUserId)
        .single();

      if (existingUser) {
        const authData = {
          authenticated: true,
          timestamp: Date.now(),
          type: "kakao",
          kakaoUserId: kakaoUserId,
        };

        document.cookie = `gsrc81-auth=${JSON.stringify(authData)}; Max-Age=86400; path=/; SameSite=Lax`;
        
        setTimeout(() => {
          router.push("/map");
        }, 100);
      }
    };

    checkExistingUser();
  }, [kakaoUserId, router]);

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    // 1️⃣ 먼저 이미 인증된 사용자인지 확인  
    const { data: existingUser } = await supabase
      .from("access_links")
      .select("*")
      .eq("kakao_user_id", kakaoUserId)
      .single();

    if (existingUser) {
      // 이미 인증 완료된 사용자 - 쿠키 설정 후 리다이렉트
      const authData = {
        authenticated: true,
        timestamp: Date.now(),
        type: "kakao",
        kakaoUserId: kakaoUserId,
      };

      document.cookie = `gsrc81-auth=${JSON.stringify(authData)}; Max-Age=86400; path=/; SameSite=Lax`;
      
      setTimeout(() => {
        router.push("/map");
      }, 100);
      return;
    }

    // 2️⃣ 접근 코드 유효성 확인
    const { data, error } = await supabase
      .from("access_links")
      .select("*")
      .eq("access_code", code)
      .single();

    if (error || !data) {
      setError("❌ 유효하지 않은 접근 코드입니다.");
      setLoading(false);
      return;
    }

    // 새로운 레코드 생성 (기존 레코드 업데이트가 아니라)
    const { error: insertError } = await supabase
      .from("access_links")
      .insert({
        access_code: code,
        kakao_user_id: kakaoUserId,
        kakao_nickname: null,
        is_active: true,
      })
      .select();

    if (insertError) {
      setError("❌ 인증 처리 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    // 카카오 로그인 성공 상태를 쿠키에 저장
    const authData = {
      authenticated: true,
      timestamp: Date.now(),
      type: "kakao",
      kakaoUserId: kakaoUserId,
    };

    // 쿠키에 저장 (24시간)
    const expires = new Date();
    expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000); // 24시간
    document.cookie = `gsrc81-auth=${JSON.stringify(authData)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

    // 로컬스토리지에도 저장 (클라이언트 사이드 체크용)
    localStorage.setItem("gsrc81-auth", JSON.stringify(authData));

    router.push("/map");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6">
        {/* Logo */}
        <div className="mb-12">
          <h1 className="text-black text-lg font-semibold tracking-wide text-center">
            GSRC81 MAPS
          </h1>
        </div>

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
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-black text-lg font-semibold tracking-wide mb-4">
              GSRC81 MAPS
            </h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
