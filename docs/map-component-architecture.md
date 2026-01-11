# GSRC81 Map Component Architecture
> 지도 컴포넌트 아키텍처 문서

**Version**: 1.0.0
**Last Updated**: 2026-01-11

---

## 1. 컴포넌트 계층 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                     page.tsx (Server Component)                  │
│                         ISR: 3600s                               │
├─────────────────────────────────────────────────────────────────┤
│                           Suspense                               │
│                        ↓ fallback: MapSkeleton                   │
├─────────────────────────────────────────────────────────────────┤
│                    OptimizedMapClient                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ State:                                                       ││
│  │ - currentCategory: string                                    ││
│  │ - isFullscreenOpen: boolean                                  ││
│  │ - isAtCurrentLocation: boolean                               ││
│  │ - bottomSheetSnapPoint: SnapPoint                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                              ↓                                   │
│  ┌─────────────┬─────────────┬─────────────┬───────────────────┐│
│  │ MapboxMap   │ CourseMarker│ LocationBtn │ CategoryFullScreen││
│  └─────────────┴─────────────┴─────────────┴───────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 주요 컴포넌트 상세

### 2.1 MapboxMap
**파일**: `src/features/map/components/mapbox-map.tsx`

**역할**: Mapbox GL JS 래퍼 컴포넌트

**Props**:
| Prop | Type | 설명 |
|------|------|------|
| accessToken | string | Mapbox API 토큰 |
| center | [number, number] | 초기 중심 좌표 |
| zoom | number | 초기 줌 레벨 |
| style | string | 맵 스타일 URL |
| onMapLoad | (map) => void | 로드 완료 콜백 |

**특징**:
- 한국어 라벨 자동 적용
- `preserveDrawingBuffer: true` (스크린샷용)
- React.memo로 불필요한 리렌더링 방지

---

### 2.2 CourseMarker
**파일**: `src/features/map/components/course-marker.tsx`

**역할**: 코스 마커 및 클러스터링 관리

**Props**:
| Prop | Type | 설명 |
|------|------|------|
| map | mapboxgl.Map | 맵 인스턴스 |
| courses | CourseWithCategory[] | 표시할 코스 목록 |
| currentCategory | string | 현재 카테고리 |
| snapPoint | SnapPoint | 바텀시트 스냅 상태 |
| onCourseClick | (course) => void | 코스 클릭 핸들러 |
| onClusterClick | (courses) => void | 클러스터 클릭 핸들러 |

**클러스터링 설정**:
```typescript
{
  cluster: true,
  clusterMaxZoom: 12,
  clusterRadius: 50,
}
```

**마커 오프셋 계산** (BUG-001 수정):
```typescript
const getMarkerOffset = (snapPoint: SnapPoint): number => {
  const offsets: Record<SnapPoint, number> = {
    closed: 0,      // 바텀시트 닫힘
    medium: 0.3,    // 60vh
    full: 0.475,    // 95vh
  };
  return -(window.innerHeight * offsets[snapPoint]);
};
```

---

### 2.3 CategoryFullScreen (BottomSheet)
**파일**: `src/features/map/components/category-full-screen.tsx`

**역할**: 바텀시트 UI 및 코스 카드 표시

**Props**:
| Prop | Type | 설명 |
|------|------|------|
| isOpen | boolean | 열림 상태 |
| onClose | () => void | 닫기 콜백 |
| courses | CourseWithCategory[] | 전체 코스 |
| categories | CourseCategory[] | 카테고리 목록 |
| onCourseClick | (courseId) => void | 코스 클릭 |
| onSnapPointChange | (snapPoint) => void | 스냅 변경 콜백 |
| selectedCourse | CourseWithCategory | 선택된 단일 코스 |
| selectedCourses | CourseWithCategory[] | 선택된 복수 코스 |

**스냅 포인트**:
| 상태 | 높이 | 설명 |
|------|------|------|
| closed | 0vh | 완전히 닫힘 |
| medium | 60vh | 기본 상태 |
| full | 95vh | 전체 화면 |

**하위 컴포넌트**:
```
CategoryFullScreen
├── BottomSheetHeader (드래그 핸들)
└── RefactoredCourseCardStack
    └── CourseCard[] (스태킹 애니메이션)
```

---

## 3. 훅 (Hooks)

### 3.1 useMapState
**파일**: `src/features/map/hooks/use-map-state.ts`

**역할**: 맵 인스턴스 및 선택 상태 관리

**반환값**:
```typescript
{
  map: mapboxgl.Map | null;
  optimisticCourses: CourseWithCategory[];
  selectedCourse: CourseWithCategory | null;
  selectedCourses: CourseWithCategory[];
  handleMapLoad: (map: mapboxgl.Map) => void;
  handleCourseClick: (course: CourseWithCategory) => void;
  handleClusterClick: (courses: CourseWithCategory[]) => void;
  handleCloseDrawer: () => void;
}
```

---

### 3.2 useMapBounds
**파일**: `src/features/map/hooks/use-map-bounds.ts`

**역할**: 코스 좌표에 맞춰 지도 범위 조정

**특징** (BUG-003 수정):
- 150ms 디바운스 적용
- 빠른 카테고리 전환 시 마지막 상태만 반영

```typescript
const debouncedFitMapToCourses = useDebouncedCallback(fitMapToCourses, 150);
```

---

### 3.3 useBottomSheetSnap
**파일**: `src/features/map/hooks/use-bottom-sheet-snap.ts`

**역할**: 바텀시트 스냅 포인트 관리

