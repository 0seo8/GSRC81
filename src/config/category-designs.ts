// 카테고리별 디자인 매핑 설정

export interface CategoryDesign {
  backgroundColor: string;
  cardColors: readonly string[];
}

export const CATEGORY_DESIGNS = {
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

export type CategoryKey = keyof typeof CATEGORY_DESIGNS;

export function getCategoryDesign(categoryKey?: string): CategoryDesign {
  const key = categoryKey === "all" 
    ? "jingwan" 
    : (categoryKey as CategoryKey) || "jingwan";
  
  return CATEGORY_DESIGNS[key] || CATEGORY_DESIGNS.jingwan;
}