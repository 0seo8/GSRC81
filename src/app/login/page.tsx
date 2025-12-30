"use client";

import Link from "next/link";
import { LOGIN_CONFIG } from "@/core/config/login";
import { KakaoLoginButton } from "@/features/auth/components/kakao-login-button";
import { AppHeader } from "@/shared/components/layout/app-header";
import { BrandLogo } from "@/shared/components/common/brand-logo";

/**
 * 로그인 페이지
 *
 * @description
 * - SplashScreen과 완전히 동일한 레이아웃 구조
 * - Thumb zone 최적화: 하단 고정 버튼
 * - GlobalSplash가 앱 레벨에서 스플래시 처리
 * - 미들웨어가 인증 상태 체크 및 리다이렉트 처리
 */
export default function LoginPage() {
  // 중앙 영역: 브랜드 로고
  const centerContent = <BrandLogo priority />;

  // 하단 영역: 로그인 버튼 + 약관
  const bottomContent = (
    <>
      {/* 로그인 버튼 */}
      <KakaoLoginButton />

      {/* Terms - 충분한 패딩과 여백으로 가독성 향상 */}
      <div className={`px-6 sm:px-8 ${LOGIN_CONFIG.SPACING.TERMS_TOP} pb-10`}>
        <p
          className={`${LOGIN_CONFIG.COLORS.TEXT_SECONDARY} text-xs text-left leading-relaxed mb-3`}
        >
          카카오톡으로 로그인하면{" "}
          <Link
            href="/terms"
            className={`font-medium ${LOGIN_CONFIG.COLORS.TEXT_PRIMARY} underline ${LOGIN_CONFIG.COLORS.LINK_HOVER} transition-colors`}
          >
            GSRC81의 회칙
          </Link>{" "}
          및{" "}
          <Link
            href="/privacy"
            className={`font-medium ${LOGIN_CONFIG.COLORS.TEXT_PRIMARY} underline ${LOGIN_CONFIG.COLORS.LINK_HOVER} transition-colors`}
          >
            개인정보 처리방침
          </Link>
          에 동의하게 됩니다.
        </p>
        <p
          className={`${LOGIN_CONFIG.COLORS.TEXT_SECONDARY} text-xs text-left leading-relaxed`}
        >
          {LOGIN_CONFIG.TEXT.TERMS_EN}
        </p>
      </div>
    </>
  );

  return (
    <div
      className={`min-h-screen ${LOGIN_CONFIG.COLORS.BACKGROUND} flex flex-col`}
    >
      {/* 공통 헤더 */}
      <AppHeader background="gray" />

      {/* Main Content - SplashScreen과 완전히 동일한 구조 */}
      <div className="flex-1 flex flex-col items-center px-6">
        {/* Center Content - 완벽한 수직 중앙 정렬 */}
        <div className="flex-1 grid place-items-center min-h-0 w-full">
          {centerContent}
        </div>

        {/* Bottom Content - 하단 고정 (thumb zone 최적화) */}
        <div className="w-full max-w-sm pb-8 safe-area-bottom">
          {bottomContent}
        </div>
      </div>
    </div>
  );
}
