export interface CardLayout {
  height: string;
  bottom: string;
  borderRadius: string;
  zIndex: number;
}

/**
 * 코스 개수에 따른 카드 레이아웃 계산 (rem 단위)
 * 사용자 요구사항:
 * - 1개: 130px(8.125rem), 전체 둥근 모서리
 * - 2개: 1번째(130px/8.125rem, 전체 둥근) + 2번째(180px/11.25rem, 위쪽만 둥근), 87px(5.4375rem) 간격
 * - 3개: 1번째(124px/7.75rem, 전체 둥근, 6px만 보임) + 2번째(136px/8.5rem, 위쪽만 둥근) + 3번째(180px/11.25rem, 위쪽만 둥근)
 */
export function calculateCardLayout(
  courseIndex: number,
  totalCourses: number
): CardLayout {
  if (totalCourses === 1) {
    // 1개: 130px(8.125rem), 전체 둥근 모서리
    return {
      height: "8.125rem", // 130px ÷ 16
      bottom: "0",
      borderRadius: "2.8125rem", // 전체 둥근
      zIndex: 1,
    };
  }

  if (totalCourses === 2) {
    if (courseIndex === 0) {
      // 1번째 카드: 130px(8.125rem), 전체 둥근, 최상단
      return {
        height: "8.125rem", // 130px ÷ 16
        bottom: "0", 
        borderRadius: "2.8125rem", // 전체 둥근
        zIndex: 2, // 위에 표시
      };
    } else {
      // 2번째 카드: 180px(11.25rem), 위쪽만 둥근, 1번째 아래, 87px(5.4375rem) 간격
      return {
        height: "11.25rem", // 180px ÷ 16
        bottom: "5.4375rem", // 87px ÷ 16 = 5.4375rem
        borderRadius: "2.8125rem 2.8125rem 0 0", // 위쪽만 둥근
        zIndex: 1, // 아래 표시
      };
    }
  }

  if (totalCourses >= 3) {
    // 3개 이상: 첫 번째(-80px), 두 번째(0), 세 번째(142px), 그 이후 87px씩 간격
    if (courseIndex === 0) {
      // 1번째 카드: 130px(8.125rem), 전체 둥근, 컨테이너 바닥 아래
      return {
        height: "8.125rem", // 130px ÷ 16
        bottom: "-5rem", // -80px ÷ 16
        borderRadius: "2.8125rem", // 전체 둥근
        zIndex: totalCourses, // 가장 높은 z-index
      };
    } else if (courseIndex === 1) {
      // 2번째 카드: 180px(11.25rem), 위쪽만 둥근, 컨테이너 바닥
      return {
        height: "11.25rem", // 180px ÷ 16
        bottom: "0",
        borderRadius: "2.8125rem 2.8125rem 0 0", // 위쪽만 둥근
        zIndex: totalCourses - courseIndex,
      };
    } else {
      // 3번째 이상 카드: 180px(11.25rem), 위쪽만 둥근, 8.875rem부터 87px씩 간격
      const cardBottom = 8.875 + (courseIndex - 2) * 5.4375; // 142px부터 87px씩
      return {
        height: "11.25rem", // 180px ÷ 16
        bottom: `${cardBottom}rem`,
        borderRadius: "2.8125rem 2.8125rem 0 0", // 위쪽만 둥근
        zIndex: totalCourses - courseIndex, // 뒤로 갈수록 낮은 z-index
      };
    }
  }

  // 기본값 (도달하지 않는 코드)
  return {
    height: "8.125rem",
    bottom: "0",
    borderRadius: "2.8125rem",
    zIndex: 1,
  };
}

/**
 * 카드 그림자 스타일 계산
 */
export function calculateCardShadow(index: number): string {
  return `0 ${4 + index * 2}px ${12 + index * 4}px rgba(0,0,0,0.15)`;
}

/**
 * 난이도 텍스트 변환
 */
export function getDifficultyText(difficulty: string): string {
  switch (difficulty) {
    case "easy":
      return "쉬움";
    case "medium":
      return "보통";
    case "hard":
      return "어려움";
    default:
      return "보통";
  }
}