# 바텀시트 시스템 상세 가이드

> Map 페이지의 핵심 기능인 바텀시트(BottomSheet) 시스템에 대한 완전한 기술 문서입니다.

## 목차

1. [개요](#1-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [컴포넌트 상세](#3-컴포넌트-상세)
   - [3.1 CategoryFullScreen](#31-categoryfullscreen)
   - [3.2 BottomSheetHeader](#32-bottomsheetheader)
   - [3.3 CourseCardStack](#33-coursecardstack)
   - [3.4 CourseCard](#34-coursecard)
4. [커스텀 훅 상세](#4-커스텀-훅-상세)
   - [4.1 useBottomSheetSnap](#41-usebottomsheetsnap)
   - [4.2 useBottomSheetDrag](#42-usebottomsheetdrag)
   - [4.3 useCategoryNavigation](#43-usecategorynavigation)
5. [카드 레이아웃 시스템](#5-카드-레이아웃-시스템)
6. [카테고리별 디자인 시스템](#6-카테고리별-디자인-시스템)
7. [인터랙션 플로우](#7-인터랙션-플로우)
8. [애니메이션 시스템](#8-애니메이션-시스템)
9. [성능 최적화](#9-성능-최적화)
10. [트러블슈팅](#10-트러블슈팅)

---

## 1. 개요

바텀시트는 지도 페이지에서 **선택된 코스 정보를 표시**하는 핵심 UI 컴포넌트입니다.

### 주요 특징

| 기능                   | 설명                                       |
| ---------------------- | ------------------------------------------ |
| **3단계 스냅 포인트**  | minimized(0vh) / medium(60vh) / full(95vh) |
| **드래그 제스처**      | 터치/마우스 드래그로 높이 조절             |
| **카드 스택 레이아웃** | Figma 스펙 기반 겹침 카드 UI               |
| **카테고리별 테마**    | 배경색/카드색 동적 변경                    |
| **스프링 애니메이션**  | Framer Motion 기반 물리 애니메이션         |

### 트리거 조건

```
마커 클릭 → selectedCourse 설정 → isOpen=true → 바텀시트 열림
클러스터 클릭 → selectedCourses 설정 → isOpen=true → 바텀시트 열림
```

---

## 2. 시스템 아키텍처

### 컴포넌트 계층 구조

```
CategoryFullScreen (메인 컨테이너)
├── motion.div (백드롭 - 클릭 시 닫기)
└── motion.div (바텀시트 본체)
    ├── BottomSheetHeader (드래그 영역)
    │   ├── 드래그 핸들 바
    │   └── 카테고리 타이틀
    └── ScrollContainer (스크롤 영역)
        └── RefactoredCourseCardStack
            └── CourseCard × N (개별 카드)
```

### 훅 의존성 구조

```
CategoryFullScreen
├── useBottomSheetDrag ← useBottomSheetSnap
├── useCategoryNavigation
└── getCategoryDesign (config)
```

### 데이터 흐름

```
OptimizedMapClient
    ↓ props
CategoryFullScreen
    │
    ├── selectedCourse / selectedCourses → filteredCourses (useMemo)
    ├── categories + initialCategory → actualCategory (useMemo)
    ├── actualCategory → currentDesign (getCategoryDesign)
    │
    └── filteredCourses → RefactoredCourseCardStack → CourseCard
```

---

## 3. 컴포넌트 상세

### 3.1 CategoryFullScreen

**위치:** `src/features/map/components/category-full-screen.tsx`

#### Props 인터페이스

```typescript
interface CategoryFullScreenProps {
  isOpen: boolean; // 열림/닫힘 상태
  onClose: () => void; // 닫기 콜백
  categories: CourseCategory[]; // 카테고리 목록
  initialCategory?: string; // 초기 카테고리 키
  onCourseClick: (courseId: string) => void; // 코스 클릭 → 상세 페이지
  onCategoryChange?: (categoryKey: string) => void; // 카테고리 변경 콜백
  onSnapPointChange?: (snapPoint: SnapPoint) => void; // 스냅 변경 콜백
  selectedCourse?: CourseForMap | null; // 단일 선택 코스
  selectedCourses?: CourseForMap[]; // 복수 선택 코스
}
```

#### 핵심 로직

**1) 코스 필터링 (useMemo)**

```typescript
const filteredCourses = useMemo(() => {
  // 클러스터 클릭: 복수 코스
  if (selectedCourses && selectedCourses.length > 0) {
    return selectedCourses;
  }
  // 마커 클릭: 단일 코스
  if (selectedCourse) {
    return [selectedCourse];
  }
  // 선택 없음
  return [];
}, [selectedCourses, selectedCourse]);
```

**2) 실제 카테고리 결정 (useMemo)**

```typescript
const actualCategory = useMemo(() => {
  // "전체" 카테고리는 항상 유지
  if (initialCategory === "all") {
    return categories.find((cat) => cat.key === "all") || categories[0];
  }
  // 선택된 코스의 카테고리 사용
  if (filteredCourses.length > 0) {
    const categoryKey = filteredCourses[0].course_categories?.key || "jingwan";
    return categories.find((cat) => cat.key === categoryKey) || categories[0];
  }
  return categories.find((cat) => cat.key === initialCategory) || categories[0];
}, [filteredCourses, categories, initialCategory]);
```

**3) 스크롤 → 전체화면 전환 (마우스 휠)**

```typescript
useEffect(() => {
  const handleScroll = (e: WheelEvent) => {
    const isAtTop = scrollContainer.scrollTop === 0;
    const isScrollingUp = e.deltaY < 0;
    const isMediumSize = snapManager.snapPoint === "medium";

    // 맨 위에서 위로 스크롤 → full로 확장
    if (isAtTop && isScrollingUp && isMediumSize) {
      e.preventDefault();
      snapManager.snapToNext();
    }
  };
  // ...
}, [snapManager]);
```

**4) 터치 스크롤 → 전체화면 전환 (모바일)**

```typescript
const handleTouchMove = (e: TouchEvent) => {
  const touchDeltaY = touchCurrentY - touchStartY;
  const isAtTop = scrollTopAtTouchStart === 0;
  const isScrollingUp = touchDeltaY > 30; // 30px 이상 드래그

  if (isAtTop && isScrollingUp && isMediumSize) {
    snapManager.snapToNext();
  }
};
```

#### 애니메이션 설정

```typescript
<motion.div
  initial={{ height: "0vh", opacity: 0, y: 50 }}
  animate={{
    height: snapManager.getSnapHeight(snapManager.snapPoint),
    opacity: 1,
    y: 0,
  }}
  exit={{ height: "0vh", opacity: 0, y: 30 }}
  transition={{
    type: "spring",
    damping: 25,      // 바운스 감쇠
    stiffness: 280,   // 스프링 강도
    opacity: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
    y: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }}
/>
```

---

### 3.2 BottomSheetHeader

**위치:** `src/features/map/components/bottom-sheet-header.tsx`

#### Props 인터페이스

```typescript
interface BottomSheetHeaderProps {
  categoryName?: string; // 카테고리 이름
  dongNames: string[]; // 동 이름 목록 (전체 카테고리용)
  isAllCategory: boolean; // 전체 카테고리 여부
  onHeaderDrag: (event, info: PanInfo) => void; // 드래그 콜백
  onDragStart?: () => void; // 드래그 시작 콜백
  onDragEnd?: () => void; // 드래그 종료 콜백
}
```

#### 드래그 제스처 처리

**터치 이벤트 (모바일)**

```typescript
const handleTouchStart = (e: React.TouchEvent) => {
  const touch = e.touches[0];
  setStartPos({ x: touch.clientX, y: touch.clientY });
  setStartTime(Date.now());
  isDragging.current = true;
};

const handleTouchEnd = (e: React.TouchEvent) => {
  const touch = e.changedTouches[0];
  const deltaTime = Math.max(Date.now() - startTime, 1);

  const offset = {
    x: touch.clientX - startPos.x,
    y: touch.clientY - startPos.y,
  };

  const velocity = {
    x: (offset.x / deltaTime) * 1000, // pixels per second
    y: (offset.y / deltaTime) * 1000,
  };

  const panInfo: PanInfo = { offset, velocity, point, delta };
  onHeaderDrag(e.nativeEvent, panInfo);
};
```

**마우스 이벤트 (데스크톱)**

```typescript
const handleMouseDown = (e: React.MouseEvent) => {
  setStartPos({ x: e.clientX, y: e.clientY });
  setStartTime(Date.now());
  isDragging.current = true;
};

const handleMouseUp = (e: React.MouseEvent) => {
  // 동일한 velocity 계산 로직
  onHeaderDrag(e.nativeEvent, panInfo);
};
```

#### 타이틀 표시 로직

```typescript
const getTitle = () => {
  if (isAllCategory) {
    // 전체 카테고리: 동 이름 목록 또는 "전체"
    return dongNames.length > 0
      ? `${dongNames.join(", ")}\n러닝`
      : "전체\n러닝";
  }
  // 특정 카테고리: 카테고리 이름
  return `${categoryName}\n러닝`;
};
```

**예시:**

- 전체 카테고리 + 동 정보: `"진관동, 불광동\n러닝"`
- 트랙 카테고리: `"트랙\n러닝"`

---

### 3.3 RefactoredCourseCardStack

**위치:** `src/features/map/components/refactored-course-card-stack.tsx`

> **Note:** 이전 `course-card-stack.tsx`는 사용되지 않아 삭제되었습니다.

#### Props 인터페이스

```typescript
interface RefactoredCourseCardStackProps {
  courses: CourseForMap[]; // 표시할 코스 목록
  isDragging: boolean; // 드래그 중 여부
  onCourseClick: (courseId: string) => void; // 카드 클릭 콜백
  isExpanded?: boolean; // 확장 상태 (full snap point)
  currentCategoryKey?: string; // 현재 카테고리 키 (색상 결정용)
}
```

#### 스택 높이 계산

```typescript
// 🎨 Figma 스펙대로 카드 스택 높이 계산 (rem 단위)
const stackHeight = getStackHeight(courses.length);

return (
  <div
    className="relative w-full font-sans mb-0"
    style={{ minHeight: courses.length > 1 ? stackHeight : undefined }}
  >
    {/* ... */}
  </div>
);
```

#### 연속 카테고리 색상 순환

```typescript
// 같은 카테고리가 연속된 개수를 계산 (색상 인덱스로 사용)
let sameConsecutiveCount = 0;
if (previousCourseCategoryKey === course.course_categories?.key) {
  for (let i = index - 1; i >= 0; i--) {
    if (courses[i].course_categories?.key === course.course_categories?.key) {
      sameConsecutiveCount++;
    } else break;
  }
}

// 카드 색상 결정 (getCardColorForCourse 유틸리티 사용)
const cardColor = getCardColorForCourse(
  course.course_categories?.key,
  currentCategoryKey,
  sameConsecutiveCount,
  previousCourseCategoryKey,
);
```

---

### 3.4 CourseCard

**위치:** `src/features/map/components/course-card.tsx`

#### Props 인터페이스

```typescript
interface CourseCardProps {
  course: CourseWithCategory; // 코스 데이터
  index: number; // 카드 인덱스
  totalCourses: number; // 전체 카드 수
  cardColor: string; // 배경 색상
  isDragging: boolean; // 드래그 중 여부
  onCourseClick: (courseId: string) => void; // 클릭 콜백
  isExpanded?: boolean; // 확장 상태
}
```

#### 카드 타입 판별

```typescript
// 맨 앞 카드 (가장 잘 보이는 카드)
const isFrontCard =
  (totalCourses === 1 && index === 0) ||
  (totalCourses === 2 && index === 0) ||
  (totalCourses >= 3 && index === 1);

// 숨겨진 카드 (3개 이상일 때 index=0)
const isHiddenCard = totalCourses >= 3 && index === 0;

// 2개일 때 뒤쪽 카드
const isBackCardIn2 = totalCourses === 2 && index === 1;

// 3개 이상일 때 뒤쪽 카드들
const isBackCardIn3Plus = totalCourses >= 3 && index >= 2;
```

#### 카드 컨테이너 높이/패딩

```typescript
const getCardContainerClass = () => {
  if (isFrontCard) {
    if (totalCourses >= 3) {
      return "h-[11.25rem] pt-[1.875rem] pb-[5rem]"; // 180px
    }
    return "h-[8.125rem] py-[1.875rem]"; // 130px
  }
  if (isHiddenCard) {
    return "h-[8.125rem] py-5"; // 130px, 12px만 노출
  }
  if (isBackCardIn2 || isBackCardIn3Plus) {
    return "h-[11.25rem] pt-[1.875rem] pb-[5rem]"; // 180px
  }
  return "py-5";
};
```

#### 애니메이션 효과

```typescript
<motion.div
  layoutId={`course-card-${course.id}`}
  initial={{
    opacity: 0,
    y: 40,
    scale: 0.95,
    filter: "blur(0.25rem)",
  }}
  animate={{
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0)",
  }}
  whileHover={{
    scale: index === 0 ? 1.02 : 1,  // 맨 앞 카드만 호버 효과
    y: index === 0 ? -4 : 0,
  }}
  whileTap={{
    scale: 0.98,
  }}
  transition={{
    opacity: { delay: index * 0.08 },  // Stagger 효과
    y: { delay: index * 0.08 },
    scale: { delay: index * 0.08 },
  }}
/>
```

#### 카드 내용 레이아웃

```
┌─────────────────────────────────────────┐
│  Title (좌상단)              km (우측)   │
│  코스 제목                    5 km       │
│                                         │
│  카테고리러닝 코스 (좌하단)              │
│  난이도: 보통                            │
└─────────────────────────────────────────┘
```

---

## 4. 커스텀 훅 상세

### 4.1 useBottomSheetSnap

**위치:** `src/features/map/hooks/use-bottom-sheet-snap.ts`

#### 반환 값

```typescript
return {
  snapPoint, // 현재 스냅 포인트: "minimized" | "medium" | "full"
  setSnapPoint, // 스냅 포인트 직접 설정
  getSnapHeight, // 스냅 포인트 → 높이 문자열
  snapToNext, // 다음 스냅 포인트로 이동
  snapToPrev, // 이전 스냅 포인트로 이동
  handleDragEnd, // 드래그 종료 처리
};
```

#### 스냅 포인트 높이

| Snap Point  | 높이 | 용도                         |
| ----------- | ---- | ---------------------------- |
| `minimized` | 0vh  | 최소화 상태 (전환 중)        |
| `medium`    | 60vh | 기본 높이 - 카드 미리보기    |
| `full`      | 95vh | 전체 높이 - 모든 카드 스크롤 |

> **Note:** `minimized` 상태에서 `snapToPrev()`를 호출하면 `onClose()`가 호출되어 바텀시트가 완전히 닫힙니다.

#### 드래그 판정 로직

```typescript
const handleDragEnd = (offsetY: number, velocityY: number) => {
  const threshold = 100; // 100px 이상 드래그
  const velocityThreshold = 500; // 빠른 드래그 감지

  // 빠른 드래그: 속도 기반 판정
  if (Math.abs(velocityY) > velocityThreshold) {
    if (velocityY < 0)
      snapToNext(); // 위로 빠르게 → 확장
    else snapToPrev(); // 아래로 빠르게 → 축소
    return;
  }

  // 일반 드래그: 거리 기반 판정
  if (offsetY < -threshold)
    snapToNext(); // 위로 충분히
  else if (offsetY > threshold) snapToPrev(); // 아래로 충분히
  // threshold 미만 → 현재 상태 유지
};
```

#### 상태 전이 다이어그램

```
              snapToNext()
    ┌────────────────────────────┐
    │                            ▼
MINIMIZED ────────────────────► MEDIUM ──────────────────────► FULL
    ▲                            │                             │
    │          snapToPrev()      │          snapToPrev()       │
    │                            ▼                             │
    └────────────────────────────┴─────────────────────────────┘
                              onClose()
```

---

### 4.2 useBottomSheetDrag

**위치:** `src/features/map/hooks/use-bottom-sheet-drag.ts`

#### 반환 값

```typescript
return {
  isDragging, // 드래그 중 여부
  handleHeaderDrag, // 헤더 드래그 핸들러
  handleDragStart, // 드래그 시작 콜백
  handleDragEnd, // 드래그 종료 콜백
  snapManager, // useBottomSheetSnap 인스턴스
};
```

#### 드래그 처리 (상하 드래그만 지원)

```typescript
const handleHeaderDrag = (_event, info: PanInfo) => {
  // 상하 드래그로 snap points 변경
  snapManager.handleDragEnd(info.offset.y, info.velocity.y);
};
```

> **Note:** 이전에는 좌우 스와이프로 카테고리 변경 기능이 있었으나, 현재는 제거되어 상하 드래그만 지원합니다.

---

### 4.3 useCategoryNavigation

**위치:** `src/features/map/hooks/use-category-navigation.ts`

> **Note:** 이전에 있던 좌우 스와이프 카테고리 변경 기능은 제거되었습니다. 현재는 카테고리 정보와 동 이름 추출 기능만 제공합니다.

#### 반환 값

```typescript
return {
  currentCategory, // 현재 카테고리 객체
  dongNames, // 동 이름 목록 (전체 카테고리용)
};
```

#### 동 이름 추출 (전체 카테고리용)

```typescript
useEffect(() => {
  if (currentCategory?.key === "all" && filteredCourses.length > 0) {
    // 코스들의 위치 정보에서 동 이름 추출
    getDongsFromCourses(filteredCourses).then(setDongNames);
  } else {
    setDongNames([]);
  }
}, [currentCategory?.key, filteredCourses]);
```

#### 주요 역할

- **카테고리 정보 제공**: `initialCategory`에 해당하는 카테고리 객체 반환
- **동 이름 추출**: "전체" 카테고리 선택 시, 선택된 코스들의 위치에서 동 이름을 추출하여 헤더에 표시

---

## 5. 카드 레이아웃 시스템

**위치:** `src/shared/lib/utils/card-layout.ts`

### Figma 스펙 상수

```typescript
const FIGMA_CARD_SPECS = {
  cardHeight: 11.25, // 180px - 모든 카드 동일
  cardGap: 3.75, // 60px - 카드 간 노출 간격
  bottomMargin: 0.5625, // 9px - 바닥 여백
  hiddenOffset: -7, // -112px - 숨김 오프셋
  fullRadius: "2.8125rem", // 45px - 전체 둥근
  topRadius: "2.8125rem 2.8125rem 0 0", // 45px - 상단만
};
```

### 카드 수별 레이아웃

#### 1개 카드

```
┌─────────────────────────┐
│                         │
│       Card 1            │  180px, bottom: 9px
│     (전체 둥근)          │  borderRadius: full
│                         │
└─────────────────────────┘
```

#### 2개 카드

```
    ┌─────────────────────────┐
    │       Card 2            │  180px, bottom: 80px
    │     (상단만 둥근)        │  borderRadius: top
    │                         │
┌───┴─────────────────────────┴───┐
│           Card 1                │  180px, bottom: 0
│         (전체 둥근)              │  borderRadius: full
│                                 │  zIndex: 2 (위)
└─────────────────────────────────┘
```

#### 3개 이상 카드

```
        ┌─────────────────────────┐
        │       Card 3+           │  각 180px, 130px 간격
        │     (상단만 둥근)        │
        │                         │
    ┌───┴─────────────────────────┴───┐
    │           Card 2                │  180px, bottom: -50px
    │         (상단만 둥근)            │  (50px 겹침)
    │                                 │
┌───┴─────────────────────────────────┴───┐
│               Card 1                    │  12px만 노출
│             (전체 둥근)                  │  bottom: -124px
│                                         │  (숨김 카드)
└─────────────────────────────────────────┘
```

### calculateCardLayout 함수

```typescript
export function calculateCardLayout(
  courseIndex: number,
  totalCourses: number,
): CardLayout {
  // 1개
  if (totalCourses === 1) {
    return {
      height: "11.25rem",
      bottom: "0.5625rem",
      borderRadius: fullRadius,
      zIndex: 1,
    };
  }

  // 2개
  if (totalCourses === 2) {
    if (courseIndex === 0) {
      return {
        height: "11.25rem",
        bottom: "0rem",
        borderRadius: fullRadius,
        zIndex: 2,
      };
    }
    return {
      height: "11.25rem",
      bottom: "5rem",
      borderRadius: topRadius,
      zIndex: 1,
    };
  }

  // 3개 이상 - index 0 (숨김)
  if (courseIndex === 0) {
    return {
      height: "11.25rem",
      bottom: "-7.75rem",
      borderRadius: fullRadius,
      zIndex: total,
    };
  }

  // 3개 이상 - index 1 (기준점)
  if (courseIndex === 1) {
    return {
      height: "11.25rem",
      bottom: "-3.125rem",
      borderRadius: topRadius,
      zIndex: total - 1,
    };
  }

  // 3개 이상 - index 2+ (130px 간격)
  const visibleHeight = 8.125; // 130px
  const baseBottom = -3.125; // -50px
  const cardBottom = baseBottom + (courseIndex - 1) * visibleHeight;
  return {
    height: "11.25rem",
    bottom: `${cardBottom}rem`,
    borderRadius: topRadius,
    zIndex: total - courseIndex,
  };
}
```

---

## 6. 카테고리별 디자인 시스템

**위치:** `src/core/config/category-designs.ts`

### 카테고리 디자인 정의

```typescript
export const CATEGORY_DESIGNS = {
  // 전체 - 베이지 배경
  all: {
    backgroundColor: "#EBE7E4",
    cardColors: ["#FCFC60", "#78A893", "#8F806E"], // 노랑/그린/브라운
    markerColor: "#000000",
  },

  // 트랙러닝 - 브라운 배경
  track: {
    backgroundColor: "#957E74",
    cardColors: ["#D04836", "#FCFEF2", "#8F806E"], // 레드/화이트/브라운
    markerColor: "#D04836",
  },

  // 트레일러닝 - 다크그린 배경
  trail: {
    backgroundColor: "#758169",
    cardColors: ["#78A893", "#E5E4D4", "#697064"], // 그린/베이지/회그린
    markerColor: "#78A893",
  },

  // 로드러닝 - 그레이 배경
  road: {
    backgroundColor: "#BBBBBB",
    cardColors: ["#FCFC60", "#E0E0E0", "#7A7A7A"], // 노랑/그레이/다크그레이
    markerColor: "#7A7A7A",
  },
};
```

### 카드 색상 결정 로직

```typescript
export function getCardColorForCourse(
  courseCategoryKey: string | undefined,
  currentCategoryKey: string,
  cardIndex: number,
  previousCourseCategoryKey?: string | undefined,
): string {
  // 특정 카테고리: 순환 색상
  if (currentCategoryKey !== "all") {
    const design = getCategoryDesign(currentCategoryKey);
    return design.cardColors[cardIndex % design.cardColors.length];
  }

  // 전체 카테고리: 코스의 원래 카테고리 색상
  const courseKey = courseCategoryKey || "all";
  const design = CATEGORY_DESIGNS[courseKey] || CATEGORY_DESIGNS.all;

  // 연속된 같은 카테고리는 색상 순환
  const isSameCategoryAsPrevious =
    previousCourseCategoryKey === courseCategoryKey;
  if (!isSameCategoryAsPrevious) {
    return design.cardColors[0]; // 첫 번째 색상
  }
  return design.cardColors[cardIndex % design.cardColors.length];
}
```

### 색상 팔레트 시각화

```
전체 (all)
┌──────────┬──────────┬──────────┐
│ #FCFC60  │ #78A893  │ #8F806E  │
│  노랑    │   그린    │  브라운   │
└──────────┴──────────┴──────────┘
배경: #EBE7E4 (베이지)

트랙 (track)
┌──────────┬──────────┬──────────┐
│ #D04836  │ #FCFEF2  │ #8F806E  │
│   레드    │  화이트   │  브라운   │
└──────────┴──────────┴──────────┘
배경: #957E74 (브라운)

트레일 (trail)
┌──────────┬──────────┬──────────┐
│ #78A893  │ #E5E4D4  │ #697064  │
│   그린    │  베이지   │  회그린   │
└──────────┴──────────┴──────────┘
배경: #758169 (다크그린)

로드 (road)
┌──────────┬──────────┬──────────┐
│ #FCFC60  │ #E0E0E0  │ #7A7A7A  │
│  노랑    │  그레이   │ 다크그레이 │
└──────────┴──────────┴──────────┘
배경: #BBBBBB (그레이)
```

---

## 7. 인터랙션 플로우

### 7.1 바텀시트 열기

```
1. 사용자가 마커/클러스터 클릭
   ↓
2. OptimizedMapClient
   - handleCourseClick() 또는 handleClusterClick()
   - setSelectedCourse(course) 또는 setSelectedCourses(courses)
   - setIsFullscreenOpen(true)
   ↓
3. CategoryFullScreen
   - isOpen=true 감지
   - snapManager.setSnapPoint("medium") 호출
   - filteredCourses 계산
   - actualCategory 결정
   - currentDesign 적용
   ↓
4. AnimatePresence + motion.div
   - 높이: 0vh → 60vh (spring 애니메이션)
   - opacity: 0 → 1
   - y: 50 → 0
```

### 7.2 스냅 포인트 변경

```
사용자 드래그 시작 (헤더 영역)
   ↓
BottomSheetHeader
   - handleTouchStart/handleMouseDown
   - 시작 위치/시간 기록
   ↓
사용자 드래그 종료
   ↓
BottomSheetHeader
   - handleTouchEnd/handleMouseUp
   - offset, velocity 계산
   - onHeaderDrag(panInfo) 호출
   ↓
useBottomSheetDrag.handleHeaderDrag
   - snapManager.handleDragEnd(offsetY, velocityY)
   ↓
useBottomSheetSnap.handleDragEnd
   - 속도 > 500px/s → 빠른 드래그 → 즉시 전환
   - 거리 > 100px → 일반 드래그 → 전환
   - 거리 < 100px → 현재 상태 유지
   ↓
snapPoint 상태 변경
   ↓
CategoryFullScreen re-render
   - motion.div animate.height 변경
   - spring 애니메이션으로 전환
```

### 7.3 카드 클릭 → 상세 페이지

```
사용자가 카드 클릭
   ↓
CourseCard.onClick
   - isDragging 체크 (드래그 중이면 무시)
   - onCourseClick(course.id) 호출
   ↓
OptimizedMapClient.handleCourseDetailNavigation
   - router.push(`/courses/${courseId}`)
   ↓
코스 상세 페이지로 이동
```

### 7.4 스크롤 → 전체화면 확장

```
사용자가 카드 스크롤 영역에서 위로 스크롤 (medium 상태)
   ↓
CategoryFullScreen.handleScroll (wheel) 또는 handleTouchMove
   - scrollTop === 0 (맨 위)
   - 위로 스크롤/드래그 감지
   - snapPoint === "medium"
   ↓
snapManager.snapToNext()
   ↓
snapPoint: "medium" → "full"
   ↓
motion.div 높이: 60vh → 95vh
```

---

## 8. 애니메이션 시스템

### 8.1 바텀시트 높이 전환 (Framer Motion)

```typescript
// Spring 물리 기반 애니메이션
transition={{
  type: "spring",
  damping: 25,      // 감쇠 (높을수록 덜 튀김)
  stiffness: 280,   // 강도 (높을수록 빠름)
}}
```

**애니메이션 곡선:**

- 빠른 시작 → 점진적 감속 → 약간의 오버슈트 → 안정화

### 8.2 카드 등장 애니메이션

```typescript
// Stagger 효과: 카드별 지연
transition={{
  opacity: { delay: index * 0.08 },  // 80ms 간격
  y: { delay: index * 0.08 },
  scale: { delay: index * 0.08 },
  filter: { delay: index * 0.08 },
}}

initial={{
  opacity: 0,
  y: 40,
  scale: 0.95,
  filter: "blur(0.25rem)",
}}

animate={{
  opacity: 1,
  y: 0,
  scale: 1,
  filter: "blur(0)",
}}
```

**5개 카드 등장 타이밍:**

- Card 0: 0ms
- Card 1: 80ms
- Card 2: 160ms
- Card 3: 240ms
- Card 4: 320ms

### 8.3 카드 호버/탭 애니메이션

```typescript
whileHover={{
  scale: index === 0 ? 1.02 : 1,  // 맨 앞 카드만 확대
  y: index === 0 ? -4 : 0,        // 맨 앞 카드만 살짝 위로
  transition: { duration: 0.2, ease: "easeOut" },
}}

whileTap={{
  scale: 0.98,
  transition: { duration: 0.1 },
}}
```

### 8.4 드래그 핸들 호버 애니메이션

```css
/* 기본 상태 */
.handle {
  width: 2.5rem; /* 40px */
  opacity: 0.5;
  transition: all 0.3s;
}

/* 호버 상태 */
.handle:hover {
  width: 3rem; /* 48px */
  opacity: 0.8;
}
```

---

## 9. 성능 최적화

### 9.1 GPU 가속

```typescript
style={{
  willChange: "height, opacity, transform",
  backfaceVisibility: "hidden",
  transform: "translate3d(0, 0, 0)",
}}
```

### 9.2 useMemo로 계산 최소화

```typescript
// 코스 필터링 - 선택 변경 시에만 재계산
const filteredCourses = useMemo(() => {
  if (selectedCourses?.length > 0) return selectedCourses;
  if (selectedCourse) return [selectedCourse];
  return [];
}, [selectedCourses, selectedCourse]);

// 카테고리 결정 - 필터링된 코스 변경 시에만 재계산
const actualCategory = useMemo(() => {
  // ...
}, [filteredCourses, categories, initialCategory]);
```

### 9.3 드래그 중 애니메이션 비활성화

```typescript
// isDragging=true일 때 카드 호버 효과 비활성화
<CourseCard isDragging={isDragging} />

// CourseCard 내부
onClick={(e) => {
  if (isDragging) {
    e.preventDefault();
    return;  // 클릭 무시
  }
  onCourseClick(course.id);
}}
```

### 9.4 이벤트 리스너 정리

```typescript
useEffect(() => {
  scrollContainer.addEventListener("wheel", handleScroll, { passive: false });

  return () => {
    scrollContainer.removeEventListener("wheel", handleScroll);
  };
}, [snapManager]);
```

---

## 10. 트러블슈팅

### 10.1 바텀시트가 열리지 않음

**증상:** 마커를 클릭해도 바텀시트가 표시되지 않음

**원인:**

1. `isOpen`이 `true`로 설정되지 않음
2. `selectedCourse`/`selectedCourses`가 비어있음
3. `categories` 배열이 비어있음

**디버깅:**

```typescript
console.log("isOpen:", isOpen);
console.log("selectedCourse:", selectedCourse);
console.log("selectedCourses:", selectedCourses);
console.log("categories:", categories);
```

### 10.2 드래그가 작동하지 않음

**증상:** 헤더를 드래그해도 높이가 변하지 않음

**원인:**

1. 터치/마우스 이벤트가 제대로 바인딩되지 않음
2. `onHeaderDrag` 콜백이 전달되지 않음
3. threshold 값이 너무 높음

**해결:**

```typescript
// threshold 확인 (기본값: 100px)
const threshold = 100;

// 디버깅
console.log("offsetY:", info.offset.y);
console.log("velocityY:", info.velocity.y);
```

### 10.3 카드 레이아웃이 깨짐

**증상:** 카드가 겹치거나 간격이 맞지 않음

**원인:**

1. `calculateCardLayout` 함수 오류
2. rem 단위 계산 오류
3. `totalCourses` 값이 잘못됨

**확인:**

```typescript
const layout = calculateCardLayout(index, totalCourses);
console.log(`Card ${index}:`, layout);
```

### 10.4 스크롤 시 전체화면으로 전환되지 않음

**증상:** 카드 영역에서 스크롤해도 full 상태로 전환되지 않음

**원인:**

1. `scrollTop`이 0이 아님 (이미 스크롤됨)
2. `snapPoint`가 이미 `full`임
3. 터치 이벤트의 `touchDeltaY` 계산 오류

**확인:**

```typescript
console.log("scrollTop:", scrollContainer.scrollTop);
console.log("snapPoint:", snapManager.snapPoint);
console.log("touchDeltaY:", touchDeltaY);
```

### 10.5 카테고리별 색상이 적용되지 않음

**증상:** 모든 바텀시트가 같은 색상

**원인:**

1. `actualCategory.key`가 항상 같은 값
2. `getCategoryDesign` 함수가 fallback 반환
3. `course_categories` 데이터 누락

**확인:**

```typescript
console.log("actualCategory:", actualCategory);
console.log("currentDesign:", currentDesign);
console.log(
  "filteredCourses[0].course_categories:",
  filteredCourses[0]?.course_categories,
);
```

---

## 요약

바텀시트 시스템은 **3개의 핵심 훅**과 **4개의 컴포넌트**로 구성됩니다:

### 훅

- `useBottomSheetSnap`: 스냅 포인트 상태 관리
- `useBottomSheetDrag`: 드래그 제스처 처리 (isDragging 상태 포함)
- `useCategoryNavigation`: 카테고리 정보 및 동 이름 추출

### 컴포넌트

- `CategoryFullScreen`: 메인 컨테이너 + 애니메이션
- `BottomSheetHeader`: 드래그 영역 + 타이틀 (onDragStart/onDragEnd 콜백 지원)
- `RefactoredCourseCardStack`: 카드 스택 레이아웃 (동적 색상 결정)
- `CourseCard`: 개별 카드 + 인터랙션

### 핵심 특징

- ✅ 3단계 스냅 포인트 (minimized/medium/full)
- ✅ 터치/마우스 드래그 지원 (isDragging 상태 추적)
- ✅ Figma 스펙 기반 카드 레이아웃
- ✅ 카테고리별 동적 테마
- ✅ Spring 물리 애니메이션
- ✅ GPU 가속 최적화

---

## 변경 이력

| 날짜       | 변경 내용                                                               |
| ---------- | ----------------------------------------------------------------------- |
| 2025-01-17 | `closed` → `minimized` 스냅포인트 네이밍 변경                           |
| 2025-01-17 | `isDragging` 버그 수정 (BottomSheetHeader에 onDragStart/onDragEnd 추가) |
| 2025-01-17 | 미사용 파일 삭제: `course-card-stack.tsx`, `course-drawer.tsx`          |
| 2025-01-17 | `useCategoryNavigation`에서 스와이프 관련 죽은 코드 제거                |
| 2025-01-17 | `CategoryFullScreen`에서 미사용 `courses` props 제거                    |
| 2025-01-17 | `RefactoredCourseCardStack`에서 미사용 `cardColors` props 제거          |
