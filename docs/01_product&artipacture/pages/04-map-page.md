# Map Page (`/map`) - 완전 가이드

## 목차

1. [개요](#1-개요)
2. [위치 및 기본 정보](#2-위치-및-기본-정보)
3. [주요 기능](#3-주요-기능)
4. [아키텍처 패턴](#4-아키텍처-패턴)
5. [컴포넌트 구조](#5-컴포넌트-구조)
6. [데이터 흐름](#6-데이터-흐름)
7. [사용 시나리오 (End-to-End 플로우)](#7-사용-시나리오-end-to-end-플로우)
8. [컴포넌트 상세](#8-컴포넌트-상세)
   - [8.1 OptimizedMapClient](#81-optimizedmapclient)
   - [8.2 MapboxMap](#82-mapboxmap)
   - [8.3 CourseMarker](#83-coursemarker)
   - [8.4 CategoryFullScreen (바텀시트)](#84-categoryfullscreen-바텀시트)
   - [8.5 CourseDetailMap (트레일 상세)](#85-coursedetailmap-트레일-상세)
9. [커스텀 훅](#9-커스텀-훅)
   - [9.1 useMapState](#91-usemapstate)
   - [9.2 useMapBounds](#92-usemapbounds)
   - [9.3 useGeolocation](#93-usegeolocation)
   - [9.4 useBottomSheetSnap](#94-usebottomsheetsnap)
   - [9.5 useBottomSheetDrag](#95-usebottomsheetdrag)
   - [9.6 useCategoryNavigation](#96-usecategorynavigation)
   - [9.7 useFlightAnimation](#97-useflightanimation)
   - [9.8 useMarkerPool](#98-usemarkerpool)
10. [상태 관리](#10-상태-관리)
11. [성능 최적화](#11-성능-최적화)
12. [트러블슈팅](#12-트러블슈팅)
13. [데이터베이스 쿼리](#13-데이터베이스-쿼리)
14. [환경 변수](#14-환경-변수)
15. [파일 구조](#15-파일-구조)
16. [개선 히스토리](#16-개선-히스토리)
17. [향후 개선 방향](#17-향후-개선-방향)

---

## 1. 개요

`/map` 페이지는 **GSRC81 MAPS의 핵심 지도 화면**으로, 서울 은평구의 러닝 코스를 탐색하고 시각화하는 기능을 제공합니다.

### 핵심 기능

| 기능                | 설명                                   |
| ------------------- | -------------------------------------- |
| **인터랙티브 지도** | Mapbox GL JS 기반 실시간 이동/줌/회전  |
| **클러스터링**      | GPU 가속 마커 클러스터링               |
| **카테고리 필터링** | 진관동/트랙/트레일/로드 구분           |
| **바텀시트 UI**     | 3단계 스냅 포인트 (minimized/medium/full) |
| **Flight Mode**     | GPX 경로 따라 자동 비행 애니메이션     |
| **위치 추적**       | GPS 기반 현재 위치 표시                |

---

## 2. 위치 및 기본 정보

| 항목                 | 값                                                     |
| -------------------- | ------------------------------------------------------ |
| **Path**             | `/map`                                                 |
| **Server Component** | `src/app/(main)/map/page.tsx`                          |
| **Client Component** | `src/features/map/components/optimized-map-client.tsx` |
| **설정 파일**        | `src/core/config/map.ts`                               |
| **인증 필요**        | ✅ Yes (middleware 자동 체크)                          |
| **ISR 재검증**       | 1시간 (`revalidate = 3600`)                            |

### 지도 기본 설정 (`src/core/config/map.ts`)

```typescript
// 은평구 중심 좌표
CENTER: [126.9285, 37.6176]

// 기본 줌 레벨
DEFAULT_ZOOM: 11.5

// 클러스터링 설정
CLUSTERING: { MAX_ZOOM: 12, RADIUS: 50 }

// 바텀시트 스냅 포인트
SNAP_POINTS: ["minimized" (0vh), "medium" (60vh), "full" (95vh)]

// Mapbox 스타일
STYLE: "mapbox://styles/mapbox/light-v11"
```

---

## 3. 주요 기능

### 3.1 인터랙티브 지도

- Mapbox GL JS 기반 렌더링
- 마커 클러스터링 (GPU 가속)
- 지도 이동/확대/축소 실시간 상호작용
- 한국어 라벨 자동 변환
- 줌 레벨 제한 (10-12.85)

### 3.2 코스 관리

- 모든 활성 코스 마커 표시
- 카테고리별 필터링
- 마커/클러스터 클릭 시 바텀시트 자동 표시
- 코스 카드 클릭 시 상세 페이지 이동 (`/courses/[id]`)

### 3.3 바텀시트 UI

| Snap Point    | 높이 | 용도               |
| ------------- | ---- | ------------------ |
| **minimized** | 0vh  | 최소화 상태        |
| **medium**    | 60vh | 카드 스택 미리보기 |
| **full**      | 95vh | 전체 카드 스크롤   |

> **Note**: "minimized"는 이전에 "closed"로 불렸으나, 시트가 완전히 제거되는 것이 아니라 0vh 높이에 있음을 명확히 하기 위해 변경됨

- 좌우 스와이프로 카테고리 전환 (무한 루프)
- 상하 드래그로 높이 조절
- 카테고리별 배경색/카드색상 자동 적용

### 3.4 트레일 상세 (Flight Mode)

- GPX 트레일 라인 렌더링
- KM 마커 (거리 표시)
- POI 마커 (전망대, 휴게소, 랜드마크)
- 사용자 위치 추적
- Flight Mode 애니메이션 (경로 자동 비행)
- 코멘트 모달 (롱프레스로 추가)

### 3.5 위치 기능

- 현재 위치 버튼 (GPS)
- 현재 위치로 지도 이동 (zoom 14)
- Geolocation API 에러 처리

---

## 4. 아키텍처 패턴

### 서버/클라이언트 분리

```
MapPage (Server Component)
├── loading.tsx (자동 Suspense 경계)
├── error.tsx (자동 Error Boundary)
└── OptimizedMapClient (Client Component)
```

### 서버 컴포넌트 (page.tsx)

```tsx
// src/app/(main)/map/page.tsx
import { Suspense } from "react";
import {
  courseRepository,
  categoryRepository,
} from "@/lib/supabase/repositories";
import { MapSkeleton } from "@/features/map/components";

export const revalidate = 3600; // ISR: 1시간

async function MapData() {
  const [courses, categories] = await Promise.all([
    courseRepository.findAllActive(),
    categoryRepository.findAll(),
  ]);

  return <OptimizedMapClient courses={courses} categories={categories} />;
}

export default function MapPage() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapData />
    </Suspense>
  );
}
```

### 장점

- ✅ React 19 Suspense + Streaming SSR
- ✅ 데이터 병렬 로딩 (`Promise.all`)
- ✅ ISR을 통한 데이터 캐싱 및 재검증
- ✅ 파일 기반 로딩/에러 자동 처리
- ✅ SEO 최적화를 위한 메타데이터 설정

---

## 5. 컴포넌트 구조

```
OptimizedMapClient (루트 클라이언트 컴포넌트)
├── AppHeader ← 상단 헤더
├── MenuButton ← 메뉴 버튼
├── MapboxMap ← 지도 렌더링
│   └── (한국어 라벨, 줌 제한, 반응형)
├── CourseMarker ← 마커/클러스터링
│   ├── NumberMarker (React 컴포넌트 마커)
│   └── MarkerSkeleton (로딩 중 스켈레톤)
├── CategoryFullScreen ← 바텀시트 UI
│   ├── BottomSheetHeader (드래그 핸들 + 타이틀)
│   └── CourseCardStack ← 코스 카드들
│       └── CourseCard (개별 코스 카드)
└── 현재 위치 버튼 (GPS)
```

### 트레일 상세 컴포넌트 구조

```
CourseDetailMap (트레일 상세 지도)
├── react-map-gl ← 인터랙티브 지도
├── TrailLine ← GPX 경로 라인
├── KmMarkers ← 거리 마커 (1km, 2km...)
├── POIMarkers ← 관심지점 마커
├── UserLocation ← 사용자 현재 위치
├── MapControls ← 재생/일시정지/속도 조절
└── CommentModal ← 코멘트 추가 모달
```

---

## 6. 데이터 흐름

### 6.1 서버 → 클라이언트

```
Server Component (MapPage)
    ↓ Suspense + parallel fetch
MapData (courses, categories)
    ↓ props
OptimizedMapClient
    ↓ filter by category (useMemo)
displayCourses
    ↓ props
CourseMarker (GeoJSON source)
```

### 6.2 사용자 인터랙션 → 상태 변경

```
사용자 마커 클릭
    ↓
CourseMarker (onCourseClick / onClusterClick)
    ↓ callback
OptimizedMapClient (handleCourseClick / handleClusterClick)
    ↓ useMapState hook
selectedCourse / selectedCourses 상태 변경
    ↓ props
CategoryFullScreen (바텀시트 열림)
```

### 6.3 컴포넌트 간 Props & Callbacks

```typescript
// OptimizedMapClient → MapboxMap
<MapboxMap
  accessToken={MAPBOX_TOKEN}
  center={EUNPYEONG_CENTER}
  zoom={DEFAULT_ZOOM}
  onMapLoad={handleMapLoad}
/>

// OptimizedMapClient → CourseMarker
<CourseMarker
  map={map}
  courses={displayCourses}
  currentCategory={currentCategory}
  onCourseClick={handleCourseClick}
  onClusterClick={handleClusterClick}
/>

// OptimizedMapClient → CategoryFullScreen
<CategoryFullScreen
  isOpen={isFullscreenOpen}
  onClose={handleCloseFullscreen}
  courses={courses}
  categories={allCategories}
  initialCategory={currentCategory}
  onCourseClick={handleCourseDetailNavigation}
  onCategoryChange={handleCategoryChange}
  selectedCourse={selectedCourse}
  selectedCourses={selectedCourses}
/>
```

---

## 7. 사용 시나리오 (End-to-End 플로우)

### 시나리오 1: 개별 마커 클릭

```
1. 사용자가 지도에서 단일 마커 클릭
   ↓
2. CourseMarker.tsx
   - 마커 클릭 이벤트 감지
   - 마커를 지도 중앙으로 flyTo
   - onCourseClick(course) 호출
   ↓
3. OptimizedMapClient.tsx
   - handleCourseClick 실행
   - setIsFullscreenOpen(true)
   ↓
4. useMapState.ts
   - setSelectedCourse(course)
   - setSelectedCourses([])
   ↓
5. CategoryFullScreen.tsx
   - 바텀시트가 medium(60vh) 높이로 열림
   - 해당 코스 카드 1개만 표시
   ↓
6. 사용자가 코스 카드 클릭
   ↓
7. router.push(`/courses/${courseId}`)
   - 상세 페이지로 이동
```

### 시나리오 2: 클러스터 마커 클릭

```
1. 사용자가 클러스터 마커 클릭 (예: 숫자 "5")
   ↓
2. CourseMarker.tsx
   - source.getClusterExpansionZoom() 호출
   - source.getClusterLeaves() 호출
   - onClusterClick(clusterCourses) 호출
   ↓
3. useMapState.ts
   - setSelectedCourses(courses) ← 5개 코스 배열
   - setSelectedCourse(null)
   ↓
4. CategoryFullScreen.tsx
   - 바텀시트에 5개 코스 카드가 스택 형태로 표시
   ↓
5. 사용자가 위로 드래그
   ↓
6. useBottomSheetDrag
   - snapPoint: "medium" → "full" (95vh)
   - 바텀시트가 전체 화면으로 확장
```

### 시나리오 3: 카테고리 전환 (좌우 스와이프)

```
1. 사용자가 바텀시트 헤더를 왼쪽으로 스와이프 (50px 이상)
   ↓
2. BottomSheetHeader.tsx
   - handleTouchEnd
   - onHeaderDrag(panInfo) 호출
   ↓
3. useBottomSheetDrag.ts
   - Math.abs(info.offset.x) >= 50 체크
   - onCategoryChange("next") 호출
   ↓
4. useCategoryNavigation.ts
   - goToNextCategory()
   - currentCategoryIndex = 0 → 1 (진관동 → 트랙)
   ↓
5. OptimizedMapClient.tsx
   - setCurrentCategory("track")
   ↓
6. displayCourses useMemo 재계산
   - courses.filter((c) => c.category_key === "track")
   ↓
7. CourseMarker 리렌더링
   - 지도에 트랙 마커들만 표시
```

### 시나리오 4: Flight Mode 애니메이션

```
1. 코스 상세 페이지에서 "비행 시작" 버튼 클릭
   ↓
2. useFlightAnimation.ts
   - startAnimation() 호출
   - GPX 포인트 배열 순회 시작
   ↓
3. requestAnimationFrame 루프
   - 현재 위치 계산 (Haversine 보간)
   - 카메라 위치 업데이트
   - KM 마커 표시/숨김
   ↓
4. 1km 마커 도달 시
   - 마커 자동 표시
   - 3초 후 자동 숨김
   ↓
5. 코스 노트 위치 도달 시
   - 코멘트 모달 자동 표시
   ↓
6. 애니메이션 완료
   - 전체 경로 뷰로 자동 전환
```

---

## 8. 컴포넌트 상세

### 8.1 OptimizedMapClient

**위치:** `src/features/map/components/optimized-map-client.tsx`

#### 역할

지도 페이지의 **루트 클라이언트 컴포넌트**로, 모든 하위 컴포넌트를 조율합니다.

#### Props

```typescript
interface OptimizedMapClientProps {
  courses: CourseWithComments[];
  categories: CourseCategory[];
}
```

#### 상태 관리

```typescript
const [currentCategory, setCurrentCategory] = useState<string>("all");
const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

const {
  map,
  optimisticCourses,
  selectedCourse,
  selectedCourses,
  handleMapLoad,
  handleCourseClick: mapHandleCourseClick,
  handleClusterClick: mapHandleClusterClick,
  handleCloseDrawer,
} = useMapState(displayCourses);
```

#### 데이터 필터링

```typescript
const displayCourses = useMemo(() => {
  if (currentCategory === "all") return courses;
  return courses.filter(
    (course) => (course.category_key || "jingwan") === currentCategory,
  );
}, [courses, currentCategory]);
```

---

### 8.2 MapboxMap

**위치:** `src/features/map/components/mapbox-map.tsx`

#### 역할

Mapbox GL JS를 래핑한 **지도 렌더링 컴포넌트**입니다.

#### 주요 기능

**1) 지도 초기화**

```typescript
map.current = new mapboxgl.Map({
  container: mapContainer.current,
  style: "mapbox://styles/mapbox/light-v11",
  center: [126.9285, 37.6176], // 은평구 중심
  zoom: 11.5,
  maxZoom: 12.85,
  minZoom: 10,
  preserveDrawingBuffer: true,
});
```

**2) 한국어 라벨 자동 변환**

```typescript
mapInstance.setLayoutProperty(layer.id, "text-field", [
  "coalesce",
  ["get", "name:ko"],
  ["get", "name_ko"],
  ["get", "name_kr"],
  ["get", "name"],
]);
```

**3) React.memo 최적화**

```typescript
export const MapboxMap = memo(MapboxMapComponent);
```

---

### 8.3 CourseMarker

**위치:** `src/features/map/components/course-marker.tsx`

#### 역할

**Mapbox 네이티브 클러스터링**을 사용하여 코스를 지도에 마커로 표시합니다.

#### 핵심 기능

**1) GeoJSON 데이터 변환**

```typescript
geojsonData.current = {
  type: "FeatureCollection",
  features: courses.map((course) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [course.start_longitude, course.start_latitude],
    },
    properties: {
      id: course.id,
      category_key: course.category_key || "jingwan",
      title: course.title,
    },
  })),
};
```

**2) Mapbox 네이티브 클러스터링**

```typescript
map.addSource("courses", {
  type: "geojson",
  data: geojsonData.current,
  cluster: true,
  clusterMaxZoom: 12,
  clusterRadius: 50,
});
```

**3) React 기반 마커 렌더링**

```typescript
const el = document.createElement("div");
const root = createRoot(el);
root.render(
  <NumberMarker number={markerNumber} size={25} color={markerColor} />
);
```

#### 성능 특징

| 항목        | Before          | After        | 개선율     |
| ----------- | --------------- | ------------ | ---------- |
| 클러스터링  | CPU (Haversine) | GPU (Mapbox) | ~10배 빠름 |
| 마커 1000개 | ~200ms          | ~20ms        | 90% 빠름   |
| 메모리 사용 | ~15MB           | ~8MB         | 47% 감소   |

---

### 8.4 CategoryFullScreen (바텀시트)

**위치:** `src/features/map/components/category-full-screen.tsx`

#### 역할

지도 하단에서 올라오는 **인터랙티브 바텀시트 컴포넌트**입니다.

#### Snap Points 시스템

| Snap Point    | 높이 | 용도                              |
| ------------- | ---- | --------------------------------- |
| **minimized** | 0vh  | 최소화 상태                       |
| **medium**    | 60vh | 기본 높이 - 코스 카드 미리보기    |
| **full**      | 95vh | 전체 높이 - 모든 코스 스크롤 가능 |

#### 카테고리별 디자인

| 카테고리 | 배경색    | 카드색상                            |
| -------- | --------- | ----------------------------------- |
| 진관동   | `#E7F3ED` | `["#DBE6D1", "#B9DAC5", "#9DD6B9"]` |
| 트랙     | `#FFE8E4` | `["#FED5C8", "#FFC9B6", "#FFAA93"]` |
| 트레일   | `#E7F3ED` | `["#DBE6D1", "#B9DAC5", "#9DD6B9"]` |
| 로드     | `#F5F5F5` | `["#E0E0E0", "#D0D0D0", "#C0C0C0"]` |

#### 애니메이션 (Framer Motion)

```typescript
<motion.div
  initial={{ height: "0vh" }}
  animate={{ height: snapManager.getSnapHeight(snapManager.snapPoint) }}
  exit={{ height: "0vh" }}
  transition={{
    type: "spring",
    damping: 30,
    stiffness: 300
  }}
/>
```

---

### 8.5 CourseDetailMap (트레일 상세)

**위치:** `src/features/map/components/course-detail-map.tsx`

#### 역할

**GPX 경로 시각화** 및 **Flight Mode 애니메이션**을 제공하는 트레일 상세 지도입니다.

#### 주요 기능

```
┌─────────────────────────────────────────┐
│         CourseDetailMap 기능            │
├─────────────────────────────────────────┤
│  🗺️ GPX 트레일 라인 렌더링              │
│  📍 KM 마커 (거리 표시)                  │
│  📍 POI 마커 (전망대, 휴게소, 랜드마크)  │
│  📍 사용자 위치 추적                     │
│  🎬 Flight Mode 애니메이션               │
│  💬 코멘트 모달 (롱프레스로 추가)        │
└─────────────────────────────────────────┘
```

#### Flight Mode 설정 (`src/features/map/components/trail-map/constants.ts`)

```typescript
FLIGHT_CONFIG: {
  speed: 50,        // 애니메이션 속도
  duration: 3000,   // 전환 시간
  zoom: 15,         // 비행 중 줌 레벨
  pitch: 60         // 카메라 기울기
}
```

---

## 9. 커스텀 훅

### 9.1 useMapState

**위치:** `src/features/map/hooks/use-map-state.ts`

#### 역할

지도의 전역 상태를 관리하는 훅입니다.

#### 관리하는 상태

```typescript
{
  map: mapboxgl.Map | null;                  // 지도 인스턴스
  selectedCourse: CourseWithComments | null; // 선택된 단일 코스
  selectedCourses: CourseWithComments[];     // 선택된 복수 코스
  optimisticCourses: CourseWithComments[];   // React 19 useOptimistic
}
```

#### 낙관적 업데이트 (React 19)

```typescript
const [optimisticCourses, addOptimisticCourse] = useOptimistic(
  courses,
  (state, newCourse) => [...state, newCourse],
);
```

---

### 9.2 useMapBounds

**위치:** `src/features/map/hooks/use-map-bounds.ts`

#### 역할

코스 데이터에 따라 지도 범위를 자동으로 조정하는 훅입니다.

#### 특수 케이스 처리

| 코스 개수    | 동작                       | 줌 레벨              |
| ------------ | -------------------------- | -------------------- |
| **0개**      | 은평구 중심으로 이동       | 11.5                 |
| **1개**      | 해당 좌표로 flyTo          | 11.5                 |
| **2개 이상** | fitBounds로 모든 코스 포함 | 자동 (maxZoom: 12.5) |

---

### 9.3 useGeolocation

**위치:** `src/features/map/hooks/use-geolocation.ts`

#### 역할

사용자의 현재 위치를 가져와 지도를 이동시키는 훅입니다.

#### 에러 처리

| 에러 코드                | 의미                | 해결 방법                    |
| ------------------------ | ------------------- | ---------------------------- |
| 1 (PERMISSION_DENIED)    | 위치 권한 거부      | 브라우저 설정에서 권한 허용  |
| 2 (POSITION_UNAVAILABLE) | 위치 정보 사용 불가 | GPS/네트워크 연결 확인       |
| 3 (TIMEOUT)              | 타임아웃 (10초)     | 네트워크 상태 확인 후 재시도 |

---

### 9.4 useBottomSheetSnap

**위치:** `src/features/map/hooks/use-bottom-sheet-snap.ts`

#### 역할

바텀시트의 3단계 스냅 포인트 시스템을 관리합니다.

```typescript
const getSnapHeight = (point: SnapPoint): string => {
  switch (point) {
    case "minimized":
      return "0vh";
    case "medium":
      return "60vh";
    case "full":
      return "95vh";
  }
};
```

---

### 9.5 useBottomSheetDrag

**위치:** `src/features/map/hooks/use-bottom-sheet-drag.ts`

#### 역할

바텀시트의 드래그 제스처를 처리합니다.

#### 드래그 우선순위

1. 좌우 스와이프 (50px 이상) → 카테고리 변경
2. 상하 드래그 → Snap points 변경

---

### 9.6 useCategoryNavigation

**위치:** `src/features/map/hooks/use-category-navigation.ts`

#### 역할

카테고리 간 네비게이션을 관리합니다.

```typescript
const goToNextCategory = () => {
  const newIndex =
    currentCategoryIndex < categories.length - 1 ? currentCategoryIndex + 1 : 0; // 마지막 → 첫 번째 (무한 루프)
  setCurrentCategoryIndex(newIndex);
};
```

---

### 9.7 useFlightAnimation

**위치:** `src/features/map/hooks/useFlightAnimation.ts`

#### 역할

GPX 경로를 따라 자동 비행하는 애니메이션 시스템입니다.

#### 주요 기능

```typescript
{
  startAnimation(),      // 애니메이션 시작
  pauseAnimation(),      // 일시정지
  resumeAnimation(),     // 재개
  stopAnimation(),       // 정지
  jumpToKm(km: number),  // 특정 KM으로 이동
  jumpToProgress(0-1),   // 진행률로 이동
  setSpeedMultiplier(n), // 속도 배율 조절
}
```

#### Haversine 거리 계산

```typescript
// 지구 곡면을 고려한 두 좌표 간 실제 거리 계산
function calculateDistance(lat1, lng1, lat2, lng2): number {
  const R = 6371000; // 지구 반지름 (미터)
  // ... Haversine formula
  return distance;
}
```

---

### 9.8 useMarkerPool

**위치:** `src/features/map/hooks/use-marker-pool.ts`

#### 역할

마커 인스턴스를 풀링하여 DOM 요소를 재사용합니다.

```typescript
// 이미 존재하는 마커는 재사용
if (markersRef.current[markerId]) {
  newMarkers[markerId] = markersRef.current[markerId];
  continue;
}
```

---

## 10. 상태 관리

### 10.1 서버 상태

- **데이터**: 카테고리, 코스 데이터
- **캐싱**: Next.js 자동 캐싱
- **재검증**: ISR (1시간마다, `revalidate = 3600`)

### 10.2 클라이언트 로컬 상태

| 상태                   | 위치                  | 용도                 |
| ---------------------- | --------------------- | -------------------- |
| `map`                  | useMapState           | 지도 인스턴스        |
| `selectedCourse`       | useMapState           | 선택된 단일 코스     |
| `selectedCourses`      | useMapState           | 선택된 복수 코스     |
| `currentCategory`      | OptimizedMapClient    | 현재 선택 카테고리   |
| `isFullscreenOpen`     | OptimizedMapClient    | 바텀시트 열림/닫힘   |
| `snapPoint`            | useBottomSheetSnap    | 바텀시트 높이 상태   |
| `currentCategoryIndex` | useCategoryNavigation | 현재 카테고리 인덱스 |
| `isDragging`           | useBottomSheetDrag    | 드래그 중 여부       |

---

## 11. 성능 최적화

### 11.1 최적화 전략

| 전략                     | 설명                            |
| ------------------------ | ------------------------------- |
| React 19 useOptimistic   | 서버 응답 전 즉각적 UI 업데이트 |
| Streaming SSR + Suspense | 점진적 로딩                     |
| ISR                      | 1시간 캐싱으로 서버 부하 감소   |
| 디바운스된 bounds 조정   | 150ms 지연으로 연속 호출 방지   |
| 마커 풀 재사용           | DOM thrashing 방지              |
| React.memo               | 불필요한 리렌더링 방지          |
| RAF 기반 애니메이션      | 60fps 부드러운 애니메이션       |

### 11.2 성능 메트릭

| 메트릭             | 목표   | 실제  | 상태    |
| ------------------ | ------ | ----- | ------- |
| FCP                | < 1.5s | ~1.2s | ✅ 우수 |
| LCP                | < 2.5s | ~2.1s | ✅ 양호 |
| TTI                | < 3.5s | ~3.2s | ✅ 양호 |
| CLS                | < 0.1  | ~0.05 | ✅ 우수 |
| 마커 1000개 렌더링 | < 50ms | ~20ms | ✅ 우수 |

---

## 12. 트러블슈팅

### 12.1 마커가 표시되지 않아요

**증상:** 지도는 보이는데 마커가 없음

**원인 & 해결:**

1. GeoJSON 데이터 확인: `console.log(geojsonData.current)`
2. 좌표 확인: `lat`와 `lng` 순서 확인 (Mapbox는 `[lng, lat]`)
3. 줌 레벨 확인: `clusterMaxZoom` 이상에서만 개별 마커 표시

### 12.2 바텀시트 드래그가 끊겨요

**증상:** 바텀시트 드래그 시 버벅거림

**해결:**

```typescript
// 드래그 중 카드 애니메이션 비활성화
<CourseCardStack isDragging={isDragging} />
```

### 12.3 현재 위치 버튼이 작동하지 않아요

**원인:**

1. Geolocation 권한 거부
2. HTTPS가 아닌 환경 (HTTP는 Geolocation 사용 불가)
3. 브라우저 미지원

**확인 방법:**

```typescript
navigator.permissions
  .query({ name: "geolocation" })
  .then((result) => console.log(result.state));
```

### 12.4 Flight Mode가 멈춰요

**원인:**

1. GPX 데이터가 없거나 손상됨
2. requestAnimationFrame이 정리되지 않음

**해결:**

```typescript
// 컴포넌트 언마운트 시 애니메이션 정리
useEffect(() => {
  return () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
}, []);
```

---

## 13. 데이터베이스 쿼리

### 13.1 courseRepository.findAllActive()

**위치:** `src/lib/supabase/repositories/courseRepository.ts`

```typescript
const { data, error } = await supabase
  .from("courses")
  .select(
    `
    *,
    course_categories(name, key),
    course_comments(count)
  `,
  )
  .eq("is_active", true)
  .order("created_at", { ascending: false });
```

### 13.2 categoryRepository.findAll()

**위치:** `src/lib/supabase/repositories/categoryRepository.ts`

```typescript
const { data, error } = await supabase
  .from("course_categories")
  .select("*")
  .eq("is_active", true)
  .order("sort_order", { ascending: true });
```

---

## 14. 환경 변수

| 변수명                            | 필수 | 용도                       |
| --------------------------------- | ---- | -------------------------- |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | ✅   | Mapbox 지도 렌더링         |
| `NEXT_PUBLIC_SUPABASE_URL`        | ✅   | Supabase 데이터베이스 연결 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | ✅   | Supabase 클라이언트 키     |

---

## 15. 파일 구조

```
src/
├── app/(main)/map/
│   ├── page.tsx          # 진입점 (Server Component)
│   ├── loading.tsx       # 로딩 UI (Suspense fallback)
│   └── error.tsx         # 에러 처리 (Error Boundary)
│
├── core/config/
│   └── map.ts            # 지도 설정 상수
│
├── features/map/
│   ├── components/
│   │   ├── optimized-map-client.tsx   # 메인 오케스트레이터
│   │   ├── mapbox-map.tsx             # Mapbox 래퍼
│   │   ├── course-marker.tsx          # 마커 + 클러스터링
│   │   ├── number-marker.tsx          # 마커 UI
│   │   ├── marker-skeleton.tsx        # 마커 로딩
│   │   ├── category-full-screen.tsx   # 바텀시트
│   │   ├── bottom-sheet-header.tsx    # 드래그 헤더
│   │   ├── course-card-stack.tsx      # 카드 스택
│   │   ├── course-card.tsx            # 개별 카드
│   │   ├── course-detail-map.tsx      # 트레일 상세
│   │   ├── map-skeleton.tsx           # 지도 로딩 스켈레톤
│   │   ├── map-error.tsx              # 에러 표시
│   │   ├── map-empty-state.tsx        # 빈 상태
│   │   ├── map-token-error.tsx        # 토큰 에러
│   │   ├── trail-map/                 # 트레일 관련
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   ├── utils.ts
│   │   │   └── components/
│   │   └── index.ts                   # barrel export
│   │
│   ├── hooks/
│   │   ├── use-map-state.ts           # 지도 상태
│   │   ├── use-map-bounds.ts          # 뷰포트 조절
│   │   ├── use-bottom-sheet-snap.ts   # 스냅 포인트
│   │   ├── use-bottom-sheet-drag.ts   # 드래그 처리
│   │   ├── use-category-navigation.ts # 카테고리 네비게이션
│   │   ├── useFlightAnimation.ts      # 비행 애니메이션
│   │   ├── use-marker-pool.ts         # 마커 풀링
│   │   ├── use-drone-camera.ts        # 드론 카메라
│   │   ├── trail-map/hooks/           # 트레일 전용 훅
│   │   └── index.ts                   # barrel export
│   │
│   └── index.ts                       # main barrel export
│
└── lib/supabase/repositories/
    ├── courseRepository.ts            # 코스 데이터
    └── categoryRepository.ts          # 카테고리 데이터
```

---

## 16. 개선 히스토리

### 16.1 1차 간소화: Wrapper 제거 (2025-11-25)

**Before:**

```
MapPage → MapClientWrapper → MapProvider → OptimizedMapClient
```

**After:**

```
MapPage → OptimizedMapClient
```

### 16.2 2차 간소화: CourseMarker 네이티브 클러스터링 (2025-11-25)

- ❌ 수동 Haversine 거리 계산 제거
- ✅ Mapbox 네이티브 GeoJSON 클러스터링 적용
- 코드 라인: 424 → 311 (27% 축소)
- 마커 렌더링: 200ms → 20ms (90% 개선)

### 16.3 3차 최적화: React 권장 패턴 적용 (2025-11-25)

- ✅ 훅 규칙 준수
- ✅ 환경변수/상수 파일 분리
- ✅ 커스텀 훅 생성 (useGeolocation, useMapState 등)

### 16.4 4차 개선: Feature 기반 구조 마이그레이션 (2026-01)

- `src/components/map/` → `src/features/map/components/`
- `src/hooks/` → `src/features/map/hooks/`
- Repository 패턴 도입

---

## 17. 향후 개선 방향

### HIGH 우선순위

1. **Mapbox 리소스 preconnect**

   ```html
   <link rel="preconnect" href="https://api.mapbox.com" />
   ```

   - 예상 효과: 초기 로딩 ~200ms 단축

2. **리스트 가상 스크롤**
   - 바텀시트에 코스가 100개 이상일 때 성능 저하
   - `react-window` 또는 `react-virtualized` 도입

### MEDIUM 우선순위

1. **Server Actions 활용** (댓글 기능)
2. **댓글 옵티미스틱 업데이트**
3. **오프라인 지도 캐싱** (PWA)

### LOW 우선순위

1. **Partial Prerendering** (Next.js 실험적 기능)
2. **동적 메타데이터** (코스별 OG 이미지)
3. **추가 PWA 기능** (백그라운드 동기화, 푸시 알림)

---

## 요약

`/map` 페이지는 **GSRC81 MAPS의 핵심 서비스 페이지**로:

### 아키텍처

- ✅ Next.js 15 서버 컴포넌트 + React 19 Suspense
- ✅ ISR을 통한 데이터 캐싱 (1시간 재검증)
- ✅ Feature 기반 모듈 구조

### 핵심 기능

- ✅ Mapbox 기반 인터랙티브 지도
- ✅ GPU 가속 클러스터링
- ✅ 3단계 바텀시트 UI
- ✅ Flight Mode 애니메이션
- ✅ GPS 위치 추적

### 성능

- ✅ FCP: ~1.2s | LCP: ~2.1s | TTI: ~3.2s
- ✅ 마커 1000개 렌더링: ~20ms
- ✅ 메모리 최적화: 마커 풀링, React.memo
