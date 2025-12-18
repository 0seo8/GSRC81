# Trail Map 리팩토링 계획

## 현재 문제

- `trail-map.tsx`: 1,468줄 거대 컴포넌트
- 16개 useState 훅
- 테스트 불가능, 재사용 불가능

## 권장 구조

```
src/features/map/components/trail-map/
├── TrailMapContainer.tsx      # 메인 컨테이너 (100줄 이하)
├── MapRenderer.tsx            # Mapbox GL 렌더링
├── POILayer.tsx               # POI 마커
├── TrailAnimationController.tsx # 애니메이션 상태
├── ElevationChart.tsx         # 고도 차트
└── hooks/
    ├── useTrailMapState.ts    # useReducer 기반 통합 상태
    └── useTrailAnimation.ts   # 애니메이션 로직
```

## 상태 통합 예시

```typescript
// useTrailMapState.ts
type TrailMapState = {
  viewport: ViewState;
  selectedCourse: Course | null;
  animationProgress: number;
  is3DMode: boolean;
  // ... 모든 상태 통합
};

const [state, dispatch] = useReducer(trailMapReducer, initialState);
```

## 단계별 마이그레이션

1. **State 추출** (3-4시간)
2. **컴포넌트 분리** (4-5시간)
3. **Hook 통합** (2-3시간)
4. **테스트 작성** (2-3시간)

**예상 총 시간**: 11-15시간

현재는 더 urgent한 보안/최적화 작업 우선 진행을 권장합니다.
