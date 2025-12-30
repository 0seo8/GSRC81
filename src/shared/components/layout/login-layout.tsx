import { ReactNode } from "react";
import { LOGIN_CONFIG } from "@/core/config/login";

interface LoginLayoutProps {
  /**
   * 상단 중앙 영역 (로고 or 애니메이션)
   */
  centerContent: ReactNode;
  /**
   * 하단 고정 영역 (로그인 버튼 + 약관)
   * - 옵션: splash 화면에서는 invisible placeholder 사용
   */
  bottomContent?: ReactNode;
  /**
   * 배경색 클래스 (기본값: LOGIN_CONFIG.COLORS.BACKGROUND)
   */
  background?: string;
  /**
   * 전체 화면 z-index (splash 등에서 사용)
   */
  zIndex?: number;
}

/**
 * 로그인/스플래시 공통 레이아웃
 *
 * @description
 * - 완벽한 중앙 정렬을 위한 flex 기반 레이아웃
 * - 상단: 로고/애니메이션 (flex-1로 수직 중앙)
 * - 하단: 버튼/약관 (고정 높이, thumb zone 최적화)
 * - Splash와 Login이 정확히 동일한 레이아웃 구조 공유
 *
 * @example
 * ```tsx
 * <LoginLayout
 *   centerContent={<BrandLogo />}
 *   bottomContent={<LoginForm />}
 * />
 * ```
 */
export function LoginLayout({
  centerContent,
  bottomContent,
  background = LOGIN_CONFIG.COLORS.BACKGROUND,
  zIndex,
}: LoginLayoutProps) {
  return (
    <div
      className={`min-h-screen ${background} flex flex-col`}
      style={zIndex ? { zIndex } : undefined}
    >
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-6">
        {/* Center Content - 완벽한 수직 중앙 정렬 */}
        <div className="flex-1 grid place-items-center min-h-0 w-full">
          {centerContent}
        </div>

        {/* Bottom Content - 하단 고정 (thumb zone) */}
        {bottomContent && (
          <div className="w-full max-w-sm pb-8 safe-area-bottom">
            {bottomContent}
          </div>
        )}
      </div>
    </div>
  );
}
