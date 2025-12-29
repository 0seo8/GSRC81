import { CourseWithCategory } from "@/lib/supabase/repositories/courseRepository";
import { CourseCard } from "./course-card";
import { getStackHeight } from "@/shared/lib/utils/card-layout";
import { getCardColorForCourse } from "@/core/config/category-designs";

interface RefactoredCourseCardStackProps {
  courses: CourseWithCategory[];
  cardColors: readonly string[];
  isDragging: boolean;
  onCourseClick: (courseId: string) => void;
  isExpanded?: boolean;
  currentCategoryKey?: string; // 현재 선택된 카테고리 키 추가
}

export function RefactoredCourseCardStack({
  courses,
  cardColors,
  isDragging,
  onCourseClick,
  isExpanded = false,
  currentCategoryKey = "all",
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
        // 이전 카드의 카테고리 키 가져오기
        const previousCourseCategoryKey =
          index > 0 ? courses[index - 1].course_categories?.key : undefined;

        // 같은 카테고리가 연속된 개수를 계산 (색상 인덱스로 사용)
        let sameConsecutiveCount = 0;
        if (previousCourseCategoryKey === course.course_categories?.key) {
          // 역방향으로 같은 카테고리 개수 세기
          for (let i = index - 1; i >= 0; i--) {
            if (
              courses[i].course_categories?.key ===
              course.course_categories?.key
            ) {
              sameConsecutiveCount++;
            } else {
              break;
            }
          }
        }

        // "전체" 카테고리일 때는 각 코스의 원래 카테고리 색상 사용
        // 같은 카테고리가 연속되면 다른 색상으로 순환
        // 그 외에는 현재 카테고리의 색상 배열에서 순환
        const cardColor = getCardColorForCourse(
          course.course_categories?.key,
          currentCategoryKey,
          sameConsecutiveCount,
          previousCourseCategoryKey,
        );

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
