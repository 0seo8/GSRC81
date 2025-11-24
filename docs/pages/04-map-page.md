
# Map Page (`/map`)

## 1. 개요

`/map` 페이지는 애플리케이션의 **핵심 지도 화면**으로,
**Mapbox 기반 인터랙티브 지도**,
**코스 마커 표시**,
**카테고리 필터링**,
**코스 상세 보기 및 댓글 시스템**을 제공한다.

Next.js 15의 서버/클라이언트 분리를 효과적으로 적용한 대표적인 페이지이다.

---

## 2. 위치

* **Path:** `/map`
* **File:** `src/app/(main)/map/page.tsx`
* **타입:** Server Component

---

# 3. 주요 기능

## 3-1. 인터랙티브 지도

* Mapbox GL JS 기반 렌더링
* 마커 클러스터링
* 지도 이동/확대/축소 등 실시간 상호작용

## 3-2. 코스 관리

* 모든 활성 코스 표시
* 카테고리 필터링
* 코스 상세 Drawer UI
* 댓글 조회 및 작성

## 3-3. 카테고리 내비게이션

* 하단 Bottom Sheet 기반 카테고리 메뉴
* 카테고리별 코스 목록 표시

---

# 4. 아키텍처 패턴

`page.tsx`는 **Server Component**이며, 지도 관련 기능은 모두 **Client Component**로 분리되어 있다.

```tsx
export default async function MapPage() {
  const [categories, courses] = await Promise.all([
    getCourseCategories(),
    getCourses(),
  ])

  return (
    <ErrorBoundary fallback={<MapError />}>
      <Suspense fallback={<MapSkeleton />}>
        <MapClientWrapper courses={courses} categories={categories} />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### 이 구조의 장점

* 서버에서 데이터 패칭 → 렌더링 성능 최적화
* Mapbox, 상태 관리 등 클라이언트 부담 요소를 분리
* Suspense 및 Error Boundary 포함하여 안정성 강화

---

# 5. 데이터 패칭 전략

## 5-1. 서버에서 패칭 (권장 패턴)

* 코스 데이터와 카테고리 데이터를 **병렬로 가져옴**
* 클라이언트에서 로딩 상태를 관리할 필요 없음
* Next.js 서버 자동 캐싱 적용

### 예시

```ts
const [categories, courses] = await Promise.all([
  getCourseCategories(),
  getCourses(),
])
```

---

# 6. 컴포넌트 구조

```
MapPage (Server)
└── ErrorBoundary
    └── Suspense
        └── MapClientWrapper (Client)
            └── MapProvider (Context)
                └── OptimizedMapClient (Client)
                    ├── Mapbox 지도 렌더링
                    ├── 코스 마커/클러스터링
                    ├── 코스 상세 Drawer
                    ├── 코스 리스트 Drawer
                    └── 카테고리 Bottom Sheet
```

### MapClientWrapper

* 초기 데이터(categories, courses)를 Context로 전달
* Client Component에서 사용할 수 있게 변환

### MapProvider

* 선택된 코스 / 카테고리 관리
* 필터링된 코스 목록 관리
* 지도 상태(zoom, center, bounds) 관리

### OptimizedMapClient

* 실제 지도 렌더링 수행
* 마커 풀링, 클러스터링 등 최적화 적용
* Drawer/Bottom Sheet UI 제어

---

# 7. 서버 → 클라이언트 데이터 흐름

```ts
interface MapClientWrapperProps {
  courses: CourseWithComments[]
  categories: CourseCategory[]
}
```

서버에서 가져온 데이터를 Props로 넘기고,
클라이언트에서 Context 초기값으로 사용.

---

# 8. 이미 구현된 성능 최적화

### ✅ 서버 컴포넌트 사용

* 초기 렌더링 성능 우수
* 데이터 패칭 자동 캐싱

### ✅ 병렬 데이터 패칭

* 두 요청을 동시에 실행하여 지연 최소화

### ✅ Suspense + Error Boundary

* 로딩/에러 핸들링 일원화

### ✅ 지도 클라이언트 최적화

* 마커 풀링
* 재렌더 최소화 구조

---

# 9. 개선 가능 영역

## 9-1. ISR 도입

```ts
export const revalidate = 3600; // 1시간마다 재검증
```

## 9-2. Loading UI 개선

```tsx
// app/(main)/map/loading.tsx
export default function Loading() {
  return <MapSkeleton />
}
```

## 9-3. Partial Prerendering(Next.js 15 실험 기능)

```ts
export const experimental_ppr = true;
```

---

# 10. 에러 처리

## 현재 방식

* try/catch + `<MapError />` 렌더링
* 콘솔 로그만 기록

## 개선 제안

Next.js 기본 `error.tsx` 사용 권장

```tsx
// app/(main)/map/error.tsx
'use client'

