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
}

export function CourseCard({
  course,
  index,
  totalCourses,
  cardColor,
  isDragging,
  onCourseClick,
}: CourseCardProps) {
  const layout = calculateCardLayout(index, totalCourses);
  const shadow = calculateCardShadow(index);

  return (
    <motion.div
      key={course.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
      className="absolute left-0 right-0 px-[41px] py-[20px] cursor-pointer"
      style={{
        backgroundColor: cardColor,
        bottom: layout.bottom,
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
