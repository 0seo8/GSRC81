import { CourseWithComments } from "@/lib/courses-data";
import { CourseCard } from "./course-card";

interface RefactoredCourseCardStackProps {
  courses: CourseWithComments[];
  cardColors: readonly string[];
  isDragging: boolean;
  onCourseClick: (courseId: string) => void;
}

export function RefactoredCourseCardStack({
  courses,
  cardColors,
  isDragging,
  onCourseClick,
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
      // 3개 이상: 마지막 카드의 bottom + height
      const lastCardIndex = courses.length - 1;
      const lastCardBottom = lastCardIndex * 5.4375; // 87px 간격
      const lastCardHeight = 11.25; // 2번째 이상 카드는 모두 11.25rem
      const totalHeight = lastCardBottom + lastCardHeight;
      return `${totalHeight}rem`;
    }
  };

  const stackHeight = calculateStackHeight();

  return (
    <div
      className="relative w-full font-sans mb-0 flex flex-col justify-end"
      style={{ height: stackHeight, minHeight: "100%" }}
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
          />
        );
      })}
    </div>
  );
}
