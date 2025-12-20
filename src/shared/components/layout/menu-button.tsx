"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Navigation, Shield, Plus } from "lucide-react";

interface MenuButtonProps {
  /**
   * 카테고리 선택 이벤트 핸들러 (map 페이지에서만 사용)
   */
  onCategorySelect?: (categoryKey: string) => void;
  /**
   * 현재 선택된 카테고리 (map 페이지에서만 사용)
   */
  selectedCategory?: string;
  /**
   * 표시할 카테고리 목록 (map 페이지에서만 사용)
   */
  categories?: Array<{ key: string; name: string }>;
  /**
   * 메뉴 열림 이벤트 핸들러 (바텀시트 닫기용)
   */
  onMenuOpen?: () => void;
}

/**
 * 메뉴 버튼 및 드롭다운 (클라이언트 컴포넌트)
 * - 우측 상단 MENU 텍스트 버튼
 * - 클릭 시 드롭다운 메뉴 표시
 * - map 페이지에서는 카테고리 선택 기능 포함
 */
export function MenuButton({
  onCategorySelect,
  selectedCategory,
  categories,
  onMenuOpen,
}: MenuButtonProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  // map 페이지인지 확인 (카테고리 props가 있으면 map 페이지)
  const isMapPage = !!categories;

  const handleToggleMenu = () => {
    if (!isMenuOpen) {
      // 메뉴를 열 때 바텀시트 닫기
      onMenuOpen?.();
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCategoryClick = (categoryKey: string) => {
    onCategorySelect?.(categoryKey);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* 메뉴 버튼 */}
      <button
        className="text-[0.625rem] font-medium font-poppins text-black"
        onClick={handleToggleMenu}
        aria-expanded={isMenuOpen}
        aria-label="메뉴"
      >
        MENU
      </button>

      {/* 메뉴 드롭다운 */}
      {isMenuOpen && (
        <div className="fixed top-16 right-4 z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px]">
          <nav className="py-2">
            {/* map 페이지: 카테고리 목록 */}
            {isMapPage && categories && (
              <div className="border-b border-gray-200 pb-2 mb-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                  카테고리
                </div>
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => handleCategoryClick(category.key)}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      category.key === selectedCategory
                        ? "bg-gray-100 text-black font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{category.name}</span>
                      {category.key === selectedCategory && (
                        <span className="text-xs text-gray-500">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 네비게이션 링크 */}
            <a
              href="/map"
              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Navigation className="w-4 h-4 inline mr-2" />
              지도
            </a>

            {/* 인증된 사용자(verified=true)에게만 코스 등록 메뉴 표시 */}
            {session?.user?.isVerified && (
              <a
                href="/admin/courses/new"
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                코스 등록
              </a>
            )}

            {/* 관리자 권한이 있는 사용자에게만 표시 */}
            {session?.user?.isAdmin && (
              <a
                href="/admin"
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                관리자
              </a>
            )}
          </nav>
        </div>
      )}

      {/* 메뉴 외부 클릭 시 닫기 위한 백드롭 (오버레이 제거) */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
