import { PWAInstallButton } from "@/components/pwa-install-button";
import { AppHeader } from "@/components/layout/app-header";
import { MenuButton } from "@/components/layout/menu-button";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * 메인 레이아웃 (서버 컴포넌트)
 * - 공통 헤더 (AppHeader + MenuButton)
 * - PWA 설치 버튼
 */
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-transparent">
      {/* 공통 헤더 - AppHeader + 우측 메뉴 버튼 */}
      <AppHeader background="transparent" rightElement={<MenuButton />} />

      {/* 메인 콘텐츠 */}
      <main className="relative">{children}</main>

      {/* PWA 설치 버튼 */}
      <PWAInstallButton />
    </div>
  );
}
