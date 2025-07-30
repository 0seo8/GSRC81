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
  const [isMobile, setIsMobile] = React.useState(false);

  // 화면 크기 감지
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
          "fixed inset-0 bg-black transition-opacity duration-300 z-[9998]",
          isOpen ? "bg-opacity-50" : "bg-opacity-0"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed bg-white shadow-2xl z-[9999] transition-all duration-300 ease-out",
          isMobile
            ? "bottom-0 left-0 right-0 rounded-t-2xl transform"
            : "inset-0 m-auto rounded-2xl max-w-2xl w-fit h-fit max-h-[90vh]",
          className
        )}
        style={
          isMobile
            ? {
                transform: isOpen
                  ? `translateY(${dragOffset}px)`
                  : `translateY(100%)`,
              }
            : {
                opacity: isOpen ? 1 : 0,
                visibility: isOpen ? "visible" : "hidden",
                scale: isOpen ? "1" : "0.95",
              }
        }
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
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
