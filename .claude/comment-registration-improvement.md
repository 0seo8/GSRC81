# 댓글 등록 기능 개선 방안

## 현재 상황 분석

### 현재 구현 위치
- 파일: `src/features/map/components/course-detail-map.tsx`
- 관련 함수:
  - `handleMapClick` (라인 150-167): 지도 클릭 핸들러
  - `findNearestRoutePoint` (라인 79-147): 가장 가까운 경로 지점 찾기

### 현재 동작 방식
1. 사용자가 지도의 **어느 부분이든** 클릭
2. `findNearestRoutePoint` 함수가 클릭 지점에서 가장 가까운 경로 지점을 찾음
3. Haversine 공식을 사용해 거리 계산
4. 가장 가까운 지점에 마커를 표시하고 댓글 모달을 오픈

### 문제점
- ❌ 지도의 어디를 클릭해도 댓글 등록이 가능
- ❌ 경로와 멀리 떨어진 곳을 클릭해도 가장 가까운 경로 지점에 댓글이 등록됨
- ❌ 사용자가 의도하지 않은 위치에 댓글이 추가될 수 있음

### 요구사항
1. ✅ 댓글은 **노선(경로) 위에서만** 등록 가능해야 함
2. ✅ 지도의 기본 기능(터치, 스크롤, 줌)은 정상적으로 동작해야 함

---

## 해결 방안

### 방안 1: 거리 임계값 설정 (가장 간단)

#### 개념
클릭한 지점과 경로 사이의 실제 거리가 일정 범위(예: 50m) 이내일 때만 댓글 등록 허용

#### 구현 방법
```typescript
const handleMapClick = useCallback(
  (event: MapMouseEvent) => {
    if (isAnimating) return;

    const { lng, lat } = event.lngLat;
    const nearestPoint = findNearestRoutePoint(lng, lat);

    // 거리 임계값 체크 추가 (예: 50m)
    const MAX_DISTANCE = 50; // 미터
    if (nearestPoint && nearestPoint.distance <= MAX_DISTANCE) {
      setClickedPoint({
        lng: nearestPoint.lng,
        lat: nearestPoint.lat,
        distanceMarker: nearestPoint.distanceMarker,
      });
      setShowCommentModal(true);
    } else {
      // 거리가 멀면 무시하거나 알림 표시
      console.log('경로에서 너무 멀리 떨어진 지점입니다.');
    }
  },
  [isAnimating, findNearestRoutePoint],
);
```

#### 장점
- ✅ 구현이 매우 간단 (기존 코드에 조건문만 추가)
- ✅ 기존 `findNearestRoutePoint` 로직 활용 가능
- ✅ 빠른 적용 가능

#### 단점
- ❌ 줌 레벨에 따라 사용자 경험이 다를 수 있음
  - 줌 아웃 상태: 화면상 경로와 가깝지만 실제 거리는 멀 수 있음
  - 줌 인 상태: 화면상 멀어도 실제 거리는 가까울 수 있음
- ❌ 임계값 설정이 애매할 수 있음
- ❌ 경로에서 조금 벗어난 클릭도 허용될 수 있음

#### 적용 난이도
⭐ (매우 쉬움)

---

### 방안 2: Mapbox 레이어 클릭 이벤트 사용 (추천 ⭐⭐⭐)

#### 개념
- 트레일 경로에 클릭 가능한 투명 레이어를 추가
- 해당 레이어 클릭 시에만 댓글 등록 모달 오픈
- 다른 영역 클릭 시 지도 이동(pan/zoom)만 동작

#### 구현 방법
```typescript
// 1. 클릭 가능한 넓은 트레일 레이어 추가
const trailClickableLayer = {
  id: "trail-clickable",
  type: "line" as const,
  paint: {
    "line-color": "transparent", // 보이지 않음
    "line-width": 20, // 클릭 가능한 넓은 영역
  },
  layout: {
    "line-join": "round" as const,
    "line-cap": "round" as const,
  },
};

// 2. 일반 지도 클릭 핸들러 제거
// onClick={handleMapClick} 제거

// 3. 레이어 클릭 이벤트 추가
useEffect(() => {
  if (!mapRef.current) return;

  const map = mapRef.current.getMap();

  const handleLayerClick = (e: mapboxgl.MapMouseEvent) => {
    if (isAnimating) return;

    const { lng, lat } = e.lngLat;
    const nearestPoint = findNearestRoutePoint(lng, lat);

    if (nearestPoint) {
      setClickedPoint({
        lng: nearestPoint.lng,
        lat: nearestPoint.lat,
        distanceMarker: nearestPoint.distanceMarker,
      });
      setShowCommentModal(true);
    }
  };

  // 레이어 클릭 이벤트 등록
  map.on('click', 'trail-clickable', handleLayerClick);

  // 마우스 커서 변경 (경로 위에서만 포인터)
  map.on('mouseenter', 'trail-clickable', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'trail-clickable', () => {
    map.getCanvas().style.cursor = '';
  });

  return () => {
    map.off('click', 'trail-clickable', handleLayerClick);
    map.off('mouseenter', 'trail-clickable');
    map.off('mouseleave', 'trail-clickable');
  };
}, [mapRef, isAnimating, findNearestRoutePoint]);
```

