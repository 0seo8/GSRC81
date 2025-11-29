"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Navigation, Shield } from "lucide-react";

/**
 * 메뉴 버튼 및 드롭다운 (클라이언트 컴포넌트)
 * - 우측 상단 MENU 텍스트 버튼
 * - 클릭 시 드롭다운 메뉴 표시
 */
export function MenuButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      {/* 메뉴 버튼 */}
      <button
        className="text-[0.625rem] font-medium font-poppins text-black"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        MENU
      </button>

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

            {/* 관리자 권한이 있는 사용자에게만 표시 */}
            {session?.user?.isAdmin && (
              <a
                href="/admin"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                관리자
              </a>
            )}
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
    </>
  );
}
