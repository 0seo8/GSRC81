# 카드 레이아웃 스펙 정리

## 개요

맵 페이지 바텀시트의 카드 스택 레이아웃 규칙을 정리한 문서입니다.

---

## 핵심 파일 위치

| 파일 | 역할 |
|------|------|
| `src/shared/lib/utils/card-layout.ts` | 카드 위치/크기 계산 로직 |
| `src/features/map/hooks/use-bottom-sheet-snap.ts` | 바텀시트 높이 (60vh/95vh) |
| `src/features/map/components/course-card.tsx` | 카드 컴포넌트 스타일 |
| `src/features/map/components/refactored-course-card-stack.tsx` | 카드 스택 컨테이너 |
| `src/features/map/components/category-full-screen.tsx` | 바텀시트 메인 컨테이너 |
| `src/features/map/components/bottom-sheet-header.tsx` | 바텀시트 헤더 |

---

## 바텀시트 높이 규칙

| SnapPoint | 높이 | 설명 |
|-----------|------|------|
| `minimized` | 0vh | 닫힘 |
| `medium` | **60vh** | 기본 열림 상태 |
| `full` | **95vh** | 전체 열림 상태 |

파일: `src/features/map/hooks/use-bottom-sheet-snap.ts` (라인 13-24)

---

## 기본 스펙 상수

파일: `src/shared/lib/utils/card-layout.ts` (라인 22-37)

```typescript
const FIGMA_CARD_SPECS = {
  cardHeight: 11.25,      // 180px - 모든 카드 동일
  cardGap: 3.75,          // 60px - 카드 간 노출 간격
  bottomMargin: 0.5625,   // 9px - 상/하단 여백
  hiddenOffset: -7,       // -112px - 3개 이상일 때 숨김
  fullRadius: "2.8125rem",           // 45px - 전체 둥근
  topRadius: "2.8125rem 2.8125rem 0 0", // 상단만 둥근
};
```

---

## 카드 개수별 레이아웃

### 1개 카드

파일: `card-layout.ts` 라인 49-56

```
┌─────────────────────┐
│     바텀시트          │
│  ┌───────────────┐  │
│  │               │  │  ← 180px 높이
│  │    카드 1      │  │  ← 전체 둥근 모서리 (45px)
│  │               │  │  ← bottom: 9px
│  └───────────────┘  │
└─────────────────────┘
```

| 항목 | 값 |
|------|-----|
| 높이 | 180px (11.25rem) |
| bottom | 9px (0.5625rem) |
| borderRadius | 전체 둥근 (45px) |
| zIndex | 1 |

---

### 2개 카드

파일: `card-layout.ts` 라인 62-81

```
┌─────────────────────┐
│     바텀시트          │
│  ┌───────────────┐  │  ← 카드 2 (index=1)
│  │   카드 2       │  │  ← bottom: 80px, 상단만 둥근
│  ├───────────────┤  │
│  │               │  │
│  │   카드 1       │  │  ← 카드 1 (index=0)
│  │               │  │  ← bottom: 0px, 전체 둥근
│  └───────────────┘  │
└─────────────────────┘
```

#### 카드 1 (index=0) - 앞에 표시

| 항목 | 값 |
|------|-----|
| 높이 | 180px (11.25rem) |
| bottom | 0px |
| borderRadius | 전체 둥근 (45px) |
| zIndex | 2 (위) |

#### 카드 2 (index=1) - 뒤에 표시

| 항목 | 값 |
|------|-----|
| 높이 | 180px (11.25rem) |
| bottom | 80px (5rem) |
| borderRadius | 상단만 둥근 (45px 45px 0 0) |
| zIndex | 1 (아래) |

---

### 3개 이상 카드

파일: `card-layout.ts` 라인 87-125

```
┌─────────────────────┐
│     바텀시트          │
│  ┌───────────────┐  │  ← 카드 N (마지막)
│  │   카드 N       │  │
│  ├───────────────┤  │  ← 130px 노출
│  │   카드 3       │  │  ← index=2, bottom: 80px
│  ├───────────────┤  │  ← 130px 노출
│  │   카드 2       │  │  ← index=1, bottom: -50px
│  ├───────────────┤  │
│  │   카드 1       │▄▄│  ← index=0, 12px만 노출
└──┴───────────────┴──┘    (bottom: -124px)
```

#### 카드 1 (index=0) - 거의 숨김

| 항목 | 값 |
|------|-----|
| 높이 | 180px (11.25rem) |
| bottom | -124px (-7.75rem) |
| 노출 | 12px만 보임 |
| borderRadius | 전체 둥근 (45px) |
| zIndex | 가장 높음 (totalCourses) |

#### 카드 2 (index=1) - 기준점

| 항목 | 값 |
|------|-----|
| 높이 | 180px (11.25rem) |
| bottom | -50px (-3.125rem) |
| borderRadius | 상단만 둥근 |
| zIndex | totalCourses - 1 |

