import Image from "next/image";
import { LOGIN_CONFIG } from "@/lib/config/login-constants";
import { KakaoLoginButton } from "@/components/login/kakao-login-button";
import { AppHeader } from "@/components/layout/app-header";

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

      <div className="flex-1 flex flex-col justify-center items-center px-6 pt-16">
        {/* Brand Image */}
        <div className={LOGIN_CONFIG.SPACING.BRAND_BOTTOM}>
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

        {/* Login Form */}
        <div className="w-full max-w-sm">
          {/* 클라이언트 컴포넌트: 로그인 버튼만 */}
          <KakaoLoginButton />

          {/* Terms */}
          <div className={`px-2 ${LOGIN_CONFIG.SPACING.TERMS_TOP}`}>
            <p
              className={`${LOGIN_CONFIG.COLORS.TEXT_SECONDARY} text-xs text-center leading-relaxed mb-2`}
            >
              카카오톡으로 로그인하면{" "}
              <span
                className={`font-medium ${LOGIN_CONFIG.COLORS.TEXT_PRIMARY}`}
              >
                GSRC81의 회칙
              </span>{" "}
              및{" "}
              <span
                className={`font-medium ${LOGIN_CONFIG.COLORS.TEXT_PRIMARY}`}
              >
                개인정보 처리방침
              </span>
              에 동의하게 됩니다.
            </p>
            <p
              className={`${LOGIN_CONFIG.COLORS.TEXT_SECONDARY} text-xs text-center leading-relaxed`}
            >
              {LOGIN_CONFIG.TEXT.TERMS_EN}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Safe Area */}
      <div className={LOGIN_CONFIG.SPACING.SAFE_AREA}></div>
    </div>
  );
}
