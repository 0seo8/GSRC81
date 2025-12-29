export interface CategoryDesign {
  backgroundColor: string;
  cardColors: readonly string[];
  markerColor: string;
}

export const CATEGORY_DESIGNS = {
  // 전체 - 베이지 배경 + 노랑/그린/브라운 카드 + 검정 마커
  all: {
    backgroundColor: "#EBE7E4",
    cardColors: ["#FCFC60", "#78A893", "#8F806E"],
    markerColor: "#000000", // 검정색
  },
  // 트랙러닝 - 브라운 배경 + 레드/화이트/브라운 카드 + 레드 마커
  track: {
    backgroundColor: "#957E74",
    cardColors: ["#D04836", "#FCFEF2", "#8F806E"],
    markerColor: "#D04836", // 레드 (카드 첫번째 색상)
  },
  // 트레일러닝 - 다크그린 배경 + 그린/베이지/회그린 카드 + 그린 마커
  trail: {
    backgroundColor: "#758169",
    cardColors: ["#78A893", "#E5E4D4", "#697064"],
    markerColor: "#78A893", // 그린 (카드 첫번째 색상)
  },
  // 로드러닝 - 그레이 배경 + 노랑/그린/브라운 카드 + 노랑 마커
  road: {
    backgroundColor: "#BBBBBB",
    cardColors: ["#FCFC60", "#E0E0E0", "#7A7A7A"],
    markerColor: "#7A7A7A", // 노랑 (카드 첫번째 색상)
  },
} as const;

export type CategoryKey = keyof typeof CATEGORY_DESIGNS;

export function getCategoryDesign(categoryKey?: string): CategoryDesign {
  const key = (categoryKey as CategoryKey) || "all";

  return CATEGORY_DESIGNS[key] || CATEGORY_DESIGNS.all;
}

/**
 * 코스의 카테고리에 맞는 카드 색상을 반환
 * "전체" 카테고리에서는 각 코스의 원래 카테고리 색상을 사용하되,
 * 같은 카테고리가 연속되면 다른 색상을 순환하여 사용
 */
export function getCardColorForCourse(
  courseCategoryKey: string | undefined,
  currentCategoryKey: string,
  cardIndex: number,
  previousCourseCategoryKey?: string | undefined,
): string {
  // "전체" 카테고리가 아니면 현재 카테고리의 색상 배열에서 순환
  if (currentCategoryKey !== "all") {
    const design = getCategoryDesign(currentCategoryKey);
    return design.cardColors[cardIndex % design.cardColors.length];
  }

  // "전체" 카테고리인 경우, 코스의 원래 카테고리 색상 사용
  const courseKey = (courseCategoryKey as CategoryKey) || "all";
  const design = CATEGORY_DESIGNS[courseKey] || CATEGORY_DESIGNS.all;

  // 이전 카드와 같은 카테고리인지 확인
  const isSameCategoryAsPrevious =
    previousCourseCategoryKey === courseCategoryKey;

  if (!isSameCategoryAsPrevious) {
    // 다른 카테고리면 첫 번째 색상 사용
    return design.cardColors[0];
  }

  // 같은 카테고리가 연속되면, 카드 인덱스 기반으로 색상 순환
  // 연속된 같은 카테고리의 카드 개수를 추적하기 위해 cardIndex 활용
  return design.cardColors[cardIndex % design.cardColors.length];
}