**반환값**:
```typescript
{
  snapPoint: SnapPoint;
  setSnapPoint: (point: SnapPoint) => void;
  getSnapHeight: (point: SnapPoint) => string;
  snapToNext: () => void;
  snapToPrev: () => void;
  handleDragEnd: (offsetY: number, velocityY: number) => void;
}
```

---

### 3.4 useBottomSheetDrag
**파일**: `src/features/map/hooks/use-bottom-sheet-drag.ts`

**역할**: 드래그 제스처 처리

**임계값**:
- 드래그 거리: 100px
- 드래그 속도: 500px/s

---

### 3.5 useGeolocation
**파일**: `src/shared/hooks/use-geolocation.ts`

**역할**: 현재 위치 추적

**옵션**:
```typescript
{
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
}
```

---

## 4. 데이터 흐름

### 4.1 초기 로딩
```
1. page.tsx (Server)
   ↓ courseRepository.getActiveCourses()
   ↓ categoryRepository.getActiveCategories()
2. OptimizedMapClient (Client)
   ↓ useMapState 초기화
   ↓ MapboxMap 렌더링
3. MapboxMap.onLoad
   ↓ handleMapLoad 호출
   ↓ map 인스턴스 저장
4. CourseMarker
   ↓ GeoJSON 소스 생성
   ↓ 클러스터/마커 렌더링
```

### 4.2 마커 클릭
```
1. CourseMarker.onClick
   ↓ getMarkerOffset(snapPointRef.current)
   ↓ map.flyTo({ offset })
   ↓ onCourseClick(course)
2. OptimizedMapClient
   ↓ mapHandleCourseClick(course)
   ↓ setIsFullscreenOpen(true)
3. CategoryFullScreen
   ↓ snapManager.setSnapPoint("medium")
   ↓ onSnapPointChange("medium")
4. OptimizedMapClient
   ↓ setBottomSheetSnapPoint("medium")
```

### 4.3 카테고리 전환
```
1. MenuButton.onCategorySelect
   ↓ handleCategoryChange(categoryKey)
2. OptimizedMapClient
   ↓ setCurrentCategory(categoryKey)
   ↓ displayCourses 재계산 (useMemo)
3. useMapBounds
   ↓ debouncedFitMapToCourses() (150ms 후)
   ↓ map.fitBounds(bounds)
4. CourseMarker
   ↓ GeoJSON 데이터 업데이트
   ↓ 마커 재생성
```

---

## 5. 성능 최적화

### 5.1 적용된 최적화
| 기법 | 위치 | 설명 |
|------|------|------|
| React.memo | MapboxMap, CourseMarker | 불필요한 리렌더링 방지 |
| useMemo | displayCourses | 필터링 결과 캐싱 |
| useCallback | 모든 핸들러 | 함수 참조 안정화 |
| useRef | 이벤트 핸들러 | 클로저 업데이트 |
| 디바운스 | useMapBounds | 빠른 연속 호출 방지 |
| ISR | page.tsx | 서버 캐싱 (3600s) |

### 5.2 마커 렌더링 최적화
- Mapbox 네이티브 클러스터링 사용
- React Portal 대신 createRoot 사용
- 화면 밖 마커 자동 제거

---

## 6. 파일 구조

```
src/features/map/
├── components/
│   ├── mapbox-map.tsx           # Mapbox 래퍼
│   ├── course-marker.tsx        # 마커 + 클러스터링
│   ├── optimized-map-client.tsx # 메인 클라이언트
│   ├── category-full-screen.tsx # 바텀시트
│   ├── bottom-sheet-header.tsx  # 헤더
│   ├── course-card.tsx          # 개별 카드
│   ├── refactored-course-card-stack.tsx # 카드 스택
│   ├── number-marker.tsx        # 숫자 마커
│   ├── marker-skeleton.tsx      # 로딩 스켈레톤
│   ├── map-skeleton.tsx         # 페이지 스켈레톤
│   ├── map-error.tsx            # 에러 UI
│   ├── map-empty-state.tsx      # 빈 상태
│   └── map-token-error.tsx      # 토큰 에러
│
├── hooks/
│   ├── use-map-state.ts         # 맵 상태
│   ├── use-map-bounds.ts        # 바운드 조정
│   ├── use-bottom-sheet-snap.ts # 스냅 포인트
│   ├── use-bottom-sheet-drag.ts # 드래그 제스처
│   └── use-category-navigation.ts # 카테고리 네비게이션
│
└── types/
    └── index.ts
```

---

## 7. 타입 정의

### 7.1 SnapPoint
```typescript
type SnapPoint = "closed" | "medium" | "full";
```

### 7.2 CourseMarkerProps
```typescript
interface CourseMarkerProps {
  map: mapboxgl.Map;
  courses: CourseWithCategory[];
  currentCategory?: string;
  snapPoint?: SnapPoint;
  onCourseClick?: (course: CourseWithCategory) => void;
  onClusterClick?: (courses: CourseWithCategory[]) => void;
}
```

### 7.3 CategoryFullScreenProps
```typescript
interface CategoryFullScreenProps {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseWithCategory[];
  categories: CourseCategory[];
  initialCategory?: string;
  onCourseClick: (courseId: string) => void;
  onCategoryChange?: (categoryKey: string) => void;
  onSnapPointChange?: (snapPoint: SnapPoint) => void;
  selectedCourse?: CourseWithCategory | null;
  selectedCourses?: CourseWithCategory[];
}
```

---

**Document End**
