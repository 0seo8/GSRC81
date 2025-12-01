/**
 * 🎨 Figma 디자인 정확한 스펙 구현
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
// 🎯 Figma 정확한 스펙 상수
// ========================================

const FIGMA_CARD_SPECS = {
  // 카드 높이
  firstCard: 8.125,       // 130px - 1번 카드 (모든 케이스 동일)
  secondCard_2: 11.25,    // 180px - 2개일 때 2번 카드
  secondCard_3plus: 8.5,  // 136px - 3개 이상일 때 2번 카드 ⭐
  thirdCard_3plus: 11.25, // 180px - 3개 이상일 때 3번+ 카드

  // 간격
  overlap: 5.4375,        // 87px - 카드 겹침 간격 (일관됨)
  bottomMargin_1: 0.5625, // 9px - 1개일 때 바닥 여백
  bottomMargin_2: 0.375,  // 6px - 2개일 때 레이아웃 바닥 여백

  // 숨김
  hiddenOffset: -7,       // -112px - 3개 이상일 때 1번 카드 숨김 ⭐

  // 모서리
  fullRadius: "2.8125rem",      // 45px - 전체 모서리
  topRadius: "2.8125rem 2.8125rem 0 0",  // 45px - 상단만
} as const;

/**
 * Figma 스펙대로 카드 레이아웃 계산
 */
export function calculateCardLayoutFigmaExact(
  courseIndex: number,
  totalCourses: number,
): CardLayout {

  // ========================================
  // 1개 카드
  // ========================================
  if (totalCourses === 1) {
    return {
      height: `${FIGMA_CARD_SPECS.firstCard}rem`,  // 130px
      bottom: `${FIGMA_CARD_SPECS.bottomMargin_1}rem`,  // 9px 여백
      borderRadius: FIGMA_CARD_SPECS.fullRadius,  // 전체 둥근
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
        height: `${FIGMA_CARD_SPECS.firstCard}rem`,  // 130px
        bottom: "0rem",  // 바닥에 딱 붙음
        borderRadius: FIGMA_CARD_SPECS.fullRadius,
        zIndex: 2,  // 위에 표시
      };
    } else {
      // 카드 2: 뒤에 표시, 위쪽만 둥근
      return {
        height: `${FIGMA_CARD_SPECS.secondCard_2}rem`,  // 180px
        bottom: `${FIGMA_CARD_SPECS.overlap}rem`,  // 87px 위에
        borderRadius: FIGMA_CARD_SPECS.topRadius,
        zIndex: 1,  // 아래 표시
      };
    }
  }

  // ========================================
  // 3개 이상
  // ========================================
  if (courseIndex === 0) {
    // 카드 1: 완전 숨김, 전체 둥근, z-index 최고
    return {
      height: `${FIGMA_CARD_SPECS.firstCard}rem`,  // 130px
      bottom: `${FIGMA_CARD_SPECS.hiddenOffset}rem`,  // -112px
      borderRadius: FIGMA_CARD_SPECS.fullRadius,
      zIndex: totalCourses,  // 가장 높은 z-index
    };
  }

  if (courseIndex === 1) {
    // 카드 2: 기준점(bottom: 0), 위쪽만 둥근
    // ⭐ 중요: 3개 이상일 때는 136px!
    return {
      height: `${FIGMA_CARD_SPECS.secondCard_3plus}rem`,  // 136px
      bottom: "0rem",  // 기준점
      borderRadius: FIGMA_CARD_SPECS.topRadius,
      zIndex: totalCourses - courseIndex,
    };
  }

  // 카드 3 이상: 180px, 87px씩 쌓임
  // courseIndex 2 → 87px
  // courseIndex 3 → 174px (87 + 87)
  // courseIndex 4 → 261px (87 + 87 + 87)
  const cardBottom = FIGMA_CARD_SPECS.overlap * (courseIndex - 1);

  return {
    height: `${FIGMA_CARD_SPECS.thirdCard_3plus}rem`,  // 180px
    bottom: `${cardBottom}rem`,
    borderRadius: FIGMA_CARD_SPECS.topRadius,
    zIndex: totalCourses - courseIndex,
  };
}

/**
 * 전체 스택 높이 계산 (Figma 스펙)
 */
