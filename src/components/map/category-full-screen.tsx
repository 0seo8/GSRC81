"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  type CourseWithComments,
  type CourseCategory,
} from "@/lib/courses-data";

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
  const [isDragging, setIsDragging] = useState(false);

  const currentCategory = categories[currentCategoryIndex];
  const currentDesign =
    CATEGORY_DESIGNS[currentCategory?.key as keyof typeof CATEGORY_DESIGNS] ||
    CATEGORY_DESIGNS.jingwan;

  // 카테고리가 없을 때 안전 장치
  if (!categories || categories.length === 0) {
    return null;
  }

  // 현재 카테고리의 코스들 필터링
  const filteredCourses = courses.filter(
    (course) => (course.category_key || "jingwan") === currentCategory?.key
  );

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

  // 스와이프 핸들러 - 카테고리와 카드 모두 처리
  const handleSwipe = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThreshold = 50;

    // 드래그 거리가 임계값보다 작으면 클릭으로 간주하여 스와이프 무시
    const totalDistance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    if (totalDistance < swipeThreshold) {
      return; // 클릭으로 간주, 스와이프 처리하지 않음
    }

    // 좌우 스와이프 - 카테고리 변경
    if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
      if (info.offset.x > swipeThreshold) {
        // 오른쪽 스와이프 - 이전 카테고리
        goToPrevCategory();
      } else if (info.offset.x < -swipeThreshold) {
        // 왼쪽 스와이프 - 다음 카테고리
        goToNextCategory();
      }
    } else {
      // 상하 스와이프 - 카드 변경
      if (info.offset.y < -swipeThreshold) {
        // 위로 스와이프 - 다음 카드
        goToNextCard();
      } else if (info.offset.y > swipeThreshold) {
        // 아래로 스와이프 - 이전 카드
        goToPrevCard();
      }
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
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col max-h-[85vh] rounded-t-[45px]"
            style={{ backgroundColor: currentDesign.backgroundColor }}
            onClick={(e) => e.stopPropagation()}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
              setIsDragging(false);
              handleSwipe(e, info);
            }}
          >
            {/* 헤더 */}
            <div className="p-4 pb-2">
              {/* 드래그 핸들 */}
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1 bg-white bg-opacity-50 rounded-full"></div>
              </div>

              {/* X 버튼 제거 - PDF에는 없음 */}

              {/* 카테고리 타이틀 - 왼쪽 정렬, 검정색 */}
              <div className="text-left mb-4">
                <h2 className="text-category text-black whitespace-pre-line">
                  {`${currentCategory?.name}\n러닝`}
                </h2>
              </div>
            </div>

            {/* 코스 카드들 - PDF 시안별 구조 */}
            <div className={`flex-1 px-4 pb-4 ${filteredCourses.length >= 3 ? 'overflow-y-auto' : 'overflow-hidden'} min-h-0`}>
              <div
                className="relative w-full"
                style={{
                  height:
                    filteredCourses.length === 1
                      ? "130px"  // 1개: 130px
                      : filteredCourses.length === 2
                        ? "250px"  // 2개: 180px + 70px = 250px
                        : "350px",  // 3개 이상: 스크롤 영역
                }}
              >
                {filteredCourses.map((course, index) => {
                  const cardColor =
                    currentDesign.cardColors[
                      index % currentDesign.cardColors.length
                    ];

                  // PDF 시안에 따른 카드 스타일 결정 - 스택 구조
                  let cardHeight, cardBottom, borderRadius, zIndex;
                  
                  if (filteredCourses.length === 1) {
                    // 1개: 130px 높이, 전체 라운드 45px (9페이지)
                    cardHeight = "130px";
                    cardBottom = "0px";
                    borderRadius = "45px";
                    zIndex = 1;
                  } else if (filteredCourses.length === 2) {
                    if (index === 0) {
                      // 첫번째카드(맨아래): 180px, 상단 좌우 라운드, 바닥에서 70px 떨어짐
                      cardHeight = "180px";
                      cardBottom = "70px";
                      borderRadius = "45px 45px 0 0";
                      zIndex = 1;
                    } else if (index === 1) {
                      // 두번째카드(위): 130px, 모든 라운드 45px, 맨 위
                      cardHeight = "130px";
                      cardBottom = "0px";
                      borderRadius = "45px";
                      zIndex = 2;
                    }
                  } else {
                    // 3개 이상 (11페이지)
                    if (index === 0) {
                      // 첫번째카드(맨아래): 180px, 상단 좌우 라운드, 바닥에서 70px 떨어짐
                      cardHeight = "180px";
                      cardBottom = "70px";
                      borderRadius = "45px 45px 0 0";
                      zIndex = 1;
                    } else if (index === 1) {
                      // 두번째카드(중간): 130px, 상단 좌우 라운드
                      cardHeight = "130px";
                      cardBottom = "0px";
                      borderRadius = "45px 45px 0 0";
                      zIndex = 2;
                    } else {
                      // 세번째카드 이후(맨위): 130px, 상단 좌우 라운드, 10cm만 보임
                      cardHeight = "130px";
                      cardBottom = `${-100 + (index - 2) * 30}px`; // 위로 올라가되 10cm만 보이도록
                      borderRadius = "45px 45px 0 0";
                      zIndex = 2 + index;
                    }
                  }

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="absolute left-0 right-0 p-6 cursor-pointer"
                      style={{
                        backgroundColor: cardColor,
                        bottom: cardBottom,
                        height: cardHeight,
                        borderRadius: borderRadius,
                        zIndex: zIndex,
                        boxShadow: `0 ${4 + index * 2}px ${12 + index * 4}px rgba(0,0,0,0.15)`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDragging) return;
                        onCourseClick(course.id);
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
