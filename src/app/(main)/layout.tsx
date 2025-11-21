"use client";

import { useState } from "react";
import { Navigation } from "lucide-react";
import { PWAInstallButton } from "@/components/pwa-install-button";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent">
      {/* 공통 헤더 - 모든 페이지에서 표시 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="relative flex items-center justify-center px-4 py-4">
          {/* 중앙 정렬된 GSRC81 MAPS */}
          <h1 className="text-[1.0625rem] font-bold font-poppins text-black">
            GSRC81 MAPS
          </h1>

          {/* 우측 상단 MENU 텍스트 */}
          <button
            className="absolute right-4 text-[0.625rem] font-medium font-poppins text-black"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            MENU
          </button>
        </div>
      </header>

      {/* 메뉴 드롭다운 */}
      {isMenuOpen && (
        <div className="fixed top-16 right-4 z-60 bg-white rounded-lg shadow-lg border p-4 min-w-[200px]">
          <nav className="space-y-2">
            <a
              href="/map"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              <Navigation className="w-4 h-4 inline mr-2" />
              지도
            </a>
            <a
              href="/admin"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              관리자
            </a>
          </nav>
        </div>
      )}

      {/* 메뉴 외부 클릭 시 닫기 위한 백드롭 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-55"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* 메인 콘텐츠 */}
      <main className="relative">{children}</main>

      {/* PWA 설치 버튼 */}
      <PWAInstallButton />
    </div>
  );
}
