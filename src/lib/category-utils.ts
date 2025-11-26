import { type CourseCategory } from "@/lib/courses-data";

/**
 * "전체" 카테고리 정의
 */
const ALL_CATEGORY: CourseCategory = {
  id: "all",
  key: "all",
  name: "전체",
  description: "모든 코스",
  sort_order: 0,
  is_active: true,
  created_at: new Date().toISOString(),
};

/**
 * 카테고리 목록에 "전체" 카테고리를 추가
 *
 * @param categories - 원본 카테고리 목록
 * @returns "전체" 카테고리가 포함된 카테고리 목록
 */
export function addAllCategory(categories: CourseCategory[]): CourseCategory[] {
  return [ALL_CATEGORY, ...categories];
}

/**
 * 카테고리 키로 카테고리 찾기
 */
export function findCategoryByKey(
  categories: CourseCategory[],
  key: string,
): CourseCategory | undefined {
  return categories.find((cat) => cat.key === key);
}
