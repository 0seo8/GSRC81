# 카드 레이아웃 스펙 정리

## 개요

맵 페이지 바텀시트의 카드 스택 레이아웃 규칙을 정리한 문서입니다.
모든 카드는 **동일한 콘텐츠 정렬**을 유지합니다.

---

## 핵심 원칙

1. **콘텐츠 영역 70px 통일**: 모든 카드의 콘텐츠 영역은 70px
2. **상하 패딩 30px 통일**: Title 위 30px, 카테고리/난이도 아래 30px
3. **justify-between 정렬**: Title은 상단, 카테고리/난이도는 하단

---

## 카드별 스펙

### 1개 카드

| 항목          | 값                           |
| ------------- | ---------------------------- |
| 높이          | 130px (8.125rem)             |
| 겹침          | -                            |
| 노출          | 130px                        |
| 상단 패딩     | 30px                         |
| 콘텐츠        | 70px                         |
| 하단 패딩     | 30px                         |
| border-radius | 전체 둥근 (45px)             |
| CSS 클래스    | `h-[8.125rem] py-[1.875rem]` |

---

### 2개 카드

#### 첫 번째 카드 (index=0, 앞)

| 항목          | 값                           |
| ------------- | ---------------------------- |
| 높이          | 130px (8.125rem)             |
| bottom        | 0px                          |
| 노출          | 130px                        |
| 상단 패딩     | 30px                         |
| 콘텐츠        | 70px                         |
| 하단 패딩     | 30px                         |
| z-index       | 2 (위)                       |
| border-radius | 전체 둥근 (45px)             |
| CSS 클래스    | `h-[8.125rem] py-[1.875rem]` |

#### 두 번째 카드 (index=1, 뒤)

| 항목          | 값                                     |
| ------------- | -------------------------------------- |
| 높이          | 180px (11.25rem)                       |
| bottom        | 80px (5rem)                            |
| 겹침          | 50px (130 - 80)                        |
| 노출          | 130px (180 - 50)                       |
| 상단 패딩     | 30px                                   |
| 콘텐츠        | 70px                                   |
| 하단 패딩     | 30px                                   |
| pb 계산       | 80px (50px 겹침 + 30px 패딩)           |
| z-index       | 1 (아래)                               |
| border-radius | 상단만 둥근 (45px 45px 0 0)            |
| CSS 클래스    | `h-[11.25rem] pt-[1.875rem] pb-[5rem]` |

---

### 3개 이상 카드

#### 첫 번째 카드 (index=0, 숨김)

| 항목       | 값                  |
| ---------- | ------------------- |
| 높이       | 130px (8.125rem)    |
| bottom     | -124px (-7.75rem)   |
| 노출       | 12px만 보임         |
| z-index    | 가장 높음           |
| CSS 클래스 | `h-[8.125rem] py-5` |

#### 두 번째 카드 (index=1, 맨 앞)

| 항목          | 값                          |
| ------------- | --------------------------- |
| 높이          | 136px (8.5rem)              |
| bottom        | 0px                         |
| 노출          | 136px                       |
| 상단 패딩     | 30px                        |
| 콘텐츠        | 76px                        |
| 하단 패딩     | 30px                        |
| z-index       | totalCourses - 1            |
| border-radius | 상단만 둥근 (45px 45px 0 0) |
| CSS 클래스    | `h-[8.5rem] py-[1.875rem]`  |

#### 세 번째 카드 이상 (index=2+, 뒤)

| 항목          | 값                                     |
| ------------- | -------------------------------------- |
| 높이          | 180px (11.25rem)                       |
| bottom        | (index-1) × 80px                       |
| 겹침          | 50px                                   |
| 노출          | 130px (180 - 50)                       |
| 상단 패딩     | 30px                                   |
| 콘텐츠        | 70px                                   |
| 하단 패딩     | 30px                                   |
| pb 계산       | 80px (50px 겹침 + 30px 패딩)           |
| z-index       | totalCourses - index                   |
| border-radius | 상단만 둥근 (45px 45px 0 0)            |
| CSS 클래스    | `h-[11.25rem] pt-[1.875rem] pb-[5rem]` |

---

## 콘텐츠 정렬 비교표

| 케이스          | 노출  | 상단 패딩 | 콘텐츠 | 하단 패딩 |
| --------------- | ----- | --------- | ------ | --------- |
| 1개 카드        | 130px | 30px      | 70px   | 30px      |
| 2개 - index=0   | 130px | 30px      | 70px   | 30px      |
| 2개 - index=1   | 130px | 30px      | 70px   | 30px      |
| 3개+ - index=1  | 136px | 30px      | 76px   | 30px      |
| 3개+ - index=2+ | 130px | 30px      | 70px   | 30px      |

---

## 파일 구조

```
src/
├── features/map/components/
│   ├── course-card.tsx          # 개별 카드 컴포넌트 (패딩/높이 계산)
│   └── refactored-course-card-stack.tsx  # 카드 스택 컨테이너
├── shared/lib/utils/
│   └── card-layout.ts           # 카드 위치 계산 (bottom, z-index, border-radius)
└── core/config/
    └── category-designs.ts      # 카테고리별 색상 설정
```

---

## 콘텐츠 HTML 구조

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

| 클래스          | 값        | 용도                     |
| --------------- | --------- | ------------------------ |
| `h-[8.125rem]`  | 130px     | 1개/2개 앞 카드 높이     |
| `h-[8.5rem]`    | 136px     | 3개+ index=1 카드 높이   |
| `h-[11.25rem]`  | 180px     | 뒤 카드 높이             |
| `py-[1.875rem]` | 30px 상하 | 앞 카드 패딩             |
| `pt-[1.875rem]` | 30px 상단 | 뒤 카드 상단 패딩        |
| `pb-[5rem]`     | 80px 하단 | 뒤 카드 하단 (겹침+패딩) |
| `leading-tight` | 1.25      | Title 줄간격             |

---

## 업데이트 이력

- **2025-01-03**: 초기 스펙 정리
  - 2개 카드 index=1과 3개+ index=2+ 동일한 레이아웃 적용
  - 모든 카드 상하 패딩 30px, 콘텐츠 70px 통일
