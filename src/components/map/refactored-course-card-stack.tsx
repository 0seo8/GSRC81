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
  const hasOverflow = courses.length >= 3;

  if (courses.length === 0) {
    return null;
  }

  // 카드 수에 따른 동적 높이 계산 (rem 단위)
  const calculateStackHeight = () => {
    if (courses.length === 1) {
      return "8.125rem"; // 단일 카드 높이 (130px ÷ 16)
    } else if (courses.length === 2) {
      return "15.625rem"; // 11.25rem + 4.375rem = 15.625rem (180px + 70px ÷ 16)
    } else if (courses.length === 3) {
      return "23.75rem"; // 8.125rem + 15.625rem = 23.75rem (130px + 250px ÷ 16)
    } else {
      // 4개 이상: 추가 카드마다 180px씩 증가
      const additionalCards = courses.length - 3;
      const additionalHeight = additionalCards * 11.25; // 180px ÷ 16 = 11.25rem
      return `${23.75 + additionalHeight}rem`;
    }
  };

  const stackHeight = calculateStackHeight();

  return (
    <div
      className={`${hasOverflow ? "overflow-y-auto" : "overflow-hidden"} font-sans`}
      style={{
        touchAction: hasOverflow ? "pan-y" : "none", // 세로 스크롤만 허용
        height: stackHeight, // 동적 높이 설정 (rem 단위)
      }}
    >
      <div
        className="relative w-full"
        style={{
          height: stackHeight, // 동적 높이 계산 (rem 단위)
        }}
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
    </div>
  );
}
