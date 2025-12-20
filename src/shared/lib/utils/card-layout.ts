/**
 * 🎨 Figma 디자인 정확한 스펙 구현 (100% rem 단위)
 *
 * 디바이스: 390×844 (iPhone 12 Pro)
 * 바텀시트: 376×414
 * 측정 기준: Figma PDF 직접 측정
 *
 * 중요: 이 파일은 Figma 픽셀 측정값을 100% 반영합니다
 */

export interface CardLayout {
  height: string;
  bottom: string;
  borderRadius: string;
  zIndex: number;
}

// ========================================
// 🎯 Figma 정확한 스펙 상수 (rem 단위)
// ========================================

const FIGMA_CARD_SPECS = {
  // 카드 높이
  firstCard: 8.125, // 130px - 1번 카드 (모든 케이스 동일)
  secondCard_2: 11.25, // 180px - 2개일 때 2번 카드
  secondCard_3plus: 8.5, // 136px - 3개 이상일 때 2번 카드 ⭐
  thirdCard_3plus: 10.25, // 180px - 3개 이상일 때 3번+ 카드

  // 간격 (점진적 축소 규칙)
  overlap: 4.4375, // 87px - 카드 겹침 간격 (1-3개)
  mediumOverlap: 3.75, // 60px - 카드 4-6개일 때 간격 ⭐ 새 규칙
  minOverlap: 2.5, // 40px - 카드 7개 이상일 때 최소 간격 ⭐ 새 규칙
  bottomMargin_1: 0.5625, // 9px - 1개일 때 바닥 여백
  bottomMargin_2: 0.375, // 6px - 2개일 때 레이아웃 바닥 여백

  // 숨김
  hiddenOffset: -7, // -112px - 3개 이상일 때 1번 카드 숨김 ⭐

  // 모서리
  fullRadius: "2.8125rem", // 45px - 전체 모서리
  topRadius: "2.8125rem 2.8125rem 0 0", // 45px - 상단만
} as const;

/**
 * Figma 스펙대로 카드 레이아웃 계산
 */
export function calculateCardLayout(
  courseIndex: number,
  totalCourses: number,
): CardLayout {
  // ========================================
  // 1개 카드
  // ========================================
  if (totalCourses === 1) {
    return {
      height: `${FIGMA_CARD_SPECS.firstCard}rem`, // 130px
      bottom: `${FIGMA_CARD_SPECS.bottomMargin_1}rem`, // 9px 여백
      borderRadius: FIGMA_CARD_SPECS.fullRadius, // 전체 둥근
      zIndex: 1,
    };
  }

  // ========================================
  // 2개 카드
  // ========================================
  if (totalCourses === 2) {
    if (courseIndex === 0) {
      // 카드 1: 앞에 표시, 전체 둥근
      return {
        height: `${FIGMA_CARD_SPECS.firstCard}rem`, // 130px
        bottom: "0rem", // 바닥에 딱 붙음
        borderRadius: FIGMA_CARD_SPECS.fullRadius,
        zIndex: 2, // 위에 표시
      };
    } else {
      // 카드 2: 뒤에 표시, 위쪽만 둥근
      return {
        height: `${FIGMA_CARD_SPECS.secondCard_2}rem`, // 180px
        bottom: `${FIGMA_CARD_SPECS.overlap}rem`, // 87px 위에
        borderRadius: FIGMA_CARD_SPECS.topRadius,
        zIndex: 1, // 아래 표시
      };
    }
  }

  // ========================================
  // 3개 이상
  // ========================================
  if (courseIndex === 0) {
    // 카드 1: 완전 숨김, 전체 둥근, z-index 최고
    return {
      height: `${FIGMA_CARD_SPECS.firstCard}rem`, // 130px
      bottom: `${FIGMA_CARD_SPECS.hiddenOffset}rem`, // -112px
      borderRadius: FIGMA_CARD_SPECS.fullRadius,
      zIndex: totalCourses, // 가장 높은 z-index
    };
  }

  if (courseIndex === 1) {
    // 카드 2: 기준점(bottom: 0), 위쪽만 둥근
    // ⭐ 중요: 3개 이상일 때는 136px!
    return {
      height: `${FIGMA_CARD_SPECS.secondCard_3plus}rem`, // 136px
      bottom: "-1rem", // 기준점
      borderRadius: FIGMA_CARD_SPECS.topRadius,
      zIndex: totalCourses - courseIndex,
    };
  }

  // ========================================
  // 카드 3 이상: 점진적 간격 축소 규칙
  // ========================================
  // 공식: 다음 카드 bottom = 이전 카드 bottom + 이전 카드 height - 노출 간격
  // 이렇게 하면 "노출 간격"만큼만 보이고 나머지는 다음 카드에 가려짐

  const cardHeight = FIGMA_CARD_SPECS.thirdCard_3plus; // 180px (10.25rem)
  let cardBottom: number;

  if (courseIndex === 2) {
    // 카드 3: 기본 87px 간격 유지
    cardBottom = FIGMA_CARD_SPECS.overlap;
  } else if (courseIndex >= 3 && courseIndex <= 5) {
    // 카드 4-6: 60px씩 노출
    // 카드 3 기준점 = 87px
    // 각 카드는 이전 카드 상단에서 60px만 보이도록 배치
    const card3Top = FIGMA_CARD_SPECS.overlap + cardHeight; // 267px (87 + 180)
    const mediumGapCount = courseIndex - 2; // 카드4부터 개수 (1, 2, 3)

    // 반복 공식: bottomN = bottomN-1 + cardHeight - gap
    // bottom4 = 87 + 180 - 60 = 207
    // bottom5 = 207 + 180 - 60 = 327
    // bottom6 = 327 + 180 - 60 = 447
    cardBottom =
      card3Top -
      FIGMA_CARD_SPECS.mediumOverlap +
      (mediumGapCount - 1) * (cardHeight - FIGMA_CARD_SPECS.mediumOverlap);
  } else {
    // 카드 7+: 40px씩만 노출
    const card3Top = FIGMA_CARD_SPECS.overlap + cardHeight; // 267px
    const card6Bottom =
      card3Top -
      FIGMA_CARD_SPECS.mediumOverlap +
      2 * (cardHeight - FIGMA_CARD_SPECS.mediumOverlap); // 447px
    const card6Top = card6Bottom + cardHeight; // 627px

    const minGapCount = courseIndex - 5; // 카드7부터 개수
    cardBottom =
      card6Top -
      FIGMA_CARD_SPECS.minOverlap +
      (minGapCount - 1) * (cardHeight - FIGMA_CARD_SPECS.minOverlap);
  }

  return {
    height: `${FIGMA_CARD_SPECS.thirdCard_3plus}rem`, // 180px
    bottom: `${cardBottom}rem`,
    borderRadius: FIGMA_CARD_SPECS.topRadius,
    zIndex: totalCourses - courseIndex,
  };
}