export default function Error({ error, reset }) {
  return <MapError error={error} onRetry={reset} />
}
```

---

# 11. 로딩 상태

## 현재

* Suspense에서 `<MapSkeleton />` 사용

## 추천

* `loading.tsx` 파일을 추가하여 자동 처리

---

# 12. 데이터베이스 쿼리

## getCourses()

* 테이블: `courses`
* 조인: `course_categories`, `course_comments`(카운트 포함)
* 필터: `is_active = true`
* 정렬: `created_at DESC`

## getCourseCategories()

* 테이블: `course_categories`
* 필터: `is_active = true`
* 정렬: `sort_order ASC`

---

# 13. 상태 관리 레이어

### 1) 서버 상태

* 카테고리, 코스 데이터
* Next.js에서 캐싱 및 프리렌더링

### 2) 클라이언트 Context(MapProvider)

* 선택된 코스
* 선택된 카테고리
* 필터링된 코스
* 지도 내부 상태

### 3) 로컬 UI 상태

* Drawer 열림/닫힘
* Bottom sheet 위치
* 마우스/터치 인터랙션

---

# 14. 라우트 보호

```ts
if (!isAuthenticated && pathname.startsWith('/(main)')) {
  return redirect('/login');
}
```

`/map`은 인증된 사용자만 접근 가능하며,
middleware에서 자동으로 체크한다.

---

# 15. 성능 분석

### Lighthouse 목표

* **FCP < 1.5s** → 서버 렌더링 덕분에 매우 우수
* **LCP < 2.5s** → 지도 초기 로딩 때문에 약간 부담
* **TTI < 3.5s** → Mapbox 초기화의 영향
* **CLS < 0.1** → 레이아웃 안정적

### 추가 개선 가능

* Mapbox 리소스 preconnect
* 마커 이미지 WebP 변환
* 리스트 가상 스크롤 도입

---

# 16. Next.js 15 기능 활용

### 이미 적용된 기능

* 서버 컴포넌트
* Suspense
* Error Boundary
* 병렬 패칭

### 적용 고려할 기능

* Server Actions (댓글 기능)
* Partial Prerendering
* 로딩/에러 파일 자동 핸들링

---

# 17. 추천 개선 우선순위

## HIGH

1. `loading.tsx`, `error.tsx` 추가
2. ISR 적용
3. 메타데이터 설정(SEO 개선)

## MEDIUM

1. 지도 클라이언트 하위 컴포넌트 분리
2. 댓글 옵티미스틱 업데이트
3. 리스트 가상 스크롤

## LOW

1. Partial Prerendering
2. PWA 기능 추가

---

# 18. 사용 라이브러리

* Mapbox GL JS
* react-map-gl
* Supabase client
* Custom hooks (useMapState, useMarkerPool 등)
* MapProvider

---

# 19. 환경 변수

* `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
* Supabase 서버 클라이언트 설정

---

# 요약

`/map` 페이지는:

* 핵심 지도 UI
* 코스 및 카테고리 데이터 표시
* 서버/클라이언트 분리 아키텍처
* Mapbox 기반 고급 렌더링

을 갖춘 **GSRC81 MAPS의 핵심 서비스 페이지**다.

Next.js 15의 서버 컴포넌트 패턴이 훌륭하게 적용되어 있으며,
ISR·로딩/에러 파일·Partial Prerendering 등 추가 최적화를 통해
더 빠르고 안정적인 서비스로 개선할 수 있다.

