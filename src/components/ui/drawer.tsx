"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ isOpen, onClose, children, className }: DrawerProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [dragStart, setDragStart] = React.useState(0);
  const [dragOffset, setDragOffset] = React.useState(0);

  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // 애니메이션 완료 후 숨김
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // ESC 키로 닫기 (데스크탑에서만)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStart;

    if (diff > 0) {
      // 아래로 드래그만 허용
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 100) {
      // 100px 이상 드래그하면 닫기
      onClose();
    }
    setDragOffset(0);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black transition-opacity duration-300 z-40",
          isOpen ? "bg-opacity-50" : "bg-opacity-0"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out",
          // 모바일: 하단에서 올라오는 전체 너비 Drawer
          "bottom-0 left-0 right-0 rounded-t-2xl md:hidden",
          // 데스크탑: 중앙에 고정된 모달 형태
          "md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:max-w-2xl md:w-full md:max-h-[90vh]",
          isOpen
            ? "translate-y-0 md:translate-y-0"
            : "translate-y-full md:translate-y-0 md:opacity-0 md:scale-95",
          className
        )}
        style={{
          transform: isOpen
            ? `translateY(${dragOffset}px) md:translate(-50%, -50%)`
            : `translateY(100%) md:translate(-50%, -50%) scale(0.95)`,
          opacity: isOpen ? 1 : 0,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle - 모바일에서만 표시 */}
        <div className="flex justify-center pt-3 pb-2 md:hidden">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-4 pb-6 md:p-6 max-h-[80vh] md:max-h-[calc(90vh-120px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
