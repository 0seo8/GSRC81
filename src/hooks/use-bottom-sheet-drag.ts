import { useState, useCallback } from "react";
import { PanInfo } from "framer-motion";
import { useBottomSheetSnap } from "./use-bottom-sheet-snap";

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
  
  // Snap points 관리
  const snapManager = useBottomSheetSnap({ onClose });

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

      if (info.offset.x > swipeThreshold) {
        // 오른쪽 스와이프 - 이전 카테고리 (무한 루프)
        console.log("Right swipe - going to previous category");
        onCategoryChange("prev");
      } else if (info.offset.x < -swipeThreshold) {
        // 왼쪽 스와이프 - 다음 카테고리 (무한 루프)
        console.log("Left swipe - going to next category");
        onCategoryChange("next");
      }

      // 카테고리 변경 후 위치 리셋
      setDragKey(prev => prev + 1);
    },
    [currentCategoryIndex, totalCategories, onCategoryChange]
  );

  // 헤더 드래그 핸들러 (상하 드래그로 snap points 변경 + 좌우 스와이프로 카테고리 변경)
  const handleHeaderDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 50;

      // 좌우 스와이프가 더 강한 경우 카테고리 변경 우선
      if (Math.abs(info.offset.x) >= swipeThreshold && Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
        if (info.offset.x > swipeThreshold) {
          // 오른쪽 스와이프 - 이전 카테고리 (무한 루프)
          onCategoryChange("prev");
        } else if (info.offset.x < -swipeThreshold) {
          // 왼쪽 스와이프 - 다음 카테고리 (무한 루프)
          onCategoryChange("next");
        }
        
        // 카테고리 변경 후 위치 리셋
        setDragKey(prev => prev + 1);
        return;
      }

      // 상하 드래그로 snap points 변경
      snapManager.handleDragEnd(info.offset.y, info.velocity.y);
    },
    [onCategoryChange, snapManager]
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
    snapManager,
  };
}