import { useState, useEffect } from "react";
import { CourseCategory } from "@/shared/lib/courses-data";
import { CourseForMap } from "@/lib/supabase/repositories/courseRepository";
import { getDongsFromCourses } from "@/shared/lib/location-utils";

interface UseCategoryNavigationProps {
  categories: CourseCategory[];
  initialCategory?: string;
  onCategoryChange?: (categoryKey: string) => void;
  filteredCourses: CourseForMap[];
}

/**
 * 카테고리 정보 및 동 이름 추출 훅
 *
 * 주요 기능:
 * - 현재 카테고리 정보 관리
 * - "전체" 카테고리일 때 코스들의 동 이름 추출
 */
export function useCategoryNavigation({
  categories,
  initialCategory = "jingwan",
  filteredCourses,
}: UseCategoryNavigationProps) {
  const [currentCategoryIndex] = useState(
    categories.findIndex((cat) => cat.key === initialCategory) || 0,
  );
  const [dongNames, setDongNames] = useState<string[]>([]);

  const currentCategory = categories[currentCategoryIndex];

  // 동 이름 추출 (전체 카테고리일 때만)
  useEffect(() => {
    if (currentCategory?.key === "all" && filteredCourses.length > 0) {
      getDongsFromCourses(filteredCourses).then(setDongNames);
    } else {
      setDongNames([]);
    }
  }, [currentCategory?.key, filteredCourses]);

  return {
    currentCategory,
    dongNames,
  };
}
