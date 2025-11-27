/**
 * 텍스트 처리 유틸리티 함수들
 */

/**
 * 코스 제목을 중간 지점에서 두 줄로 분할합니다
 * @param title - 분할할 제목
 * @returns [첫 번째 줄, 두 번째 줄] 튜플
 */
export function splitTitleAtMidpoint(title: string): [string, string] {
  const words = title.split(" ");

  // 단어가 1개면 분할하지 않음
  if (words.length <= 1) {
    return [title, ""];
  }

  const midIndex = Math.ceil(words.length / 2);

  return [words.slice(0, midIndex).join(" "), words.slice(midIndex).join(" ")];
}

/**
 * @deprecated Use getDifficultyLabel from @/lib/constants/course instead
 * 난이도 레이블은 @/lib/constants/course에서 가져오세요
 */
export function getDifficultyLabel(difficulty: string): string {
  // 하위 호환성을 위해 유지, 곧 제거 예정
  const labels: Record<string, string> = {
    easy: "쉬움",
    medium: "보통",
    hard: "어려움",
  };

  return labels[difficulty] || "보통";
}
