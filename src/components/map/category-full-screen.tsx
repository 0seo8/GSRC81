"use client";

import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import {
  type CourseWithComments,
  type CourseCategory,
} from "@/lib/courses-data";
import { getCategoryDesign } from "@/config/category-designs";
import { useBottomSheetDrag } from "@/hooks/use-bottom-sheet-drag";
import { useCategoryNavigation } from "@/hooks/use-category-navigation";
import { BottomSheetHeader } from "./bottom-sheet-header";
import { RefactoredCourseCardStack } from "./refactored-course-card-stack";

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
  courses,
  categories,
  initialCategory = "jingwan",
  onCourseClick,
  onCategoryChange,
  selectedCourse,
  selectedCourses,
}: CategoryFullScreenProps) {
  // 현재 카테고리의 코스들 필터링 (memoized)
  const filteredCourses = useMemo(() => {
    const currentCategoryKey = categories.find(
      (cat) => cat.key === initialCategory
    )?.key;

    if (currentCategoryKey === "all") {
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
        (course) => (course.category_key || "jingwan") === currentCategoryKey
      );
    }
  }, [initialCategory, selectedCourses, selectedCourse, courses, categories]);

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
  const { isDragging, handleHeaderDrag } = useBottomSheetDrag({
    onClose,
    onCategoryChange: handleCategoryChange,
    currentCategoryIndex,
    totalCategories: categories.length,
  });

  // 디자인 설정
  const currentDesign = getCategoryDesign(currentCategory?.key);

  // 카테고리가 없을 때 안전 장치
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 투명 백드롭 - 바깥 클릭 시 닫기 */}
          <div className="fixed inset-0 z-40" onClick={onClose} />

          {/* 바텀시트 메인 컨테이너 */}
          <div
            className="fixed bottom-2 left-2 right-2 z-50 rounded-t-[45px] flex flex-col h-[50vh]"
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
            <div className="flex-1 overflow-y-auto px-0 pb-0">
              <RefactoredCourseCardStack
                courses={filteredCourses}
                cardColors={currentDesign.cardColors}
                isDragging={isDragging}
                onCourseClick={onCourseClick}
              />
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
