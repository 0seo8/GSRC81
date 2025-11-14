import { useState, useCallback, useEffect } from "react";
import { CourseCategory, CourseWithComments } from "@/lib/courses-data";
import { getDongsFromCourses } from "@/lib/location-utils";

interface UseCategoryNavigationProps {
  categories: CourseCategory[];
  initialCategory?: string;
  onCategoryChange?: (categoryKey: string) => void;
  filteredCourses: CourseWithComments[];
}

export function useCategoryNavigation({
  categories,
  initialCategory = "jingwan",
  onCategoryChange,
  filteredCourses,
}: UseCategoryNavigationProps) {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(
    categories.findIndex((cat) => cat.key === initialCategory) || 0
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [dongNames, setDongNames] = useState<string[]>([]);

  const currentCategory = categories[currentCategoryIndex];

  // 카테고리 변경 함수들
  const goToPrevCategory = useCallback(() => {
    console.log('goToPrevCategory called, current index:', currentCategoryIndex);
    // 무한 루프: 첫 번째에서 이전으로 가면 마지막으로
    const newIndex = currentCategoryIndex > 0 
      ? currentCategoryIndex - 1 
      : categories.length - 1;
    console.log('Changing to previous category, new index:', newIndex, 'category:', categories[newIndex]?.key);
    setCurrentCategoryIndex(newIndex);
    setCurrentCardIndex(0);
    onCategoryChange?.(categories[newIndex].key);
  }, [currentCategoryIndex, categories, onCategoryChange]);

  const goToNextCategory = useCallback(() => {
    console.log('goToNextCategory called, current index:', currentCategoryIndex);
    // 무한 루프: 마지막에서 다음으로 가면 첫 번째로
    const newIndex = currentCategoryIndex < categories.length - 1
      ? currentCategoryIndex + 1
      : 0;
    console.log('Changing to next category, new index:', newIndex, 'category:', categories[newIndex]?.key);
    setCurrentCategoryIndex(newIndex);
    setCurrentCardIndex(0);
    onCategoryChange?.(categories[newIndex].key);
  }, [currentCategoryIndex, categories, onCategoryChange]);

  const handleCategoryChange = useCallback((direction: "prev" | "next") => {
    if (direction === "prev") {
      goToPrevCategory();
    } else {
      goToNextCategory();
    }
  }, [goToPrevCategory, goToNextCategory]);

  // 동 이름 추출 (전체 카테고리일 때만)
  useEffect(() => {
    if (currentCategory?.key === "all" && filteredCourses.length > 0) {
      console.log(`🔍 Requesting dongs for ${filteredCourses.length} courses`);
      getDongsFromCourses(filteredCourses).then(setDongNames);
    } else {
      setDongNames([]);
    }
  }, [currentCategory?.key, filteredCourses]);

  return {
    currentCategoryIndex,
    currentCardIndex,
    currentCategory,
    dongNames,
    setCurrentCardIndex,
    handleCategoryChange,
  };
}