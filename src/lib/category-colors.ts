/**
 * 카테고리별 마커 색상 매핑
 */
export const CATEGORY_COLORS: Record<string, string> = {
  jingwan: "#78A893", // 진관동러닝 - 초록색
  track: "#D04836", // 트랙러닝 - 빨간색
  trail: "#78A893", // 트레일러닝 - 초록색
  road: "#7A7A7A", // 로드러닝 - 회색
  all: "#000000", // 전체 카테고리 - 검정색
} as const;

/**
 * 카테고리 키로 마커 색상 반환
 */
export function getCategoryColor(categoryKey: string): string {
  return CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.jingwan;
}