import { useState, useCallback } from "react";

export type SnapPoint = "closed" | "medium" | "full";

interface UseBottomSheetSnapProps {
  onClose: () => void;
}

export function useBottomSheetSnap({ onClose }: UseBottomSheetSnapProps) {
  const [snapPoint, setSnapPoint] = useState<SnapPoint>("medium");

  // Snap point별 높이 반환
  const getSnapHeight = useCallback((point: SnapPoint): string => {
    switch (point) {
      case "closed":
        return "0vh";
      case "medium":
        return "65vh";
      case "full":
        return "100vh";
      default:
        return "65vh";
    }
  }, []);

  // 다음 snap point로 이동
  const snapToNext = useCallback(() => {
    setSnapPoint((current) => {
      switch (current) {
        case "closed":
          return "medium";
        case "medium":
          return "full";
        case "full":
          return "full"; // 최대에서 유지
        default:
          return "medium";
      }
    });
  }, []);

  // 이전 snap point로 이동
  const snapToPrev = useCallback(() => {
    setSnapPoint((current) => {
      switch (current) {
        case "full":
          return "medium";
        case "medium":
          return "closed";
        case "closed":
          onClose(); // 닫힌 상태에서는 완전히 닫기
          return "closed";
        default:
          return "medium";
      }
    });
  }, [onClose]);

  // 드래그 거리에 따른 snap point 결정
  const handleDragEnd = useCallback(
    (offsetY: number, velocityY: number) => {
      const threshold = 100; // 100px 이상 드래그해야 snap 변경
      const velocityThreshold = 500; // 빠른 드래그 감지

      // 빠른 드래그는 바로 snap 변경
      if (Math.abs(velocityY) > velocityThreshold) {
        if (velocityY < 0) {
          // 위로 빠르게 드래그
          snapToNext();
        } else {
          // 아래로 빠르게 드래그
          snapToPrev();
        }
        return;
      }

      // 일반 드래그는 거리 기반으로 판단
      if (offsetY < -threshold) {
        // 위로 충분히 드래그
        snapToNext();
      } else if (offsetY > threshold) {
        // 아래로 충분히 드래그
        snapToPrev();
      }
      // threshold 미만이면 현재 상태 유지
    },
    [snapToNext, snapToPrev]
  );

  return {
    snapPoint,
    setSnapPoint,
    getSnapHeight,
    snapToNext,
    snapToPrev,
    handleDragEnd,
  };
}
