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
          // 카테고리별 색상 팔레트
          const getCategoryColors = (categoryKey: string) => {
            switch (categoryKey) {
              case "jingwan":
                return ["#78A893", "#FCFC60", "#8F806E", "#EBE7E4"];
              case "track":
                return ["#957E74", "#D04836", "#8F806E", "#FCFEF2"];
              case "trail":
                return ["#697064", "#758169", "#78A893", "#E5E4D4"];
              case "road":
                return ["#78A893", "#8F806E", "#BBBBBB", "#FCFC60"];
              default:
                return ["#78A893", "#FCFC60", "#8F806E", "#EBE7E4"]; // 기본값 (진관동러닝)
            }
          };

          const categoryKey = course.category_key || "jingwan";
          const categoryColors = getCategoryColors(categoryKey);
          const cardColor = categoryColors[index % categoryColors.length];

          // 색상 밝기에 따른 텍스트 색상 결정
          const isLightColor = (color: string) => {
            // 밝은 색상들 (노란색, 밝은 회색 등)
            const lightColors = [
              "#FCFC60",
              "#EBE7E4",
              "#FCFEF2",
              "#E5E4D4",
              "#BBBBBB",
            ];
            return lightColors.includes(color);
          };

          const textColor = isLightColor(cardColor)
            ? "text-gray-900"
            : "text-white";
          const textOpacity = isLightColor(cardColor)
            ? "opacity-60"
            : "opacity-70";

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
              className={`absolute rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg ${
                isHovered ? "shadow-2xl" : ""
              }`}
              style={{
                backgroundColor: cardColor,
                zIndex: zIndex,
                bottom: bottomOffset,
                left: leftOffset,
                right: leftOffset,
                height: "140px",
              }}
              onMouseEnter={() => setHoveredCardId(course.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              onClick={(e) => {
                e.stopPropagation();
                onCourseClick(course.id);
              }}
            >
              <div className="flex items-center justify-between h-full">
                {/* Left: Course Info */}
                <div className="flex flex-col justify-center">
                  {/* Course Title */}
                  <h3 className={`${textColor} text-course mb-2`}>
                    {course.title}
                  </h3>

                  {/* Course Details */}
                  <div className="flex items-center space-x-4">
                    <span className={`${textColor} ${textOpacity} text-body`}>
                      {course.distance_km}km
                    </span>
                    <span className={`${textColor} ${textOpacity} text-body`}>
                      {course.avg_time_min}분
                    </span>
                    <span className={`${textColor} ${textOpacity} text-body`}>
                      {getDifficultyText(course.difficulty)}
                    </span>
                    {course.comment_count > 0 && (
                      <span className={`${textColor} ${textOpacity} text-body`}>
                        💬 {course.comment_count}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Distance (Large) */}
                <div className={`${textColor} text-right flex flex-col items-end`}>
                  <span className="text-distance">
                    {course.distance_km}
                  </span>
                  <span className="text-distance-unit">
                    km
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
