import { CourseWithComments } from "@/lib/courses-data";
import { CourseCard } from "./course-card";

interface CourseCardStackProps {
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

export function CourseCardStack({
  courses,
  cardColors,
  isDragging,
  onCourseClick,
}: CourseCardStackProps) {
  const hasOverflow = courses.length >= 3;

  if (courses.length === 0) {
    return <EmptyState />;
  }

  // 카드 수에 따른 동적 높이 계산
  const calculateStackHeight = () => {
    if (courses.length === 1) {
      return 130; // 단일 카드 높이
    } else if (courses.length === 2) {
      return 130 + 70; // 첫 번째 카드 + 두 번째 카드 노출 부분
    } else {
      // 3개 이상: 첫 번째 + 두 번째 + 나머지 카드들의 점진적 노출
      return 130 + 70 + 60 + (courses.length - 2) * 30;
    }
  };

  return (
    <div
      className={`flex-1 ${
        hasOverflow ? "overflow-y-auto" : "overflow-hidden"
      } min-h-0`}
    >
      <div 
        className="relative w-full"
        style={{
          height: `${calculateStackHeight()}px`, // 동적 높이 계산
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
