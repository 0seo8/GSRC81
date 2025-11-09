import { useState, useCallback } from "react";
import { PanInfo } from "framer-motion";

interface UseBottomSheetDragProps {
  onClose: () => void;
  onCategoryChange: (direction: "prev" | "next") => void;
  currentCategoryIndex: number;
  totalCategories: number;
}

export function useBottomSheetDrag({
  onClose,
  onCategoryChange,
  currentCategoryIndex,
  totalCategories,
}: UseBottomSheetDragProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragKey, setDragKey] = useState(0);

  // 카테고리 스와이프 핸들러 (좌우 드래그)
  const handleCategorySwipe = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 50;

      console.log("Swipe detected:", {
        offsetX: info.offset.x,
        currentIndex: currentCategoryIndex,
        totalCategories,
      });

      // 드래그 거리가 임계값보다 작으면 무시
      if (Math.abs(info.offset.x) < swipeThreshold) {
        console.log("Swipe below threshold, resetting position");
        setDragKey(prev => prev + 1);
        return;
      }

      if (info.offset.x > swipeThreshold && currentCategoryIndex > 0) {
        // 오른쪽 스와이프 - 이전 카테고리
        console.log("Right swipe - going to previous category");
        onCategoryChange("prev");
      } else if (info.offset.x < -swipeThreshold && currentCategoryIndex < totalCategories - 1) {
        // 왼쪽 스와이프 - 다음 카테고리
        console.log("Left swipe - going to next category");
        onCategoryChange("next");
      }

      // 카테고리 변경 후 위치 리셋
      setDragKey(prev => prev + 1);
    },
    [currentCategoryIndex, totalCategories, onCategoryChange]
  );

  // 헤더 드래그 핸들러 (아래로 드래그하여 닫기)
  const handleHeaderDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const closeThreshold = 100;

      // 아래로 충분히 드래그하면 바텀시트 닫기
      if (info.offset.y > closeThreshold) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    handleCategorySwipe(e, info);
  }, [handleCategorySwipe]);

  return {
    isDragging,
    dragKey,
    handleCategorySwipe,
    handleHeaderDrag,
    handleDragStart,
    handleDragEnd,
  };
}