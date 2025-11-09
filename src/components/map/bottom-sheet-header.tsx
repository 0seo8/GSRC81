import { motion } from "framer-motion";
import { PanInfo } from "framer-motion";

interface BottomSheetHeaderProps {
  categoryName?: string;
  dongNames: string[];
  isAllCategory: boolean;
  onHeaderDrag: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
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

  return (
    <motion.div
      className="p-4 pb-2 cursor-grab active:cursor-grabbing"
      drag="y"
      dragConstraints={{ top: 0, bottom: 200 }}
      dragElastic={0.2}
      onDragEnd={onHeaderDrag}
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
    </motion.div>
  );
}