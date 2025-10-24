"use client";

import { useState } from "react";
import { Menu, X, Navigation } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-lola-50">
      {/* 공통 헤더 - 투명 배경 */}
      <header className="fixed top-4 left-4 right-4 z-50 bg-transparent">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-black">GSRC81 MAPS</h1>
          <div className="flex items-center space-x-4">
            <span className="text-black text-sm">MENU</span>
            <button
              className="p-2 bg-transparent rounded-full"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
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
    </div>
  );
}