#### 장점
- ✅ **정확하게 경로 위에서만 클릭 가능**
- ✅ 직관적인 사용자 경험 (경로에 마우스 올리면 커서 변경)
- ✅ 지도 이동(pan/zoom)은 자동으로 유지됨
- ✅ Mapbox 표준 패턴 사용
- ✅ 줌 레벨과 무관하게 일관된 동작

#### 단점
- ⚠️ 모바일에서 작은 경로를 클릭하기 어려울 수 있음
  - 해결: `line-width`를 20~30으로 설정하여 클릭 영역 확보
- ⚠️ 레이어 추가로 인한 약간의 렌더링 오버헤드
  - 영향: 무시할 수 있는 수준

#### 적용 난이도
⭐⭐ (보통)

---

### 방안 3: 거리 임계값 + 줌 레벨 동적 조정

#### 개념
현재 줌 레벨에 따라 허용 거리를 동적으로 조정
- 줌 인 (가까이 볼 때): 좁은 임계값 (예: 20m)
- 줌 아웃 (멀리 볼 때): 넓은 임계값 (예: 100m)

#### 구현 방법
```typescript
const handleMapClick = useCallback(
  (event: MapMouseEvent) => {
    if (isAnimating) return;

    const { lng, lat } = event.lngLat;
    const nearestPoint = findNearestRoutePoint(lng, lat);

    // 현재 줌 레벨 가져오기
    const zoom = mapRef.current?.getZoom() || 12;

    // 줌 레벨에 따라 임계값 동적 조정
    // zoom 14+: 20m, zoom 12-13: 50m, zoom 10-11: 100m
    let maxDistance = 50;
    if (zoom >= 14) {
      maxDistance = 20;
    } else if (zoom >= 12) {
      maxDistance = 50;
    } else {
      maxDistance = 100;
    }

    if (nearestPoint && nearestPoint.distance <= maxDistance) {
      setClickedPoint({
        lng: nearestPoint.lng,
        lat: nearestPoint.lat,
        distanceMarker: nearestPoint.distanceMarker,
      });
      setShowCommentModal(true);
    }
  },
  [isAnimating, findNearestRoutePoint],
);
```

#### 장점
- ✅ 줌 레벨에 관계없이 일관된 사용자 경험
- ✅ 유연한 클릭 범위
- ✅ 모바일에서도 사용하기 편함

#### 단점
- ❌ 임계값 튜닝이 필요함 (여러 줌 레벨에서 테스트 필요)
- ❌ 구현이 약간 복잡함
- ⚠️ 여전히 경로 외부 클릭을 허용할 수 있음

#### 적용 난이도
⭐⭐⭐ (중간)

---

## 권장 사항

### 최종 추천: **방안 2 (Mapbox 레이어 클릭)**

#### 이유
1. **정확성**: 경로 위에서만 정확하게 댓글 등록 가능
2. **사용자 경험**:
   - 경로 위에 마우스를 올리면 커서가 포인터로 변경되어 클릭 가능함을 명확히 알 수 있음
   - 다른 영역 클릭 시 지도 이동이 자연스럽게 동작
3. **표준 패턴**: Mapbox에서 권장하는 방식
4. **모바일 대응**: `line-width` 조정으로 터치하기 쉬운 영역 확보

#### 구현 우선순위
1. ✅ **1단계**: 방안 2 구현 (레이어 클릭)
2. ⚠️ **2단계** (선택): 필요시 방안 1 또는 3을 추가하여 안전장치로 사용

---

## 다음 단계

사용자 확인 후 선택된 방안을 구현합니다.

### 구현 체크리스트
- [ ] 방안 선택 확정
- [ ] 코드 구현
- [ ] 데스크톱 브라우저 테스트
- [ ] 모바일 브라우저 테스트
- [ ] 다양한 줌 레벨에서 테스트
- [ ] 애니메이션 모드에서 동작 확인