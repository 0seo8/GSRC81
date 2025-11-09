import { CourseWithComments } from "@/lib/courses-data";
import { CourseCard } from "./course-card";

interface RefactoredCourseCardStackProps {
  courses: CourseWithComments[];
  cardColors: readonly string[];
  isDragging: boolean;
  onCourseClick: (courseId: string) => void;
}

interface EmptyStateProps {
  categoryName?: string;
}

function EmptyState({ categoryName }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <span className="text-2xl">🏃‍♂️</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {categoryName || "카테고리"} 러닝 코스
        </h3>
        <p className="text-white text-opacity-80">
          이 카테고리에는 아직 등록된 코스가 없습니다.
        </p>
        <p className="text-white text-opacity-60 text-sm mt-2">
          다른 카테고리를 확인해보세요!
        </p>
      </div>
    </div>
  );
}

export function RefactoredCourseCardStack({
  courses,
  cardColors,
  isDragging,
  onCourseClick,
}: RefactoredCourseCardStackProps) {
  const hasOverflow = courses.length >= 3;

  if (courses.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      className={`flex-1 ${
        hasOverflow ? "overflow-y-auto" : "overflow-hidden"
      } min-h-0`}
    >
      <div
        className="relative w-full"
        style={{
          height: "250px", // 카드 개수와 상관없이 항상 250px 고정
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