import { LOGIN_CONFIG } from "@/lib/config/login-constants";

interface AppHeaderProps {
  /**
   * 헤더 배경색
   * @default "transparent"
   */
  background?: "transparent" | "gray";
  /**
   * 헤더 우측에 렌더링할 추가 요소 (예: 메뉴 버튼)
   */
  rightElement?: React.ReactNode;
  /**
   * 헤더 전체를 커스텀할 children (제공 시 기본 레이아웃 무시)
   */
  children?: React.ReactNode;
}

/**
 * 공통 앱 헤더 컴포넌트
 * - 로그인/인증 페이지: 배경 gray-100, 중앙 로고만
 * - 메인 페이지: 배경 transparent, 중앙 로고 + 우측 메뉴
 */
export function AppHeader({
  background = "transparent",
  rightElement,
  children
}: AppHeaderProps) {
  const bgClass = background === "gray" ? "bg-gray-100" : "bg-transparent";

  // children이 제공된 경우 커스텀 레이아웃 사용
  if (children) {
    return (
      <header className={`fixed top-0 left-0 right-0 z-50 ${bgClass}`}>
        {children}
      </header>
    );
  }

  // 기본 레이아웃: 중앙 로고 + 선택적 우측 요소
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${bgClass}`}>
      <div className="relative flex items-center justify-center px-4 py-4">
        <h1 className="text-lg font-semibold tracking-wide text-black font-poppins">
          {LOGIN_CONFIG.TEXT.TITLE}
        </h1>
        {rightElement && (
          <div className="absolute right-4">
            {rightElement}
          </div>
        )}
      </div>
    </header>
  );
}