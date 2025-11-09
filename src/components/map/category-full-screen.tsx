"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    const currentCategoryKey = categories.find(cat => cat.key === initialCategory)?.key;
    
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
        (course) =>
          (course.category_key || "jingwan") === currentCategoryKey
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
  const {
    isDragging,
    dragKey,
    handleHeaderDrag,
    handleDragStart,
    handleDragEnd,
  } = useBottomSheetDrag({
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
          >
            {/* 헤더 */}
            <BottomSheetHeader
              categoryName={currentCategory?.name}
              dongNames={dongNames}
              isAllCategory={currentCategory?.key === "all"}
              onHeaderDrag={handleHeaderDrag}
            />

            {/* 코스 카드 스택 */}
            <RefactoredCourseCardStack
              courses={filteredCourses}
              cardColors={currentDesign.cardColors}
              isDragging={isDragging}
              onCourseClick={onCourseClick}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}