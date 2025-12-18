# Bug Fix: 비행모드 속도 불일치 및 댓글 동기화 문제

**날짜:** 2025-01-18
**심각도:** High
**영향 범위:** 비행모드 애니메이션, 댓글 표시 타이밍
**상태:** ✅ 수정 완료

---

## 📋 문제 요약

비행모드에서 **코스마다 체감 속도가 다르고**, 댓글이 **잘못된 시점**에 표시되는 문제가 발생했습니다.

### 증상

1. 같은 거리의 코스인데도 어떤 코스는 빠르게, 어떤 코스는 느리게 느껴짐
2. 오르막 구간에서는 느리게, 평지 구간에서는 빠르게 이동하는 것처럼 보임
3. 댓글이 해당 지점을 지나기 전/후에 잘못된 타이밍에 표시됨
4. km 뱃지는 정확한데 댓글만 타이밍이 어긋남

---

## 🔍 근본 원인 분석

### 원인: 포인트 인덱스 기반 vs 실제 거리 기반의 불일치

#### 1. 애니메이션 진행 방식

```typescript
// use-trail-animation.ts:129-134
const timeProgress = elapsed / totalDuration; // ✅ 시간 진행률 (정확)
currentIndex = timeProgress * (pointCount - 1); // ❌ 포인트 개수로 변환!
```

#### 2. 댓글 distance_marker 계산 방식

```typescript
// course-detail-map.tsx:94-127 (댓글 등록 시)
let cumulativeDistance = 0;
coordinates.forEach((coord, index) => {
  if (index > 0) {
    cumulativeDistance += calculateDistance(...); // ✅ Haversine 공식
  }
});
nearestDistanceMarker = cumulativeDistance / 1000; // ✅ 실제 거리
```

#### 3. 댓글 표시 조건 (수정 전)

```typescript
// course-detail-map.tsx:417 (수정 전)
const currentDistanceKm = animationProgress * totalDistanceKm; // ❌ 부정확!
// animationProgress는 포인트 인덱스 기반이므로 실제 거리와 불일치!
```

### 왜 불일치가 발생하는가?

GPX 포인트는 **균등하게 분포되어 있지 않습니다**:

```
실제 예시: 구파발 오르막 코스 (10km)

거리:    0km ----1km----------5km----------8km----------10km
포인트:   0-----500----------700----------850---------1000개
         밀집(오르막)      희박(평지)    희박(평지)

포인트 인덱스 50% (500번째) = 실제로는 1km만 이동 (10%!)
실제 거리 50% (5km) = 700번째 포인트

→ 2배 이상 차이 발생!
```

---

## 💥 영향

### 1. 비행 속도 불일치

- **오르막 구간**: 포인트 밀집 → 많은 포인트를 천천히 이동 → 🐌 느려 보임
- **평지 구간**: 포인트 희박 → 적은 포인트를 빠르게 건너뜀 → 🚀 빨라 보임
- **결과**: 코스마다 체감 속도가 천차만별

### 2. 댓글 동기화 실패

```
예시: 2.08km 지점에 "헐떡고개" 댓글 등록

잘못된 계산:
- 포인트 500개 중 200번째 (40%) 도달 시
- currentDistanceKm = 0.4 * 10km = 4km 로 계산
- 2.08km 댓글이 4km 지점에서 표시됨! ❌

실제로는:
- 200번째 포인트가 실제로는 1.5km 지점일 수 있음
- 댓글은 아직 표시되지 않아야 함
```

---

## ✅ 해결 방법

### Phase 1: 댓글 동기화 수정 (우선)

**변경 파일:**

- `src/features/map/components/trail-map/hooks/use-trail-animation.ts`
- `src/features/map/components/course-detail-map.tsx`

**핵심 아이디어:**
애니메이션 루프에서 이미 계산하고 있는 **실제 누적 거리**를 state로 노출하여 댓글 표시 로직에 전달

#### 수정 1: 실제 거리 노출

```typescript
// use-trail-animation.ts
const [currentActualDistanceKm, setCurrentActualDistanceKm] = useState(0);

// 애니메이션 루프 내부
if (currentIndex > lastCalculatedIndex) {
  for (let i = lastCalculatedIndex + 1; i <= currentIndex; i++) {
    lastCumulativeDistance += calculateDistance(...); // ✅ Haversine
  }
}

const distanceKm = lastCumulativeDistance / 1000;
setCurrentActualDistanceKm(distanceKm); // ✅ 실제 거리 노출

return {
  // ...
  currentActualDistanceKm, // 새로 추가
};
```

#### 수정 2: 댓글 로직에서 사용

