import Image from "next/image";
import Link from "next/link";
import { LOGIN_CONFIG } from "@/core/config/login";
import { KakaoLoginButton } from "@/features/auth/components/kakao-login-button";
import { AppHeader } from "@/shared/components/layout/app-header";

/**
 * 로그인 페이지 (서버 컴포넌트)
 * - 정적 UI 렌더링
 * - 미들웨어가 인증 상태 체크 및 리다이렉트 처리
 * - 클라이언트 로직은 KakaoLoginButton에만 집중
 */
export default function LoginPage() {
  return (
    <div
      className={`min-h-screen ${LOGIN_CONFIG.COLORS.BACKGROUND} flex flex-col`}
    >
      {/* 공통 헤더 */}
      <AppHeader background="gray" />

      {/* Main Content - 로고 상단 1/3, 버튼 하단 고정 레이아웃 */}
      <div className="flex-1 flex flex-col items-center px-6">
        {/* Logo Section - 상단 영역, flex-1로 남은 공간 차지 */}
        <div className="flex-1 flex items-center justify-center min-h-0 pt-8">
          <div className="text-center">
            <Image
              src={LOGIN_CONFIG.LOGO.SRC}
              alt={LOGIN_CONFIG.LOGO.ALT}
              width={LOGIN_CONFIG.LOGO.WIDTH}
              height={LOGIN_CONFIG.LOGO.HEIGHT}
              className="mx-auto"
              priority
            />
          </div>
        </div>

        {/* Login Form - 하단 고정 (thumb zone 최적화) */}
        <div className="w-full max-w-sm pb-12">
          {/* 클라이언트 컴포넌트: 로그인 버튼만 */}
          <KakaoLoginButton />

          {/* Terms - 좌측 정렬로 가독성 향상 */}
          <div className={`px-2 ${LOGIN_CONFIG.SPACING.TERMS_TOP}`}>
            <p
              className={`${LOGIN_CONFIG.COLORS.TEXT_SECONDARY} text-xs text-left leading-relaxed mb-2`}
            >
              카카오톡으로 로그인하면{" "}
              <Link
                href="/terms"
                className={`font-medium ${LOGIN_CONFIG.COLORS.TEXT_PRIMARY} underline hover:text-gray-700 transition-colors`}
              >
                GSRC81의 회칙
              </Link>{" "}
              및{" "}
              <Link
                href="/privacy"
                className={`font-medium ${LOGIN_CONFIG.COLORS.TEXT_PRIMARY} underline hover:text-gray-700 transition-colors`}
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
        </div>
      </div>
    </div>
  );
}
