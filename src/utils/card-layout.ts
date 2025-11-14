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

  // 3개 이상 - 위 위 아래 구조
  if (totalCourses === 3) {
    if (courseIndex === 0) {
      // 위 카드 1: 가장 위에 위치, 4모서리 둥근
      return {
        height: "8.125rem", // 130px ÷ 16
        bottom: "15.625rem", // 250px ÷ 16 (두 번째 + 세 번째 카드 위에)
        borderRadius: "2.8125rem", // 4모서리 둥근
        zIndex: 3,
      };
    } else if (courseIndex === 1) {
      // 위 카드 2: 중간에 위치, 두모서리 둥근
      return {
        height: "11.25rem", // 180px ÷ 16
        bottom: "4.375rem", // 70px ÷ 16 (세 번째 카드 위에)
        borderRadius: "2.8125rem 2.8125rem 0 0", // 두모서리 둥근
        zIndex: 2,
      };
    } else {
      // 아래 카드 3: 바텀에 붙음, 일부만 보임, 4모서리 둥근
      return {
        height: "11.25rem", // 180px ÷ 16
        bottom: "0",
        borderRadius: "2.8125rem", // 4모서리 둥근
        zIndex: 1,
      };
    }
  }

  // 4개 이상 - 3개와 동일한 구조, 추가 카드들은 아래로 계속 쌓임
  if (courseIndex === 0) {
    // 위 카드 1: 가장 위에 위치, 4모서리 둥근 (3개와 동일)
    return {
      height: "8.125rem", // 130px ÷ 16
      bottom: "15.625rem", // 250px ÷ 16
      borderRadius: "2.8125rem", // 4모서리 둥근
      zIndex: totalCourses,
    };
  } else if (courseIndex === 1) {
    // 위 카드 2: 중간에 위치, 두모서리 둥근 (3개와 동일)
    return {
      height: "11.25rem", // 180px ÷ 16
      bottom: "4.375rem", // 70px ÷ 16
      borderRadius: "2.8125rem 2.8125rem 0 0", // 두모서리 둥근
      zIndex: totalCourses - 1,
    };
  } else {
    // 아래 카드들: 계속 쌓임, 스크롤로 보임
    const isLastCard = courseIndex === totalCourses - 1;
    const cardOffset = (courseIndex - 2) * 11.25; // 3번째 카드부터 180px씩 아래로
    
    return {
      height: "11.25rem", // 180px ÷ 16
      bottom: `${-cardOffset}rem`, // 음수로 아래쪽에 배치
      borderRadius: "2.8125rem", // 4모서리 둥근
      zIndex: totalCourses - courseIndex,
    };
  }
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