```typescript
// course-detail-map.tsx
const { currentActualDistanceKm } = useTrailAnimation(...);

useEffect(() => {
  // ❌ 수정 전: const currentDistanceKm = animationProgress * totalDistanceKm;
  // ✅ 수정 후: const currentDistanceKm = currentActualDistanceKm;

  flightComments.forEach((comment) => {
    if (comment.distance_marker <= currentDistanceKm) {
      // 댓글 표시 - 이제 정확한 타이밍!
    }
  });
}, [currentActualDistanceKm]); // 의존성도 변경
```

### Phase 2: 비행 속도 일관성 수정 (완전한 해결)

**핵심 아이디어:**
카메라 이동도 포인트 인덱스가 아닌 **실제 거리 기반**으로 변경

#### 수정 3: 거리 기반 포인트 찾기 함수

```typescript
// use-trail-animation.ts
const findIndexAtDistance = (
  points: GpxCoordinate[],
  targetDistanceMeters: number,
): number => {
  let cumulativeDistance = 0;

  for (let i = 1; i < points.length; i++) {
    const segmentDistance = calculateDistance(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng,
    );

    if (cumulativeDistance + segmentDistance >= targetDistanceMeters) {
      // 선형 보간으로 정확한 위치 찾기
      const remaining = targetDistanceMeters - cumulativeDistance;
      const ratio = remaining / segmentDistance;
      return i - 1 + ratio; // 소수점 인덱스 반환
    }

    cumulativeDistance += segmentDistance;
  }

  return points.length - 1;
};
```

#### 수정 4: 애니메이션 루프 변경

```typescript
// animate() 함수 내부
const elapsed = Date.now() - startTime;
const timeProgress = Math.min(elapsed / totalDuration, 1);

// ❌ 수정 전: currentIndex = timeProgress * (pointCount - 1);
// ✅ 수정 후: 실제 거리로 찾기
const targetDistanceMeters = timeProgress * totalDistanceKm * 1000;
const exactIndex = findIndexAtDistance(points, targetDistanceMeters);
currentIndex = Math.floor(exactIndex);

// 선형 보간으로 부드러운 이동
const nextIndex = Math.min(currentIndex + 1, points.length - 1);
const interpolationRatio = exactIndex - currentIndex;

const currentPoint = points[currentIndex];
const nextPoint = points[nextIndex];

const interpolatedLat =
  currentPoint.lat + (nextPoint.lat - currentPoint.lat) * interpolationRatio;
const interpolatedLng =
  currentPoint.lng + (nextPoint.lng - currentPoint.lng) * interpolationRatio;

map.easeTo({
  center: [interpolatedLng, interpolatedLat],
  // ...
});
```

---

## 📊 검증 방법

### 테스트 케이스 1: 댓글 동기화

```bash
# 1. 코스 상세 페이지 접속
# 2. 비행모드 시작
# 3. 콘솔 로그 확인:

✅ 예상 출력:
🛫 비행모드 실제 거리: 2.07km
🛫 비행모드 실제 거리: 2.08km
💬 댓글 표시: "이지점은 헐떡고개에요" (2.08km 지점)  👈 정확히 일치!
🛫 비행모드 실제 거리: 2.09km
```

### 테스트 케이스 2: 비행 속도 일관성

```bash
# 서로 다른 두 코스 (같은 거리, 다른 포인트 분포) 비교:

코스 A: 10km, 1000개 포인트 (균등 분포)
코스 B: 10km, 1000개 포인트 (불균등 - 앞쪽 밀집)

# 수정 전:
- 코스 A: 일정한 속도 ✅
- 코스 B: 앞쪽 느림, 뒤쪽 빠름 ❌

# 수정 후:
- 코스 A: 일정한 속도 ✅
- 코스 B: 일정한 속도 ✅ (개선!)
```

---

## 🎯 결과

### Phase 1 수정 후

- ✅ 댓글이 정확한 타이밍에 표시됨
- ✅ km 뱃지와 댓글 완벽 동기화
- ⚠️ 속도 불일치는 여전히 존재 (카메라 이동은 포인트 인덱스 기반)

### Phase 2 수정 후 (완전한 해결)

- ✅ 모든 코스에서 일관된 비행 속도
- ✅ 오르막/평지 구분 없이 부드러운 이동
- ✅ 댓글 동기화 완벽
- ✅ 사용자 경험 대폭 개선

---

## 📝 관련 이슈

- 데이터베이스 스키마 업데이트 (latitude, longitude, distance_marker 컬럼 추가)
- Migration: `20250118_add_comment_location_fields.sql`

---

## 🔗 참고 자료

- Haversine Formula: https://en.wikipedia.org/wiki/Haversine_formula
- GPX Format Specification: https://www.topografix.com/gpx.asp
- React Animation Best Practices: requestAnimationFrame 사용

---

## ✍️ 작성자

Claude Code AI Assistant
Date: 2025-01-18
