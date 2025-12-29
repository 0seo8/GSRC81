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
  // 카드 높이 (box-sizing: border-box이므로 패딩 포함된 전체 높이)
  // 모든 카드 180px로 완전 통일
  cardHeight: 11.25, // 180px (모든 카드 동일)

  // 간격 (모든 카드 동일한 간격)
  cardGap: 3.75, // 60px - 모든 카드 간 노출 간격 (통일)
  bottomMargin: 0.5625, // 9px - 모든 케이스 통일된 바닥 여백

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
      height: `${FIGMA_CARD_SPECS.cardHeight}rem`, // 180px
      bottom: `${FIGMA_CARD_SPECS.bottomMargin}rem`, // 9px 하단 여백 (상단도 9px로 동일)
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
        height: `${FIGMA_CARD_SPECS.cardHeight}rem`, // 180px
        bottom: `${FIGMA_CARD_SPECS.bottomMargin}rem`, // 9px 여백
        borderRadius: FIGMA_CARD_SPECS.fullRadius,
        zIndex: 2, // 위에 표시
      };
    } else {
      // 카드 2: 뒤에 표시, 위쪽만 둥근
      // Card 1 상단에서 60px만 노출 - 1rem 감소
      return {
        height: `${FIGMA_CARD_SPECS.cardHeight}rem`, // 180px
        bottom: `${FIGMA_CARD_SPECS.cardHeight + FIGMA_CARD_SPECS.bottomMargin - FIGMA_CARD_SPECS.cardGap - 1}rem`, // 180 + 9 - 60 - 16 = 113px (4.625rem)
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
      height: `${FIGMA_CARD_SPECS.cardHeight}rem`, // 180px
      bottom: `${FIGMA_CARD_SPECS.hiddenOffset}rem`, // -112px
      borderRadius: FIGMA_CARD_SPECS.fullRadius,
      zIndex: totalCourses, // 가장 높은 z-index
    };
  }

  if (courseIndex === 1) {
    // 카드 2: 기준점 - 1rem 감소
    return {
      height: `${FIGMA_CARD_SPECS.cardHeight}rem`, // 180px
      bottom: `${FIGMA_CARD_SPECS.bottomMargin - 1}rem`, // 9px - 16px = -7px
      borderRadius: FIGMA_CARD_SPECS.topRadius,
      zIndex: totalCourses - courseIndex,
    };
  }

  // ========================================
  // 카드 3 이상: 모든 카드 동일한 60px 간격 + 점진적 증가
  // ========================================
  // 공식: 다음 카드 bottom = 이전 카드 bottom + cardHeight - cardGap + (카드번호 * 1px)
  // 모든 카드가 60px만 노출되도록 배치하되 점진적으로 1px씩 위로 올림

  const cardHeight = FIGMA_CARD_SPECS.cardHeight; // 180px (통일)
  const card2Bottom = FIGMA_CARD_SPECS.bottomMargin - 1; // -7px (1rem 감소)

  // Card 3: -2rem 감소
  const card3Bottom = card2Bottom + cardHeight - FIGMA_CARD_SPECS.cardGap - 1; // 추가 -1rem
  let cardBottom: number;

  if (courseIndex === 2) {
    cardBottom = card3Bottom;
  } else if (courseIndex === 3) {
    // Card 4: Card 3과 동일하게 -3rem 적용
    cardBottom = card3Bottom + cardHeight - FIGMA_CARD_SPECS.cardGap - 1; // 추가 -1rem
  } else {
    // Card 5+: 일정한 간격 유지
    const additionalCards = courseIndex - 3;
    cardBottom =
      card3Bottom +
      cardHeight -
      FIGMA_CARD_SPECS.cardGap +
      additionalCards * (cardHeight - FIGMA_CARD_SPECS.cardGap);
  }

  return {
    height: `${FIGMA_CARD_SPECS.cardHeight}rem`, // 180px (통일)
    bottom: `${cardBottom}rem`,
    borderRadius: FIGMA_CARD_SPECS.topRadius,
    zIndex: totalCourses - courseIndex,
  };
}

/**
 * 전체 스택 높이 계산 (모든 카드 동일한 높이와 간격)
 * 주의: box-sizing: border-box이므로 패딩이 이미 포함된 값
 * 상단 여백과 하단 여백을 동일하게 유지 (각 9px)
 */
export function getStackHeight(total: number): string {
  if (total === 0) return "0rem";

  // 모든 카드: 180px 높이, 60px 간격으로 완전 통일
  // 공식: topMargin + Card 1 (180) + (N - 1) * cardGap + bottomMargin
  // 1개: 9 + 180 + 0 + 9 = 198px
  // 2개: 9 + 180 + 60 + 9 = 258px
  // 3개: 9 + 180 + 120 + 9 = 318px
  // 4개: 9 + 180 + 180 + 9 = 378px
  const totalHeight =
    FIGMA_CARD_SPECS.bottomMargin + // 상단 여백 (9px)
    FIGMA_CARD_SPECS.cardHeight + // 첫 카드 높이 (180px)
    (total - 1) * FIGMA_CARD_SPECS.cardGap + // 추가 카드들 (각 60px씩)
    FIGMA_CARD_SPECS.bottomMargin; // 하단 여백 (9px)

  return `${totalHeight}rem`;
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
