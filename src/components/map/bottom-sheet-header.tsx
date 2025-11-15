import { useState, useRef } from "react";

interface BottomSheetHeaderProps {
  categoryName?: string;
  dongNames: string[];
  isAllCategory: boolean;
  onHeaderDrag: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
  ) => void;
}

export function BottomSheetHeader({
  categoryName,
  dongNames,
  isAllCategory,
  onHeaderDrag,
}: BottomSheetHeaderProps) {
  const getTitle = () => {
    if (isAllCategory) {
      return dongNames.length > 0
        ? `${dongNames.join(", ")}\n러닝`
        : "전체\n러닝";
    }
    return `${categoryName}\n러닝`;
  };

  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startTime, setStartTime] = useState(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
    setStartTime(Date.now());
    isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    const touch = e.changedTouches[0];
    const endTime = Date.now();
    const deltaTime = endTime - startTime;
    
    const offset = {
      x: touch.clientX - startPos.x,
      y: touch.clientY - startPos.y
    };
    
    const velocity = {
      x: offset.x / deltaTime * 1000, // pixels per second
      y: offset.y / deltaTime * 1000
    };
    
    onHeaderDrag(e.nativeEvent, { offset, velocity });
    isDragging.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartTime(Date.now());
    isDragging.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const endTime = Date.now();
    const deltaTime = endTime - startTime;
    
    const offset = {
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    };
    
    const velocity = {
      x: offset.x / deltaTime * 1000,
      y: offset.y / deltaTime * 1000
    };
    
    onHeaderDrag(e.nativeEvent, { offset, velocity });
    isDragging.current = false;
  };

  return (
    <div
      className="px-6 py-4 pb-2 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* 드래그 핸들 */}
      <div className="flex justify-center mb-2">
        <div className="w-10 h-1 bg-white bg-opacity-50 rounded-full"></div>
      </div>

      {/* 카테고리 타이틀 - 왼쪽 정렬, 검정색 */}
      <div className="text-left mb-4">
        <h2 className="text-category text-black whitespace-pre-line">
          {getTitle()}
        </h2>
      </div>
    </div>
  );
}
