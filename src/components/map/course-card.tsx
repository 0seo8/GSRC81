import { motion } from "framer-motion";
import { CourseWithComments } from "@/lib/courses-data";
import {
  calculateCardLayout,
  calculateCardShadow,
  getDifficultyText,
} from "@/utils/card-layout";

interface CourseCardProps {
  course: CourseWithComments;
  index: number;
  totalCourses: number;
  cardColor: string;
  isDragging: boolean;
  onCourseClick: (courseId: string) => void;
  isExpanded?: boolean;
}

export function CourseCard({
  course,
  index,
  totalCourses,
  cardColor,
  isDragging,
  onCourseClick,
  isExpanded = false,
}: CourseCardProps) {
  const layout = calculateCardLayout(index, totalCourses);
  const shadow = calculateCardShadow(index);

  // 확장 시 모든 카드를 80px(5rem) 위로 이동
  const getBottomPosition = () => {
    if (!isExpanded || totalCourses < 3) {
      return layout.bottom;
    }
    // bottom 값에서 숫자 추출
    const currentBottom = parseFloat(layout.bottom);
    // NaN 체크
    if (isNaN(currentBottom)) {
      return layout.bottom;
    }
    // 80px = 5rem을 더함
    return `${currentBottom + 5}rem`;
  };

  return (
    <motion.div
      key={course.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        bottom: getBottomPosition(),
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
      className="absolute left-0 right-0 px-[41px] py-[20px] cursor-pointer"
      style={{
        backgroundColor: cardColor,
        height: layout.height,
        borderRadius: layout.borderRadius,
        zIndex: layout.zIndex,
        boxShadow: shadow,
      }}
      onClick={(e) => {
        // 스크롤 중이 아닐 때만 클릭 이벤트 처리
        if (isDragging) {
          e.preventDefault();
          return;
        }
        onCourseClick(course.id);
      }}
      onTouchStart={(e) => {
        // 터치 시작 시 스크롤을 방해하지 않도록
        e.stopPropagation();
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-bold text-black mb-[13px] text-lg">
            {course.title}
          </h3>
          <p className="font-medium text-black text-xs">
            {course.category_name + "러닝 코스"}
          </p>
          <p className="font-medium text-black text-xs">
            {getDifficultyText(course.difficulty)}
          </p>
        </div>
        <div className="text-right flex flex-col items-end justify-center h-full">
          <div className="flex items-baseline">
            <span className="text-distance text-black">
              {Math.round(course.distance_km)}
            </span>
            <span className="text-lg text-black ml-1">km</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
