import { useCallback, useRef } from "react";

interface UseLongPressProps {
  onLongPress: (x: number, y: number) => void;
  delay?: number; // milliseconds
}

export function useLongPress({ onLongPress, delay = 800 }: UseLongPressProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const triggerVibration = useCallback(() => {
    // 진동 피드백 (지원하는 디바이스에서만)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(200);
    }
  }, []);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      // 시작 위치 저장
      const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
      const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;
      
      startPosRef.current = { x: clientX, y: clientY };

      // 기존 타이머 클리어
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 길게 누르기 타이머 설정
      timeoutRef.current = setTimeout(() => {
        if (startPosRef.current) {
          triggerVibration();
          onLongPress(startPosRef.current.x, startPosRef.current.y);
        }
      }, delay);
    },
    [onLongPress, delay, triggerVibration]
  );

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const move = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (!startPosRef.current) return;

      // 현재 위치
      const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
      const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;

      // 이동 거리 계산
      const deltaX = Math.abs(clientX - startPosRef.current.x);
      const deltaY = Math.abs(clientY - startPosRef.current.y);
      const moveThreshold = 20; // 20px 이상 이동하면 길게 누르기 취소

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clear();
      }
    },
    [clear]
  );

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: move,
  };
}