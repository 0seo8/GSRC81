"use client";

import { useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  type CourseWithComments,
  type CourseCategory,
} from "@/shared/lib/courses-data";
import { getCategoryDesign } from "@/core/config/category-designs";
import { useBottomSheetDrag } from "@/features/map/hooks/use-bottom-sheet-drag";
import { useCategoryNavigation } from "@/features/map/hooks/use-category-navigation";
import { BottomSheetHeader } from "@/features/map/components/bottom-sheet-header";
import { RefactoredCourseCardStack } from "@/features/map/components/refactored-course-card-stack";

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

export function CategoryFullScreen({
  isOpen,
  onClose,
  courses: _courses,
  categories,
  initialCategory = "jingwan",
  onCourseClick,
  onCategoryChange,
  selectedCourse,
  selectedCourses,
}: CategoryFullScreenProps) {
  const filteredCourses = useMemo(() => {
    // 마커 또는 클러스터를 클릭했을 때는 항상 선택된 코스만 표시
    if (selectedCourses && selectedCourses.length > 0) {
      return selectedCourses;
    }
    if (selectedCourse) {
      return [selectedCourse];
    }
    // 선택된 코스가 없는 경우 (일반적으로 발생하지 않아야 함)
    return [];
  }, [selectedCourses, selectedCourse]);

  // 카테고리 네비게이션 훅
  const {
    currentCategoryIndex,
    currentCategory,
    dongNames,
    handleCategoryChange,
  } = useCategoryNavigation({
    categories,
    initialCategory,
    onCategoryChange,
    filteredCourses,
  });

  // 드래그 핸들링 훅
  const { isDragging, handleHeaderDrag, snapManager } = useBottomSheetDrag({
    onClose,
    onCategoryChange: handleCategoryChange,
    currentCategoryIndex,
    totalCategories: categories.length,
  });

  // 디자인 설정
  const currentDesign = getCategoryDesign(currentCategory?.key);

  // 스크롤 컨테이너 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 바텀시트가 열릴 때 snapPoint를 medium으로 초기화
  useEffect(() => {
    if (isOpen) {
      snapManager.setSnapPoint("medium");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // isOpen이 변경될 때만 실행

  // 스크롤로 전체화면 전환 기능 (마우스 휠)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = (e: WheelEvent) => {
      const isAtTop = scrollContainer.scrollTop === 0;
      const isScrollingUp = e.deltaY < 0;
      const isMediumSize = snapManager.snapPoint === "medium";

      // 맨 위에서 위로 스크롤하면 전체화면으로 확장
      if (isAtTop && isScrollingUp && isMediumSize) {
        e.preventDefault();
        snapManager.snapToNext();
      }
    };

    scrollContainer.addEventListener("wheel", handleScroll, { passive: false });

    return () => {
      scrollContainer.removeEventListener("wheel", handleScroll);
    };
  }, [snapManager]);

  // 터치 스크롤로 전체화면 전환 기능 (모바일)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let touchStartY = 0;
    let scrollTopAtTouchStart = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      scrollTopAtTouchStart = scrollContainer.scrollTop;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchCurrentY = e.touches[0].clientY;
      const touchDeltaY = touchCurrentY - touchStartY;
      const isAtTop = scrollTopAtTouchStart === 0;
      const isScrollingUp = touchDeltaY > 30; // 30px 이상 아래로 드래그 (위로 스크롤)
      const isMediumSize = snapManager.snapPoint === "medium";

      // 맨 위에서 위로 스크롤하면 전체화면으로 확장
      if (isAtTop && isScrollingUp && isMediumSize) {
        snapManager.snapToNext();
      }
    };

    scrollContainer.addEventListener("touchstart", handleTouchStart, { passive: true });
    scrollContainer.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      scrollContainer.removeEventListener("touchstart", handleTouchStart);
      scrollContainer.removeEventListener("touchmove", handleTouchMove);
    };
  }, [snapManager]);

  // 카테고리가 없을 때 안전 장치
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* 투명 백드롭 - 바깥 클릭 시 닫기 */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              // 마커를 클릭한 경우가 아니면 닫기
              const target = e.target as HTMLElement;
              if (!target.closest('.mapboxgl-marker')) {
                onClose();
              }
            }}
          />

          {/* 바텀시트 메인 컨테이너 */}
          <motion.div
            className={`fixed bottom-2 left-2 right-2 z-50 flex flex-col ${
              filteredCourses.length <= 2
                ? "rounded-[2.8125rem]"  // 1-2개: 전체 둥근 (모든 카드 보임)
                : "rounded-t-[2.8125rem]"  // 3개 이상: 위만 둥근 (스크롤 필요)
            }`}
            initial={{ height: "0vh" }}
            animate={{
              height: snapManager.getSnapHeight(snapManager.snapPoint),
            }}
            exit={{ height: "0vh" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            style={{
              backgroundColor: currentDesign.backgroundColor,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="shrink-0">
              <BottomSheetHeader
                categoryName={currentCategory?.name}
                dongNames={dongNames}
                isAllCategory={currentCategory?.key === "all"}
                onHeaderDrag={handleHeaderDrag}
              />
            </div>

            {/* 카드 스크롤 영역 */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-[0.4375rem] pb-0 flex flex-col justify-end">
              <RefactoredCourseCardStack
                courses={filteredCourses}
                cardColors={currentDesign.cardColors}
                isDragging={isDragging}
                onCourseClick={onCourseClick}
                isExpanded={snapManager.snapPoint === "full"}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}