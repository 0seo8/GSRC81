import Image from "next/image";
import { LOGIN_CONFIG } from "@/core/config/login";

interface BrandLogoProps {
  /**
   * 로고 크기 변형
   * - default: 기본 로그인 크기 (296x187)
   * - sm: 작은 크기 (헤더용 등)
   */
  size?: "default" | "sm";
  /**
   * 추가 className (옵션)
   */
  className?: string;
  /**
   * 로딩 우선순위
   */
  priority?: boolean;
}

/**
 * GSRC81 브랜드 로고 컴포넌트
 *
 * @description
 * - 앱 전체에서 일관된 로고 표시를 위한 공통 컴포넌트
 * - Splash, Login, Admin 등에서 재사용
 * - LOGIN_CONFIG를 단일 진실 공급원(Single Source of Truth)으로 사용
 * - Next.js Image 컴포넌트로 자동 최적화 (WebP, lazy loading 등)
 *
 * @example
 * ```tsx
 * <BrandLogo /> // 기본 크기
 * <BrandLogo size="sm" /> // 작은 크기
 * <BrandLogo priority /> // 즉시 로드 (LCP 최적화)
 * ```
 */
export function BrandLogo({
  size = "default",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const dimensions =
    size === "sm"
      ? { width: 148, height: 94 } // 50% 크기
      : {
          width: LOGIN_CONFIG.LOGO.WIDTH,
          height: LOGIN_CONFIG.LOGO.HEIGHT,
        };

  return (
    <Image
      src={LOGIN_CONFIG.LOGO.SRC}
      alt={LOGIN_CONFIG.LOGO.ALT}
      width={dimensions.width}
      height={dimensions.height}
      className={`mx-auto select-none ${className}`}
      draggable={false}
      priority={priority}
      // 이미지 최적화 설정
      quality={95}
      style={{
        imageRendering: "-webkit-optimize-contrast",
      }}
    />
  );
}
