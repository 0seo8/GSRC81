import { PWAInstallButton } from "@/shared/components/common/pwa-install-button";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * 메인 레이아웃 (서버 컴포넌트)
 * - PWA 설치 버튼
 * - 각 페이지에서 AppHeader를 직접 렌더링
 */
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-transparent">
      {/* 메인 콘텐츠 */}
      <main className="relative">{children}</main>

      {/* PWA 설치 버튼 */}
      <PWAInstallButton />
    </div>
  );
}