/**
 * 전체 스택 높이 계산 (점진적 간격 축소 규칙)
 */
export function getStackHeight(total: number): string {
  if (total === 0) return "0rem";

  // 1개: 130px + 9px 여백 = 139px (8.6875rem)
  if (total === 1) {
    return `${FIGMA_CARD_SPECS.firstCard + FIGMA_CARD_SPECS.bottomMargin_1}rem`;
  }

  // 2개: 130 + 180 - 87 + 6px 여백 = 229px (14.3125rem)
  if (total === 2) {
    const totalHeight =
      FIGMA_CARD_SPECS.firstCard +
      FIGMA_CARD_SPECS.secondCard_2 -
      FIGMA_CARD_SPECS.overlap +
      FIGMA_CARD_SPECS.bottomMargin_2;
    return `${totalHeight}rem`;
  }

  // 3개: 136 + 180 - 87 = 229px (14.3125rem)
  if (total === 3) {
    const totalHeight =
      FIGMA_CARD_SPECS.secondCard_3plus +
      FIGMA_CARD_SPECS.thirdCard_3plus -
      FIGMA_CARD_SPECS.overlap;
    return `${totalHeight}rem`;
  }

  // 4-6개: 점진적 60px 간격
  // 4개: 229 + 60 = 289px (18.0625rem)
  // 5개: 289 + 60 = 349px (21.8125rem)
  // 6개: 349 + 60 = 409px (25.5625rem)
  if (total >= 4 && total <= 6) {
    const baseHeight =
      FIGMA_CARD_SPECS.secondCard_3plus +
      FIGMA_CARD_SPECS.thirdCard_3plus -
      FIGMA_CARD_SPECS.overlap;
    const mediumGapCards = total - 3; // 4번 카드부터
    return `${baseHeight + mediumGapCards * FIGMA_CARD_SPECS.mediumOverlap}rem`;
  }

  // 7개 이상: 최대 높이 제한 + 최소 40px 간격
  // 7개: 409 + 40 = 449px (28.0625rem) ← 최대 높이
  // 8개 이상: 내부 스크롤
  const baseHeight =
    FIGMA_CARD_SPECS.secondCard_3plus +
    FIGMA_CARD_SPECS.thirdCard_3plus -
    FIGMA_CARD_SPECS.overlap;
  const mediumGapHeight = 3 * FIGMA_CARD_SPECS.mediumOverlap; // 카드 4-6 (180px)
  const minGapCards = total - 6; // 카드 7부터
  const minGapHeight = minGapCards * FIGMA_CARD_SPECS.minOverlap;

  return `${baseHeight + mediumGapHeight + minGapHeight}rem`;
}

/**
 * 카드 그림자 스타일 (제거됨 - 깔끔한 플랫 디자인)
 */
export function calculateCardShadow(): string {
  return "none";
}

/**
 * 난이도 텍스트 변환 (기존 유지)
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

// ========================================
// 📊 점진적 간격 축소 규칙 검증 (개발 모드)
// ========================================

if (process.env.NODE_ENV === "development") {
  console.group("🎨 카드 스택 높이 검증 (점진적 간격 축소)");

  console.log("1개 카드:", getStackHeight(1), "→ 139px (기존 유지)");
  console.log("2개 카드:", getStackHeight(2), "→ 229px (기존 유지)");
  console.log("3개 카드:", getStackHeight(3), "→ 229px (기존 유지)");
  console.log("4개 카드:", getStackHeight(4), "→ 289px (229 + 60) ⭐ 새 규칙");
  console.log("5개 카드:", getStackHeight(5), "→ 349px (289 + 60) ⭐ 새 규칙");
  console.log("6개 카드:", getStackHeight(6), "→ 409px (349 + 60) ⭐ 새 규칙");
  console.log(
    "7개 카드:",
    getStackHeight(7),
    "→ 449px (409 + 40) ⭐ 최대 높이",
  );
  console.log("10개 카드:", getStackHeight(10), "→ 569px (449 + 40×3)");

  console.groupEnd();
}
