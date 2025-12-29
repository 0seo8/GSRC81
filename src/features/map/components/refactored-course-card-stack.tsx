import { CourseWithCategory } from "@/lib/supabase/repositories/courseRepository";
import { CourseCard } from "./course-card";
import { getStackHeight } from "@/shared/lib/utils/card-layout";

interface RefactoredCourseCardStackProps {
  courses: CourseWithCategory[];
  cardColors: readonly string[];
  isDragging: boolean;
  onCourseClick: (courseId: string) => void;
  isExpanded?: boolean;
}

export function RefactoredCourseCardStack({
  courses,
  cardColors,
  isDragging,
  onCourseClick,
  isExpanded = false,
}: RefactoredCourseCardStackProps) {
  if (courses.length === 0) {
    return null;
  }

  // 🎨 Figma 스펙대로 카드 스택 높이 계산 (rem 단위)
  const stackHeight = getStackHeight(courses.length);

  return (
    <div
      className="relative w-full font-sans mb-0"
      style={courses.length === 1 ? {} : { height: stackHeight }}
    >
      {courses.map((course, index) => {
        const cardColor = cardColors[index % cardColors.length];

        return (
          <CourseCard
            key={course.id}
            course={course}
            index={index}
            totalCourses={courses.length}
            cardColor={cardColor}
            isDragging={isDragging}
            onCourseClick={onCourseClick}
            isExpanded={isExpanded}
          />
        );
      })}
    </div>
  );
}
