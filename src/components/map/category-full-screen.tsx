"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { type CourseWithComments, type CourseCategory } from "@/lib/courses-data";

interface CategoryFullScreenProps {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseWithComments[];
  categories: CourseCategory[];
  initialCategory?: string;
  onCourseClick: (courseId: string) => void;
  onCategoryChange?: (categoryKey: string) => void;
}

// 카테고리별 디자인 매핑 (PDF 기반)
const CATEGORY_DESIGNS = {
  jingwan: {
    backgroundColor: "#F5F5F0", // 연한 베이지
    cardColors: ["#FCFC60", "#78A893", "#D04836", "#F5F5F0", "#8F806E"],
  },
  track: {
    backgroundColor: "#957E74", // 브라운
    cardColors: ["#D04836", "#F5F5F0", "#957E74", "#8F806E"],
  },
  trail: {
    backgroundColor: "#758169", // 다크 그린
    cardColors: ["#78A893", "#F5F5F0", "#758169", "#E5E4D4"],
  },
  road: {
    backgroundColor: "#BBBBBB", // 그레이
    cardColors: ["#FCFC60", "#78A893", "#8F806E", "#BBBBBB"],
  },
} as const;

export function CategoryFullScreen({
  isOpen,
  onClose,
  courses,
  categories,
  initialCategory = "jingwan",
  onCourseClick,
  onCategoryChange,
}: CategoryFullScreenProps) {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(
    categories.findIndex((cat) => cat.key === initialCategory) || 0
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const currentCategory = categories[currentCategoryIndex];
  const currentDesign = CATEGORY_DESIGNS[currentCategory?.key as keyof typeof CATEGORY_DESIGNS] || CATEGORY_DESIGNS.jingwan;

  // 카테고리가 없을 때 안전 장치
  if (!categories || categories.length === 0) {
    return null;
  }

  // 현재 카테고리의 코스들 필터링
  const filteredCourses = courses.filter(
    (course) => (course.category_key || "jingwan") === currentCategory?.key
  );

  // 카테고리 변경 함수
  const goToPrevCategory = () => {
    if (currentCategoryIndex > 0) {
      const newIndex = currentCategoryIndex - 1;
      setCurrentCategoryIndex(newIndex);
      setCurrentCardIndex(0); // 카테고리 변경 시 첫 번째 카드로 리셋
      onCategoryChange?.(categories[newIndex].key); // 지도에 카테고리 변경 알림
    }
  };

  const goToNextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      const newIndex = currentCategoryIndex + 1;
      setCurrentCategoryIndex(newIndex);
      setCurrentCardIndex(0); // 카테고리 변경 시 첫 번째 카드로 리셋
      onCategoryChange?.(categories[newIndex].key); // 지도에 카테고리 변경 알림
    }
  };

  // 카드 네비게이션 함수
  const goToPrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const goToNextCard = () => {
    if (currentCardIndex < filteredCourses.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  // 카드 스와이프 핸들러
  const handleCardSwipe = (event: any, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.y < -swipeThreshold) {
      // 위로 스와이프 - 다음 카드
      goToNextCard();
    } else if (info.offset.y > swipeThreshold) {
      // 아래로 스와이프 - 이전 카드
      goToPrevCard();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 - 어두운 오버레이로 클릭 시 닫기 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* 메인 컨테이너 - 하단에서 올라오는 드로어 스타일 */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col max-h-[85vh]"
            style={{ backgroundColor: currentDesign.backgroundColor }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="p-4 pb-2">
              {/* 드래그 핸들 */}
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1 bg-white bg-opacity-50 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-end mb-3">
                <button
                  onClick={onClose}
                  className="p-2 bg-white rounded-full shadow-lg"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* 카테고리 네비게이션 */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPrevCategory}
                  disabled={currentCategoryIndex === 0}
                  className="p-2 disabled:opacity-30"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>

                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white whitespace-pre-line">
                    {`${currentCategory?.name || "카테고리"}\n러닝`}
                  </h2>
                  {/* 페이지 인디케이터 */}
                  <div className="flex space-x-2 justify-center mt-3">
                    {categories.map((_, index) => (
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
                  
                  {/* 카드 인디케이터 (카드가 2개 이상일 때만 표시) */}
                  {filteredCourses.length > 1 && (
                    <div className="flex space-x-1 justify-center mt-2">
                      {filteredCourses.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            index === currentCardIndex
                              ? "bg-white"
                              : "bg-white opacity-30"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={goToNextCategory}
                  disabled={currentCategoryIndex === categories.length - 1}
                  className="p-2 disabled:opacity-30"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* 코스 카드들 - PDF 10페이지 스타일 스택 */}
            <div className="flex-1 px-4 pb-4 overflow-hidden min-h-0">
              <div className="relative w-full" style={{
                height: filteredCourses.length === 1 ? '160px' : 
                       filteredCourses.length === 2 ? '270px' : 
                       `${160 + (filteredCourses.length - 1) * 110}px`
              }}>
                {filteredCourses.map((course, index) => {
                  const cardColor =
                    currentDesign.cardColors[
                      index % currentDesign.cardColors.length
                    ];
                  
                  // 현재 카드 기준으로 상대적 인덱스 계산
                  const relativeIndex = index - currentCardIndex;
                  const maxVisible = Math.min(5, filteredCourses.length); // PDF 규칙: 최대 5개까지
                  const isVisible = relativeIndex >= 0 && relativeIndex < maxVisible;
                  
                  if (!isVisible) return null;
                  
                  // 카드 개수에 따른 조건부 스타일링
                  const isSingleCard = filteredCourses.length === 1;
                  const stackOffset = isSingleCard ? 0 : relativeIndex * 110; // 1개면 스택 없음
                  const scale = isSingleCard ? 1 : 1 - relativeIndex * 0.03; // 1개면 축소 없음
                  const zIndex = relativeIndex + 1;
                  
                  // PDF 10페이지 기반: 뒤 카드도 선명하게 보이도록
                  let opacity = 1;
                  if (relativeIndex === 1) opacity = 0.95;
                  else if (relativeIndex === 2) opacity = 0.9;
                  else if (relativeIndex >= 3) opacity = 0.85;
                  
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: opacity, 
                        y: 0,
                        scale: scale,
                      }}
                      transition={{ 
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                      drag={relativeIndex === 0 ? "y" : false} // 맨 앞 카드만 드래그 가능
                      dragConstraints={{ top: -100, bottom: 100 }}
                      onDragEnd={handleCardSwipe}
                      className="absolute left-0 right-0 rounded-3xl p-6 cursor-pointer"
                      style={{ 
                        backgroundColor: cardColor,
                        top: `${stackOffset}px`, // 다시 top 기준으로
                        zIndex: zIndex,
                        height: '160px',
                        boxShadow: `0 ${4 + relativeIndex * 2}px ${12 + relativeIndex * 4}px rgba(0,0,0,0.15)`,
                        transform: `scale(${scale})`
                      }}
                      onClick={() => {
                        if (relativeIndex === 0) {
                          onCourseClick(course.id);
                        } else {
                          // 뒤의 카드를 클릭하면 앞으로 가져오기
                          setCurrentCardIndex(index);
                        }
                      }}
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

                {/* 코스가 없을 때 - 빈 상태이지만 카테고리 네비게이션은 유지 */}
                {filteredCourses.length === 0 && (
                  <div className="text-center py-16">
                    <div className="mb-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🏃‍♂️</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {currentCategory?.name || "카테고리"} 러닝 코스
                      </h3>
                      <p className="text-white text-opacity-80">
                        이 카테고리에는 아직 등록된 코스가 없습니다.
                      </p>
                      <p className="text-white text-opacity-60 text-sm mt-2">
                        다른 카테고리를 확인해보세요!
                      </p>
                    </div>
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
