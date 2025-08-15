"use client";

import { useState, memo, useCallback } from "react";
import { type CourseWithComments } from "@/lib/courses-data";

interface CourseCardStackProps {
  courses: CourseWithComments[];
  onClose: () => void;
  onCourseClick: (courseId: string) => void;
}

const CourseCardStackComponent = function CourseCardStack({
  courses,
  onClose,
  onCourseClick,
}: CourseCardStackProps) {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // 난이도 텍스트 변환 함수를 useCallback으로 최적화
  const getDifficultyText = useCallback((difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "쉬움";
      case "medium":
        return "보통";
      case "hard":
        return "어려움";
      default:
        return difficulty;
    }
  }, []);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {" "}
      {/* 전체 컨테이너에서 이벤트 전파 방지 */}
      {/* Header - 전체 영역 클릭 가능 */}
      <div
        className="px-4 pt-4 pb-8 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onClose}
        aria-label="코스 목록 닫기"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation(); // 부모 클릭 이벤트 방지
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            aria-label="코스 목록 닫기"
          ></button>
        </div>
      </div>
      {/* Stacked Cards Container */}
      <div className="">
        {courses.map((course, index) => {
          const cardColors = [
            "bg-gray-900", // 첫 번째 카드
            "bg-gray-700", // 두 번째 카드
            "bg-gray-600", // 세 번째 카드
            "bg-gray-500", // 네 번째 카드
            "bg-gray-400", // 다섯 번째 카드
            "bg-gray-300", // 여섯 번째 카드
          ];

          const cardColor = cardColors[index % cardColors.length];

          // 텍스트 색상: 밝은 카드에는 검정 텍스트, 어두운 카드에는 흰 텍스트
          const textColor =
            index % cardColors.length >= 3 ? "text-gray-900" : "text-white";
          const textOpacity =
            index % cardColors.length >= 3 ? "opacity-60" : "opacity-70";

          // 스택 효과
          const baseZIndex = courses.length - index;
          const isHovered = hoveredCardId === course.id;
          const zIndex = isHovered ? courses.length + 10 : baseZIndex;
          const bottomOffset = index * 97; // 카드 간격
          const leftOffset = 0;

          // 이미 위에서 정의된 getDifficultyText 함수 사용

          return (
            <div
              key={course.id}
              className={`absolute ${cardColor} rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg ${
                isHovered ? "shadow-2xl" : ""
              }`}
              style={{
                zIndex: zIndex,
                bottom: bottomOffset,
                left: leftOffset,
                right: leftOffset,
                height: "140px",
              }}
              onMouseEnter={() => setHoveredCardId(course.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              onClick={() => onCourseClick(course.id)}
            >
              <div className="flex items-center justify-between h-full">
                {/* Left: Course Info */}
                <div className="flex flex-col justify-center">
                  {/* Course Title */}
                  <h3 className={`${textColor} text-xl font-bold mb-2`}>
                    {course.title}
                  </h3>

                  {/* Course Details */}
                  <div className="flex items-center space-x-4">
                    <span className={`${textColor} ${textOpacity} text-sm`}>
                      {course.distance_km}km
                    </span>
                    <span className={`${textColor} ${textOpacity} text-sm`}>
                      {course.avg_time_min}분
                    </span>
                    <span className={`${textColor} ${textOpacity} text-sm`}>
                      {getDifficultyText(course.difficulty)}
                    </span>
                    {course.comment_count > 0 && (
                      <span className={`${textColor} ${textOpacity} text-sm`}>
                        💬 {course.comment_count}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Distance (Large) */}
                <div className={`${textColor} text-right`}>
                  <span className="text-2xl font-bold">
                    {course.distance_km}km
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// React.memo로 props 변경 시에만 리렌더링
export const CourseCardStack = memo(CourseCardStackComponent);