#### 카드 3+ (index=2+) - 130px 간격

| 항목 | 값 |
|------|-----|
| 높이 | 180px (11.25rem) |
| bottom 공식 | -50px + (index-1) × 130px |
| 노출 | 130px (180px - 50px 겹침) |
| borderRadius | 상단만 둥근 |
| zIndex | totalCourses - index |

**Bottom 계산 예시:**
- index=2: -50px + 130px = 80px (5rem)
- index=3: -50px + 260px = 210px (13.125rem)
- index=4: -50px + 390px = 340px (21.25rem)

---

## 스택 전체 높이 계산

파일: `card-layout.ts` 라인 133-149, 함수: `getStackHeight()`

```
공식: 9px(상단) + 180px(첫 카드) + (N-1) × 60px(간격) + 9px(하단)
```

| 카드 개수 | 계산 | 높이 |
|-----------|------|------|
| 1개 | 9 + 180 + 0 + 9 | 198px (12.375rem) |
| 2개 | 9 + 180 + 60 + 9 | 258px (16.125rem) |
| 3개 | 9 + 180 + 120 + 9 | 318px (19.875rem) |
| 4개 | 9 + 180 + 180 + 9 | 378px (23.625rem) |

---

## 60vh vs 95vh 동작

바텀시트 높이에 따른 카드 레이아웃 규칙은 **동일**합니다.

| 상태 | 높이 | 특징 |
|------|------|------|
| medium (60vh) | 60vh | 카드가 많으면 스크롤 필요 |
| full (95vh) | 95vh | 더 많은 카드가 화면에 보임 |

`category-full-screen.tsx`에서 구분:
```typescript
isExpanded={snapManager.snapPoint === "full"}  // 95vh일 때 true
```

---

## 바텀시트 구조

파일: `category-full-screen.tsx`

```
┌─────────────────────────────┐
│  헤더 (고정 120px, z-10)      │  ← shrink-0 h-[7.5rem]
│  - 드래그 핸들                 │
│  - 카테고리 타이틀              │
├─────────────────────────────┤
│  카드 영역 (flex-1)           │  ← overflow-y-auto
│  - 스크롤 가능                 │
│  - 하단 정렬 (justify-end)    │
│  ┌───────────────────────┐  │
│  │   카드 스택             │  │
│  │   (RefactoredCourse   │  │
│  │    CardStack)         │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### 헤더 z-index 처리

스크롤 시 카드가 헤더 뒤로 숨겨지도록:
```tsx
<div
  className="shrink-0 h-[7.5rem] relative z-10 rounded-t-[2.8125rem]"
  style={{ backgroundColor: currentDesign.backgroundColor }}
>
```

---

## 콘텐츠 HTML 구조

파일: `course-card.tsx`

```tsx
<div className="flex justify-between items-start w-full h-full">
  {/* 좌측: Title(상단) + 카테고리/난이도(하단) */}
  <div className="flex-1 flex flex-col justify-between h-full">
    <h3 className="font-bold text-black text-lg leading-tight">
      {course.title}
    </h3>
    <div>
      <p className="font-medium text-black text-xs">
        {course.course_categories?.name + "러닝 코스"}
      </p>
      <p className="font-medium text-black text-xs">
        {getDifficultyText(course.difficulty || "medium")}
      </p>
    </div>
  </div>

  {/* 우측: km (수직 중앙) */}
  <div className="text-right flex flex-col items-end justify-center h-full">
    <div className="flex items-baseline">
      <span className="text-distance text-black">
        {Math.round(course.distance_km)}
      </span>
      <span className="text-lg text-black ml-1">km</span>
    </div>
  </div>
</div>
```

---

## 주요 Tailwind 클래스

| 클래스 | 값 | 용도 |
|--------|-----|------|
| `h-[11.25rem]` | 180px | 카드 높이 (통일) |
| `h-[7.5rem]` | 120px | 헤더 높이 |
| `py-[1.875rem]` | 30px 상하 | 카드 패딩 |
| `pt-[1.875rem]` | 30px 상단 | 카드 상단 패딩 |
| `pb-[5rem]` | 80px 하단 | 뒤 카드 하단 (겹침+패딩) |
| `rounded-[2.8125rem]` | 45px | 전체 둥근 모서리 |
| `rounded-t-[2.8125rem]` | 45px | 상단만 둥근 |

---

## 업데이트 이력

- **2025-01-18**: 스펙 재정리
  - 바텀시트 60vh 스크롤 시 카드가 헤더에 가려지는 문제 수정
  - 헤더 고정 높이(7.5rem), z-index, 배경색 추가
  - 카드 스택 height 속성으로 변경 (minHeight → height)
  - 모든 카드 180px 높이로 통일

- **2025-01-03**: 초기 스펙 정리
