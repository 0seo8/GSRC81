"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface AdminHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function AdminHeader({
  title,
  showBack = false,
  rightAction,
}: AdminHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 bg-white border-b border-lola-200 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        {/* 뒤로가기 버튼 */}
        {showBack ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-lola-700 hover:text-lola-900 hover:bg-lola-100 -ml-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        ) : (
          <div className="w-8" /> // 공간 확보
        )}

        {/* 페이지 제목 */}
        <h1 className="text-lg font-semibold text-lola-950">{title}</h1>

        {/* 우측 액션 */}
        {rightAction ? (
          <div>{rightAction}</div>
        ) : (
          <div className="w-8" /> // 공간 확보
        )}
      </div>
    </header>
  );
}
