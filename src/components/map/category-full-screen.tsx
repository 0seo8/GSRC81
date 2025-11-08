"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  type CourseWithComments,
  type CourseCategory,
} from "@/lib/courses-data";
import { getDongsFromCourses } from "@/lib/location-utils";

interface CategoryFullScreenProps {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseWithComments[];
  categories: CourseCategory[];
  initialCategory?: string;
  onCourseClick: (courseId: string) => void;
  onCategoryChange?: (categoryKey: string) => void;
  selectedCourse?: CourseWithComments | null;
  selectedCourses?: CourseWithComments[];
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
  selectedCourse,
  selectedCourses,
}: CategoryFullScreenProps) {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(
    categories.findIndex((cat) => cat.key === initialCategory) || 0
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragKey, setDragKey] = useState(0);
  const [dongNames, setDongNames] = useState<string[]>([]);

  const currentCategory = categories[currentCategoryIndex];
  const currentDesign =
    CATEGORY_DESIGNS[
      currentCategory?.key === "all"
        ? "jingwan"
        : (currentCategory?.key as keyof typeof CATEGORY_DESIGNS)
    ] || CATEGORY_DESIGNS.jingwan;

  // 현재 카테고리의 코스들 필터링 (memoized)
  const filteredCourses = useMemo(() => {
    if (currentCategory?.key === "all") {
      // 전체 카테고리인 경우 선택된 코스들만 표시
      const targetCourses =
        selectedCourses && selectedCourses.length > 0
          ? selectedCourses
          : selectedCourse
            ? [selectedCourse]
            : [];
      return targetCourses;
    } else {
      return courses.filter(
        (course) =>
          (course.category_key || "jingwan") === currentCategory?.key
      );
    }
  }, [currentCategory?.key, selectedCourses, selectedCourse, courses]);

  // 좌표 조합 키 생성 (memoized)
  const coordsKey = useMemo(() => {
    if (currentCategory?.key !== "all" || filteredCourses.length === 0) {
      return "";
    }
    return filteredCourses
      .map(
        (course) =>
          `${course.start_latitude.toFixed(6)},${course.start_longitude.toFixed(6)}`
      )
      .sort()
      .join("|");
  }, [currentCategory?.key, filteredCourses]);

  // 전체 카테고리일 때 선택된 코스들에서 동 이름 추출
  useEffect(() => {
    if (coordsKey && filteredCourses.length > 0) {
      console.log(`🔍 Requesting dongs for coords key: ${coordsKey}`);
      getDongsFromCourses(filteredCourses).then(setDongNames);
    } else {
      setDongNames([]);
    }
  }, [coordsKey]); // filteredCourses 제거하여 무한 루프 방지

  // 카테고리가 없을 때 안전 장치
  if (!categories || categories.length === 0) {
    return null;
  }

  // 카테고리 변경 함수
  const goToPrevCategory = () => {
    if (currentCategoryIndex > 0) {
      const newIndex = currentCategoryIndex - 1;
      setCurrentCategoryIndex(newIndex);
      onCategoryChange?.(categories[newIndex].key); // 지도에 카테고리 변경 알림
    } else {
      console.log("Cannot go to previous category - already at first");
    }
  };

  const goToNextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      const newIndex = currentCategoryIndex + 1;
      setCurrentCategoryIndex(newIndex);
      onCategoryChange?.(categories[newIndex].key); // 지도에 카테고리 변경 알림
    } else {
      console.log("Cannot go to next category - already at last");
    }
  };

  // 카테고리 스와이프 핸들러 (좌우 드래그)
  const handleCategorySwipe = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThreshold = 50;
    // 드래그 거리가 임계값보다 작으면 무시
    if (Math.abs(info.offset.x) < swipeThreshold) {
      // 위치 강제 리셋
      setDragKey((prev) => prev + 1);
      return;
    }

    if (info.offset.x > swipeThreshold) {
      // 오른쪽 스와이프 - 이전 카테고리
      goToPrevCategory();
    } else if (info.offset.x < -swipeThreshold) {
      // 왼쪽 스와이프 - 다음 카테고리
      goToNextCategory();
    }

    // 카테고리 변경 후 위치 리셋
    setDragKey((prev) => prev + 1);
  };

  // 헤더 드래그 핸들러 (아래로 드래그하여 닫기)
  const handleHeaderDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const closeThreshold = 100;

    // 아래로 충분히 드래그하면 바텀시트 닫기
    if (info.offset.y > closeThreshold) {
      onClose();
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
            key={`${currentCategory?.key}-${dragKey}`}
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col max-h-[85vh] rounded-t-[45px]"
            style={{ backgroundColor: currentDesign.backgroundColor }}
            onClick={(e) => e.stopPropagation()}
            drag="x"
            dragConstraints={{ left: -100, right: 100 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
              setIsDragging(false);
              handleCategorySwipe(e, info);
            }}
          >
            {/* 헤더 */}
            <motion.div
              className="p-4 pb-2 cursor-grab active:cursor-grabbing"
              drag="y"
              dragConstraints={{ top: 0, bottom: 200 }}
              dragElastic={0.2}
              onDragEnd={handleHeaderDrag}
            >
              {/* 드래그 핸들 */}
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1 bg-white bg-opacity-50 rounded-full"></div>
              </div>

              {/* X 버튼 제거 - PDF에는 없음 */}

              {/* 카테고리 타이틀 - 왼쪽 정렬, 검정색 */}
              <div className="text-left mb-4">
                <h2 className="text-category text-black whitespace-pre-line">
                  {currentCategory?.key === "all"
                    ? dongNames.length > 0
                      ? `${dongNames.join(", ")}\n러닝`
                      : "전체\n러닝"
                    : `${currentCategory?.name}\n러닝`}
                </h2>
              </div>
            </motion.div>

            {/* 코스 카드들 - PDF 시안별 구조 */}
            <div
              className={`flex-1 ${filteredCourses.length >= 3 ? "overflow-y-auto" : "overflow-hidden"} min-h-0`}
            >
              <div
                className="relative w-full"
                style={{
                  height: "250px", // 카드 개수와 상관없이 항상 250px 고정
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
                      // 세번째카드 이후(맨위): 130px, 상단 좌우 라운드, 조금만 보임
                      cardHeight = "130px";
                      cardBottom = `${-100 + (index - 2) * 25}px`; // 원래대로 -100px, 간격 25px로 조정
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
                            {course.category_name} 러닝 코스
                          </p>
                          <p className="text-sm text-black">
                            {course.difficulty === "easy" && "쉬움"}
                            {course.difficulty === "medium" && "보통"}
                            {course.difficulty === "hard" && "어려움"}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="flex items-baseline">
                            <span className="text-4xl font-bold text-black">
                              {Math.round(course.distance_km)}
                            </span>
                            <span className="text-lg text-black ml-1">km</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