export function getStackHeightFigmaExact(total: number): string {
  if (total === 0) return "0rem";

  // 1개: 130px + 9px 여백 = 139px
  if (total === 1) {
    return `${FIGMA_CARD_SPECS.firstCard + FIGMA_CARD_SPECS.bottomMargin_1}rem`;
  }

  // 2개: 130 + 180 - 87 + 6px 여백 = 229px
  if (total === 2) {
    const totalHeight =
      FIGMA_CARD_SPECS.firstCard +
      FIGMA_CARD_SPECS.secondCard_2 -
      FIGMA_CARD_SPECS.overlap +
      FIGMA_CARD_SPECS.bottomMargin_2;
    return `${totalHeight}rem`;  // 14.3125rem (229px)
  }

  // 3개 이상: 136(카드2) + 180(카드3) - 87(겹침) + (N-3) × 87
  // N=3: 136 + 180 - 87 = 229px
  // N=4: 229 + 87 = 316px
  // N=5: 316 + 87 = 403px
  const baseHeight =
    FIGMA_CARD_SPECS.secondCard_3plus +  // 136px (카드2 기준)
    FIGMA_CARD_SPECS.thirdCard_3plus -   // 180px (카드3)
    FIGMA_CARD_SPECS.overlap;            // -87px (겹침)

  const additionalCards = total - 3;  // 4번 카드부터
  const additionalHeight = additionalCards * FIGMA_CARD_SPECS.overlap;

  return `${baseHeight + additionalHeight}rem`;
}

/**
 * 카드 그림자 스타일 (기존 유지)
 */
export function calculateCardShadow(index: number): string {
  return `0 ${4 + index * 2}px ${12 + index * 4}px rgba(0,0,0,0.15)`;
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
// 📊 예상 결과 검증
// ========================================

if (process.env.NODE_ENV === "development") {
  console.group("🎨 Figma 스펙 검증");

  // 1개 카드
  console.log("1개 카드:", getStackHeightFigmaExact(1));
  // 예상: 8.6875rem (139px = 130 + 9)

  // 2개 카드
  console.log("2개 카드:", getStackHeightFigmaExact(2));
  // 예상: 14.3125rem (229px = 130 + 180 - 87 + 6)

  // 3개 카드
  console.log("3개 카드:", getStackHeightFigmaExact(3));
  // 예상: 14.3125rem (229px = 136 + 180 - 87)

  // 5개 카드
  console.log("5개 카드:", getStackHeightFigmaExact(5));
  // 예상: 25.1875rem (403px = 136 + 180 - 87 + 87 * 2)

  console.groupEnd();
}

// ========================================
// ⚠️ 주의사항
// ========================================

/**
 * 1. 2번 카드 높이가 케이스별로 다름!
 * - 2개일 때: 180px
 * - 3개 이상일 때: 136px ⭐
 *
 * 2. 1번 카드 숨김 오프셋
 * - -112px (-7rem) ⭐
 * - 이전 추측(-80px)보다 더 많이 숨김
 *
 * 3. 바닥 여백
 * - 1개: 9px
 * - 2개: 6px (레이아웃 여백)
 * - 3개 이상: 0px
 *
 * 4. 좌우 여백 (7px)
 * - 바텀시트 외부 여백
 * - 카드 내부 padding과는 별개
 * - CSS에서 별도 처리 필요
 */

// ========================================
// 🔄 마이그레이션 가이드
// ========================================

/**
 * Step 1: 기존 card-layout.ts 백업
 * ```bash
 * cp src/shared/lib/utils/card-layout.ts \
 *    src/shared/lib/utils/card-layout.backup.ts
 * ```
 *
 * Step 2: Import 경로 변경
 * ```typescript
 * // Before
 * import { calculateCardLayout } from "@/shared/lib/utils/card-layout";
 *
 * // After
 * import { calculateCardLayoutFigmaExact as calculateCardLayout }
 *   from "@/shared/lib/utils/card-layout-figma-spec";
 * ```
 *
 * Step 3: refactored-course-card-stack.tsx 업데이트
 * ```typescript
 * import { getStackHeightFigmaExact } from "@/shared/lib/utils/card-layout-figma-spec";
 *
 * const stackHeight = getStackHeightFigmaExact(courses.length);
 * ```
 *
 * Step 4: 좌우 여백 추가 (CategoryFullScreen.tsx)
 * ```typescript
 * <div className="px-[7px]">  // 7px 외부 여백
 *   <RefactoredCourseCardStack ... />
 * </div>
 * ```
 *
 * Step 5: 테스트
 * - [ ] 1개 카드: 130px + 9px 여백
 * - [ ] 2개 카드: 87px 겹침, 6px 여백
 * - [ ] 3개 카드: 2번 136px, 3번 180px
 * - [ ] 5개 카드: 스크롤 확인
 *
 * Step 6: Figma와 픽셀 단위 비교
 * - [ ] 디자이너와 함께 확인
 * - [ ] 실제 디바이스에서 테스트
 */
