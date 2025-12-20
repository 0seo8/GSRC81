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
    cardColors: ["#FCFC60", "#78A893", "#8F806E"],
    markerColor: "#FCFC60", // 노랑 (카드 첫번째 색상)
  },
} as const;

export type CategoryKey = keyof typeof CATEGORY_DESIGNS;

export function getCategoryDesign(categoryKey?: string): CategoryDesign {
  const key = (categoryKey as CategoryKey) || "all";

  return CATEGORY_DESIGNS[key] || CATEGORY_DESIGNS.all;
}
