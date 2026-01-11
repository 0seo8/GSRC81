"use client";

import { useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type CourseCategory } from "@/shared/lib/courses-data";
import { type CourseWithCategory } from "@/lib/supabase/repositories/courseRepository";
import { getCategoryDesign } from "@/core/config/category-designs";
import { useBottomSheetDrag } from "@/features/map/hooks/use-bottom-sheet-drag";
import { useCategoryNavigation } from "@/features/map/hooks/use-category-navigation";
import { BottomSheetHeader } from "@/features/map/components/bottom-sheet-header";
import { RefactoredCourseCardStack } from "@/features/map/components/refactored-course-card-stack";

type SnapPoint = "closed" | "medium" | "full";

interface CategoryFullScreenProps {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseWithCategory[];
  categories: CourseCategory[];
  initialCategory?: string;
  onCourseClick: (courseId: string) => void;
  onCategoryChange?: (categoryKey: string) => void;
  onSnapPointChange?: (snapPoint: SnapPoint) => void;
  selectedCourse?: CourseWithCategory | null;
  selectedCourses?: CourseWithCategory[];
}

export function CategoryFullScreen({
  isOpen,
  onClose,
  categories,
  initialCategory = "jingwan",
  onCourseClick,
  onCategoryChange,
  onSnapPointChange,
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

  // 실제 선택된 코스의 카테고리를 결정
  const actualCategory = useMemo(() => {
    // 사용자가 "전체" 카테고리를 선택했다면, 항상 "all"로 유지
    if (initialCategory === "all") {
      return categories.find((cat) => cat.key === "all") || categories[0];
    }

    // 특정 카테고리 선택 시에만 선택된 코스의 카테고리 사용
    if (filteredCourses.length > 0) {
      const categoryKey =
        filteredCourses[0].course_categories?.key || "jingwan";
      return categories.find((cat) => cat.key === categoryKey) || categories[0];
    }

    // 선택된 코스가 없으면 initialCategory 사용 (fallback)
    return (
      categories.find((cat) => cat.key === initialCategory) || categories[0]
    );
  }, [filteredCourses, categories, initialCategory]);

  // 카테고리 네비게이션 훅 (스와이프 기능 제거로 인해 현재 카테고리 정보만 사용)
  const { currentCategory, dongNames } = useCategoryNavigation({
    categories,
    initialCategory: actualCategory.key,
    onCategoryChange,
    filteredCourses,
  });

  // 드래그 핸들링 훅 (스와이프 기능 제거, 상하 드래그만 지원)
  const { isDragging, handleHeaderDrag, snapManager } = useBottomSheetDrag({
    onClose,
  });

  // 디자인 설정 - 실제 카테고리 기반으로 가져오기
  const currentDesign = getCategoryDesign(actualCategory.key);

  // 스크롤 컨테이너 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 바텀시트가 열릴 때 snapPoint를 medium으로 초기화
  useEffect(() => {
    if (isOpen) {
      snapManager.setSnapPoint("medium");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // isOpen이 변경될 때만 실행

  // 스냅 포인트 변경 시 부모 컴포넌트에 알림 (마커 오프셋 계산용)
  useEffect(() => {
    onSnapPointChange?.(snapManager.snapPoint);
  }, [snapManager.snapPoint, onSnapPointChange]);

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
      const isScrollingUp = touchDeltaY > 30; // 1.875rem 이상 아래로 드래그 (위로 스크롤)
      const isMediumSize = snapManager.snapPoint === "medium";

      // 맨 위에서 위로 스크롤하면 전체화면으로 확장
      if (isAtTop && isScrollingUp && isMediumSize) {
        snapManager.snapToNext();
      }
    };

    scrollContainer.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    scrollContainer.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });

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
              if (!target.closest(".mapboxgl-marker")) {
                onClose();
              }
            }}
          />

          {/* 바텀시트 메인 컨테이너 */}
          <motion.div
            className={`fixed bottom-2 left-2 right-2 z-50 flex flex-col ${
              filteredCourses.length <= 2
                ? "rounded-[2.8125rem]" // 1-2개: 전체 둥근 (모든 카드 보임)
                : "rounded-t-[2.8125rem]" // 3개 이상: 위만 둥근 (스크롤 필요)
            }`}
            initial={{
              height: "0vh",
              opacity: 0,
              y: 50,
            }}
            animate={{
              height: snapManager.getSnapHeight(snapManager.snapPoint),
              opacity: 1,
              y: 0,
            }}
            exit={{
              height: "0vh",
              opacity: 0,
              y: 30,
              transition: {
                duration: 0.3,
                ease: [0.4, 0, 1, 1],
              },
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 280,
              opacity: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
              y: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
            }}
            style={{
              backgroundColor: currentDesign.backgroundColor,
              willChange: "height, opacity, transform",
              backfaceVisibility: "hidden",
              transform: "translate3d(0, 0, 0)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="shrink-0">
              <BottomSheetHeader
                categoryName={actualCategory?.name}
                dongNames={dongNames}
                isAllCategory={actualCategory?.key === "all"}
                onHeaderDrag={handleHeaderDrag}
              />
            </div>

            {/* 카드 스크롤 영역 */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-[0.4375rem] pb-0"
            >
              {/* mt-auto로 카드를 하단 정렬하면서 스크롤 시 헤더에 가려지지 않음 */}
              <div className="min-h-full flex flex-col justify-end">
                <RefactoredCourseCardStack
                  courses={filteredCourses}
                  cardColors={currentDesign.cardColors}
                  isDragging={isDragging}
                  onCourseClick={onCourseClick}
                  isExpanded={snapManager.snapPoint === "full"}
                  currentCategoryKey={actualCategory.key}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
