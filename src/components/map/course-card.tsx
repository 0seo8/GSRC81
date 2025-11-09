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
      className="absolute left-0 right-0 p-6 cursor-pointer"
      style={{
        backgroundColor: cardColor,
        bottom: layout.bottom,
        height: layout.height,
        borderRadius: layout.borderRadius,
        zIndex: layout.zIndex,
        boxShadow: shadow,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isDragging) return;
        onCourseClick(course.id);
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-black mb-2">{course.title}</h3>
          <p className="text-sm text-black mb-1">
            {course.category_name + "러닝 코스"}
          </p>
          <p className="text-sm text-black">
            {getDifficultyText(course.difficulty)}
          </p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-black">
              {Math.round(course.distance_km)}
            </span>
            <span className="text-lg text-black ml-1">km</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
