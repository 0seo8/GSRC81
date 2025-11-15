export interface CardLayout {
  height: string;
  bottom: string;
  borderRadius: string;
  zIndex: number;
}

/**
 * 코스 개수에 따른 카드 레이아웃 계산 (rem 단위)
 * PDF 시안: 바텀시트 하단부터 딱 붙어서 시작하는 스택 구조 (bottom: 0부터 시작)
 * - 1개: 8.125rem 높이 (130px ÷ 16 = 8.125rem)
 * - 2개: 12.5rem 높이 (200px ÷ 16 = 12.5rem)
 * - 3개+: 16.25rem + 추가 카드마다 1.875rem (260px + 30px ÷ 16)
 */
export function calculateCardLayout(
  courseIndex: number,
  totalCourses: number
): CardLayout {
  if (totalCourses === 1) {
    // 1개: 8.125rem 높이, 전체 라운드 2.8125rem, 바텀0부터 시작
    return {
      height: "8.125rem",
      bottom: "0",
      borderRadius: "2.8125rem",
      zIndex: 1,
    };
  }

  if (totalCourses === 2) {
    if (courseIndex === 0) {
      // 첫번째카드: 180px, 위에 위치, 낮은 z-index, 상단만 라운드
      return {
        height: "11.25rem", // 180px ÷ 16 = 11.25rem
        bottom: "4.375rem", // 70px ÷ 16 = 4.375rem
        borderRadius: "2.8125rem 2.8125rem 0 0",
        zIndex: 1, // 낮은 z-index
      };
    } else {
      // 두번째카드: 130px, 바텀0에 딱 붙음, 높은 z-index, 전체 라운드
      return {
        height: "8.125rem", // 130px ÷ 16 = 8.125rem
        bottom: "0",
        borderRadius: "2.8125rem",
        zIndex: 2, // 높은 z-index
      };
    }
  }

  // 3개 이상 - 2개 패턴 확장 (맨 아래만 130px+전체라운드, 나머지는 180px+상단라운드)
  if (totalCourses === 3) {
    if (courseIndex === 0) {
      // 카드3: 180px, 맨 위에 위치, 상단만 라운드
      return {
        height: "11.25rem", // 180px ÷ 16 = 11.25rem
        bottom: "8.75rem", // 140px ÷ 16 = 8.75rem
        borderRadius: "2.8125rem 2.8125rem 0 0",
        zIndex: 1, // 낮은 z-index
      };
    } else if (courseIndex === 1) {
      // 카드2: 180px, 중간에 위치, 상단만 라운드
      return {
        height: "11.25rem", // 180px ÷ 16 = 11.25rem
        bottom: "4.375rem", // 70px ÷ 16
        borderRadius: "2.8125rem 2.8125rem 0 0",
        zIndex: 2,
      };
    } else {
      // 카드1: 130px, 바텀0에 딱 붙음, 전체 라운드 (2개일때와 동일)
      return {
        height: "8.125rem", // 130px ÷ 16 = 8.125rem
        bottom: "0",
        borderRadius: "2.8125rem",
        zIndex: 3, // 높은 z-index
      };
    }
  }

  // 4개 이상 - 모든 카드가 130px 높이로 70px씩 겹쳐진 스택 구조
  const cardBottom = courseIndex * 4.375; // 70px ÷ 16 = 4.375rem씩 위로
  
  return {
    height: "8.125rem", // 130px ÷ 16 = 8.125rem (모든 카드 동일 높이)
    bottom: `${cardBottom}rem`, // 70px씩 위로 쌓임
    borderRadius: "2.8125rem", // 4모서리 둥근
    zIndex: totalCourses - courseIndex, // 위에 있을수록 낮은 z-index
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