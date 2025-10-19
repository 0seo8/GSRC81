"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { type CourseWithComments } from "@/lib/courses-data";
// v2 전용 유틸 제거: 레거시 코스 타입 사용

interface CategoryFullScreenProps {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseWithComments[];
  initialCategory?: string;
  onCourseClick: (courseId: string) => void;
}

// 카테고리 정보 (PDF 기반)
const CATEGORIES = [
  {
    key: "jingwan",
    name: "진관동",
    subName: "러닝",
    backgroundColor: "#F5F5F0", // 연한 베이지
    cardColors: ["#FCFC60", "#78A893", "#D04836", "#F5F5F0", "#8F806E"], // PDF 페이지 9-11 색상들
  },
  {
    key: "track",
    name: "트랙",
    subName: "러닝",
    backgroundColor: "#957E74", // 브라운
    cardColors: ["#D04836", "#F5F5F0", "#957E74", "#8F806E"], // PDF 페이지 12 색상들
  },
  {
    key: "trail",
    name: "트레일",
    subName: "러닝",
    backgroundColor: "#758169", // 다크 그린
    cardColors: ["#78A893", "#F5F5F0", "#758169", "#E5E4D4"], // PDF 페이지 13 색상들
  },
  {
    key: "road",
    name: "로드",
    subName: "러닝",
    backgroundColor: "#BBBBBB", // 그레이
    cardColors: ["#FCFC60", "#78A893", "#8F806E", "#BBBBBB"], // PDF 페이지 14 색상들
  },
];

export function CategoryFullScreen({
  isOpen,
  onClose,
  courses,
  initialCategory = "jingwan",
  onCourseClick,
}: CategoryFullScreenProps) {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(
    CATEGORIES.findIndex((cat) => cat.key === initialCategory) || 0
  );

  const currentCategory = CATEGORIES[currentCategoryIndex];

  // 현재 카테고리의 코스들 필터링
  const filteredCourses = courses.filter(
    (course) => (course.category_key || "jingwan") === currentCategory.key
  );

  // 터치 스와이프 처리
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentCategoryIndex < CATEGORIES.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
    }
    if (isRightSwipe && currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    }
  };

  // 카테고리 변경 함수
  const goToPrevCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    }
  };

  const goToNextCategory = () => {
    if (currentCategoryIndex < CATEGORIES.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 - 20% 투명도로 지도가 보이도록 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* 메인 컨테이너 */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: currentCategory.backgroundColor }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* 헤더 */}
            <div className="p-4 pb-0">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-white">GSRC81 MAPS</h1>
                <div className="flex items-center space-x-4">
                  <span className="text-white text-sm">MENU</span>
                  <button
                    onClick={onClose}
                    className="p-2 bg-white rounded-full shadow-lg"
                  >
                    <X className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* 카테고리 네비게이션 */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={goToPrevCategory}
                  disabled={currentCategoryIndex === 0}
                  className="p-2 disabled:opacity-30"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>

                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white whitespace-pre-line">
                    {`${currentCategory.name}\n${currentCategory.subName}`}
                  </h2>
                  {/* 페이지 인디케이터 */}
                  <div className="flex space-x-2 justify-center mt-3">
                    {CATEGORIES.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-1 rounded-full ${
                          index === currentCategoryIndex
                            ? "bg-white"
                            : "bg-white opacity-50"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={goToNextCategory}
                  disabled={currentCategoryIndex === CATEGORIES.length - 1}
                  className="p-2 disabled:opacity-30"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* 코스 카드들 */}
            <div className="flex-1 px-4 pb-4 overflow-hidden">
              <div className="space-y-4 h-full overflow-y-auto">
                {filteredCourses.map((course, index) => {
                  const cardColor =
                    currentCategory.cardColors[
                      index % currentCategory.cardColors.length
                    ];

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-3xl p-6 shadow-lg cursor-pointer"
                      style={{ backgroundColor: cardColor }}
                      onClick={() => onCourseClick(course.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-black mb-2">
                            {course.title}
                          </h3>
                          <p className="text-sm text-black mb-1">
                            {course.description || "로드 러닝 코스"}
                          </p>
                          <p className="text-sm text-black">
                            {course.difficulty === "easy" && "쉬움"}
                            {course.difficulty === "medium" && "보통"}
                            {course.difficulty === "hard" && "어려움"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-black">
                            {Math.round(course.distance_km)}
                          </div>
                          <div className="text-lg text-black">km</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* 코스가 없을 때 */}
                {filteredCourses.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white text-lg">
                      이 카테고리에는 아직 코스가 없습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
