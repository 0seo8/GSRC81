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
  cardHeight: 11.25, // 180px (모든 카드 동일)

  // 겹침/노출 영역 (모든 카드 동일)
  overlap: 3.125, // 50px - 카드 간 겹침 영역 (통일)
  visibleHeight: 8.125, // 130px - 노출 영역 (180px - 50px)

  // 여백
  bottomMargin: 0.5625, // 9px - 바닥 여백

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
  // 2개 카드: index=0이 앞, index=1이 뒤
  // ========================================
  if (totalCourses === 2) {
    if (courseIndex === 0) {
      // 카드 1: 앞에 표시, 전체 둥근
      return {
        height: `${FIGMA_CARD_SPECS.cardHeight}rem`, // 180px
        bottom: "0rem",
        borderRadius: FIGMA_CARD_SPECS.fullRadius,
        zIndex: 2,
      };
    } else {
      // 카드 2: 뒤에 표시 (130px 위에 위치, 50px 겹침)
      return {
        height: `${FIGMA_CARD_SPECS.cardHeight}rem`, // 180px
        bottom: `${FIGMA_CARD_SPECS.visibleHeight}rem`, // 130px
        borderRadius: FIGMA_CARD_SPECS.topRadius,
        zIndex: 1,
      };
    }
  }

  // ========================================
  // 3개 이상: index=0 숨김, index=1 앞, index=2+ 뒤
  // ========================================
  if (courseIndex === 0) {
    // 카드 0: 아래로 숨김 (상단 12px만 노출)
    // index=1 카드 bottom이 0이고 높이 180px → top 180px
    // 12px 노출하려면: bottom = -(180 - 12) = -168px
    return {
      height: `${FIGMA_CARD_SPECS.cardHeight}rem`, // 180px
      bottom: "-10.5rem", // -168px (12px만 노출)
      borderRadius: FIGMA_CARD_SPECS.fullRadius,
      zIndex: totalCourses,
    };
  }

  if (courseIndex === 1) {
    // 카드 1: 맨 앞 (전체 노출)
    return {
      height: `${FIGMA_CARD_SPECS.cardHeight}rem`, // 180px
      bottom: "0rem",
      borderRadius: FIGMA_CARD_SPECS.fullRadius,
      zIndex: totalCourses - 1,
    };
  }

  // index=2 이상: 뒤쪽 카드들 (130px 간격으로 통일)
  // index=2: 130px, index=3: 260px, index=4: 390px
  const cardBottom = (courseIndex - 1) * FIGMA_CARD_SPECS.visibleHeight; // 130px = 8.125rem

  return {
    height: `${FIGMA_CARD_SPECS.cardHeight}rem`, // 180px
    bottom: `${cardBottom}rem`,
    borderRadius: FIGMA_CARD_SPECS.topRadius,
    zIndex: totalCourses - courseIndex,
  };
}

/**
 * 전체 스택 높이 계산
 *
 * 규칙:
 * - 1개: 카드 높이 180px
 * - 2개 이상: 첫 카드 180px + (N-1) * 노출 영역 130px
 * - 50px 겹침이므로 각 추가 카드는 130px씩 높이 추가
 */
export function getStackHeight(total: number): string {
  if (total === 0) return "0rem";
  if (total === 1) return `${FIGMA_CARD_SPECS.cardHeight}rem`; // 180px

  // 2개 이상: 첫 카드 180px + (N-1) * 130px (노출 영역)
  // 2개: 180 + 130 = 310px
  // 3개: 180 + 260 = 440px
  // 4개: 180 + 390 = 570px
  // 5개: 180 + 520 = 700px
  const totalHeight =
    FIGMA_CARD_SPECS.cardHeight + // 첫 카드 높이 (180px)
    (total - 1) * FIGMA_CARD_SPECS.visibleHeight; // 추가 카드들 (각 130px씩 노출)

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
