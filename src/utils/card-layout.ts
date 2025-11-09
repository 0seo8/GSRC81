export interface CardLayout {
  height: string;
  bottom: string;
  borderRadius: string;
  zIndex: number;
}

/**
 * 코스 개수에 따른 카드 레이아웃 계산
 * PDF 시안에 따른 스택 구조 구현
 */
export function calculateCardLayout(
  courseIndex: number,
  totalCourses: number
): CardLayout {
  if (totalCourses === 1) {
    // 1개: 130px 높이, 전체 라운드 45px
    return {
      height: "130px",
      bottom: "0px",
      borderRadius: "45px",
      zIndex: 1,
    };
  }

  if (totalCourses === 2) {
    if (courseIndex === 0) {
      // 첫번째카드(맨아래): 180px, 상단 좌우 라운드, 바닥에서 70px 떨어짐
      return {
        height: "180px",
        bottom: "70px",
        borderRadius: "45px 45px 0 0",
        zIndex: 1,
      };
    } else {
      // 두번째카드(위): 130px, 모든 라운드 45px, 맨 위
      return {
        height: "130px",
        bottom: "0px",
        borderRadius: "45px",
        zIndex: 2,
      };
    }
  }

  // 3개 이상
  if (courseIndex === 0) {
    // 첫번째카드(맨아래): 180px, 상단 좌우 라운드, 바닥에서 70px 떨어짐
    return {
      height: "180px",
      bottom: "70px",
      borderRadius: "45px 45px 0 0",
      zIndex: 1,
    };
  } else if (courseIndex === 1) {
    // 두번째카드(중간): 130px, 상단 좌우 라운드
    return {
      height: "130px",
      bottom: "0px",
      borderRadius: "45px 45px 0 0",
      zIndex: 2,
    };
  } else {
    // 세번째카드 이후(맨위): 130px, 상단 좌우 라운드, 조금만 보임
    return {
      height: "130px",
      bottom: `${-100 + (courseIndex - 2) * 25}px`,
      borderRadius: "45px 45px 0 0",
      zIndex: 2 + courseIndex,
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