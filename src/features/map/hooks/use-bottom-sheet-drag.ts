import { useState, useCallback } from "react";
import { PanInfo } from "framer-motion";
import { useBottomSheetSnap } from "./use-bottom-sheet-snap";

interface UseBottomSheetDragProps {
  onClose: () => void;
}

export function useBottomSheetDrag({
  onClose,
}: UseBottomSheetDragProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Snap points 관리
  const snapManager = useBottomSheetSnap({ onClose });

  // 헤더 드래그 핸들러 (상하 드래그로만 snap points 변경, 스와이프 기능 제거)
  const handleHeaderDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // 상하 드래그로 snap points 변경
      snapManager.handleDragEnd(info.offset.y, info.velocity.y);
    },
    [snapManager],
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    handleHeaderDrag,
    handleDragStart,
    handleDragEnd,
    snapManager,
  };
}
