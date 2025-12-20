import { motion } from "framer-motion";
import { CourseWithCategory } from "@/lib/supabase/repositories/courseRepository";
import {
  calculateCardLayout,
  calculateCardShadow,
  getDifficultyText,
} from "@/shared/lib/utils/card-layout";

interface CourseCardProps {
  course: CourseWithCategory;
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
  const shadow = calculateCardShadow();

  // 확장 시 모든 카드를 5rem 위로 이동
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
    // 5rem을 더함
    return `${currentBottom + 5}rem`;
  };

  return (
    <motion.div
      key={course.id}
      layoutId={`course-card-${course.id}`}
      layout
      initial={{
        opacity: 0,
        y: 40,
        scale: 0.95,
        filter: "blur(0.25rem)",
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0)",
      }}
      whileHover={{
        scale: index === 0 ? 1.02 : 1, // 맨 앞 카드만 호버 효과
        y: index === 0 ? -4 : 0,
        transition: {
          duration: 0.2,
          ease: "easeOut",
        },
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 },
      }}
      transition={{
        layout: {
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1],
        },
        opacity: {
          duration: 0.5,
          delay: index * 0.08, // Stagger effect
          ease: [0.25, 0.1, 0.25, 1],
        },
        y: {
          duration: 0.6,
          delay: index * 0.08,
          ease: [0.25, 0.1, 0.25, 1],
        },
        scale: {
          duration: 0.5,
          delay: index * 0.08,
          ease: [0.25, 0.1, 0.25, 1],
        },
        filter: {
          duration: 0.6,
          delay: index * 0.08,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }}
      className="absolute left-0 right-0 px-[2.5625rem] py-5 cursor-pointer"
      style={{
        backgroundColor: cardColor,
        height: layout.height,
        borderRadius: layout.borderRadius,
        zIndex: layout.zIndex,
        boxShadow: shadow,
        bottom: getBottomPosition(),
        willChange: "transform, opacity, filter",
        backfaceVisibility: "hidden",
        transform: "translate3d(0, 0, 0)",
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
          <h3 className="font-bold text-black mb-3 text-lg">{course.title}</h3>
          <p className="font-medium text-black text-xs">
            {course.course_categories?.name + "러닝 코스"}
          </p>
          <p className="font-medium text-black text-xs">
            {getDifficultyText(course.difficulty || "medium")}
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
