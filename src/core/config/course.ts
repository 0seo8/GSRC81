/**
 * 코스 관련 상수 및 유틸리티
 */

export const DIFFICULTY_LABELS = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
} as const;

export const DIFFICULTY_COLORS = {
  easy: "bg-gray-100 text-gray-800",
  medium: "bg-gray-200 text-gray-800",
  hard: "bg-gray-300 text-gray-800",
} as const;

export type Difficulty = keyof typeof DIFFICULTY_LABELS;

export function getDifficultyLabel(difficulty: string): string {
  return (
    DIFFICULTY_LABELS[difficulty as Difficulty] || DIFFICULTY_LABELS.medium
  );
}

export function getDifficultyColor(difficulty: string): string {
  return (
    DIFFICULTY_COLORS[difficulty as Difficulty] || DIFFICULTY_COLORS.medium
  );
}

// 기본 fallback 텍스트
export const DEFAULT_COURSE_DESCRIPTION =
  "진관천을 한 바퀴 왕복해 도는 코스입니다. 정기런 때 뛰는 코스이기도 해요! 접근하기 좋아 자주 벙이 열리는 장소입니다. 모두 같이 즐겁게 달려봐요!";

export const EMPTY_COURSE_MESSAGE = {
  title: "등록된 코스가 없습니다",
  description: "새로운 러닝 코스를 등록해보세요",
} as const;
