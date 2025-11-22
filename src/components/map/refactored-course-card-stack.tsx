import { CourseWithComments } from "@/lib/courses-data";
import { CourseCard } from "./course-card";

interface RefactoredCourseCardStackProps {
  courses: CourseWithComments[];
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

  // 카드 수에 따른 동적 높이 계산 (rem 단위) - 실제 카드 배치 기준
  const calculateStackHeight = () => {
    if (courses.length === 1) {
      return "100%"; // 1개일때는 스크롤 영역에 꽉 차도록
    } else if (courses.length === 2) {
      // 2개: 2번째 카드의 bottom + height
      return "16.6875rem"; // 5.4375rem + 11.25rem
    } else {
      // 3개 이상: 38px씩 겹침, 카드 높이 150px
      const lastCardIndex = courses.length - 1;
      const overlap = 2.375; // 38px
      const lastCardBottom = (lastCardIndex - 1) * (9.375 - overlap); // (150 - 38) * (index - 1)
      const lastCardHeight = 9.375; // 150px
      const totalHeight = lastCardBottom + lastCardHeight;
      return `${totalHeight}rem`;
    }
  };

  const stackHeight = calculateStackHeight();

  return (
    <div
      className="relative w-full font-sans mb-0"
      style={{ height: stackHeight }}
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
