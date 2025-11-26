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
 * 난이도 값을 한글 레이블로 변환합니다
 * @param difficulty - 난이도 값 ('easy' | 'medium' | 'hard')
 * @returns 한글 난이도 레이블
 */
export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: "쉬움",
    medium: "보통",
    hard: "어려움",
  };

  return labels[difficulty] || "보통";
}
