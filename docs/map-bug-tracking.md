# GSRC81 Map Feature - Bug Tracking
> 지도 기능 버그 트래킹 문서

**Created**: 2026-01-11
**Last Updated**: 2026-01-11
**Status**: Critical 버그 3건 수정 완료

---

## 버그 현황 요약

| 우선순위 | 개수 | 상태 |
|---------|------|------|
| 🔴 Critical | 3 | ✅ 해결됨 |
| 🟠 Major | 3 | 미해결 |
| 🟡 Minor | 4 | 미해결 |
| **Total** | **10** | **3건 해결** |

---

## ✅ 해결된 이슈 (Critical)

### BUG-001: 마커 오프셋 계산 버그 ✅ FIXED
**파일**: `src/features/map/components/course-marker.tsx`

**수정 내용**:
```typescript
// Before: 하드코딩된 30% 오프셋
const offsetY = -(window.innerHeight * 0.3);

// After: 바텀시트 스냅 포인트에 따른 동적 계산
const getMarkerOffset = (snapPoint: SnapPoint): number => {
  const offsets: Record<SnapPoint, number> = {
    closed: 0,
    medium: 0.3,   // 60vh 바텀시트
    full: 0.475,   // 95vh 바텀시트
  };
  return -(window.innerHeight * offsets[snapPoint]);
};
```

**변경된 파일**:
- `course-marker.tsx` - `snapPoint` prop 추가, 동적 오프셋 계산
- `optimized-map-client.tsx` - `bottomSheetSnapPoint` 상태 관리
- `category-full-screen.tsx` - `onSnapPointChange` 콜백 추가

---

### BUG-002: 클러스터 클릭 에러 피드백 없음 ✅ FIXED
**파일**: `src/features/map/components/course-marker.tsx`

**수정 내용**:
```typescript
// Before: 빈 결과 시 아무 동작 없음
if (onClusterClickRef.current && clusterCourses.length > 0) {
  onClusterClickRef.current(clusterCourses);
}

// After: Toast 피드백 추가
if (clusterCourses.length > 0) {
  onClusterClickRef.current?.(clusterCourses);
} else {
  toast.info("선택 가능한 코스가 없습니다", { duration: 2000 });
}
```

**추가 개선**:
- 클러스터 에러 시 `toast.error()` 추가
- 개별 코스 찾기 실패 시에도 에러 토스트 추가
- console.log를 개발 환경에서만 출력 (BUG-007 동시 해결)

---

### BUG-003: 카테고리 전환 레이스 컨디션 ✅ FIXED
**파일**: `src/features/map/hooks/use-map-bounds.ts`

**수정 내용**:
```typescript
// Before: 즉시 fitBounds 호출
useEffect(() => {
  if (map) {
    fitMapToCourses();
  }
}, [map, courses, fitMapToCourses]);

// After: 150ms 디바운스 적용
const debouncedFitMapToCourses = useDebouncedCallback(fitMapToCourses, 150);

useEffect(() => {
  if (map) {
    debouncedFitMapToCourses();
  }
}, [map, courses, debouncedFitMapToCourses]);
```

**커스텀 훅 추가**:
```typescript
function useDebouncedCallback<T>(callback: T, delay: number): T {
  // 타임아웃 ref로 마지막 호출만 실행
  // 언마운트 시 자동 클린업
}
```

---

## 🟠 Major Issues (미해결)

### BUG-004: 트레일 애니메이션 속도 불일치
**파일**: `src/features/map/components/trail-map.tsx:441-448`

**현재 상태**:
```typescript
const speedKmPerHour = 2.3; // 시속 2.3km - 비현실적으로 느림
```

**권장 수정**:
```typescript
const RUNNING_SPEEDS = {
  easy: 5.5,
  medium: 5.0,
  hard: 4.5,
};
const speedKmPerHour = RUNNING_SPEEDS[course.difficulty] || 5.0;
```

---

### BUG-005: 애니메이션 프레임 메모리 누수
**파일**: `src/features/map/components/trail-map.tsx:620-679`

**현재 상태**: 언마운트 시 애니메이션 정리 로직 존재하나 타이밍 이슈 가능

**권장 수정**: AbortController 패턴 적용

---

### BUG-006: GPX 데이터 스키마 검증 없음
**파일**: `src/shared/lib/gpx-loader.ts:125-150`

**권장 수정**: Zod 스키마 검증 추가

---

## 🟡 Minor Issues (미해결)

### BUG-007: 프로덕션 Console.log 노출 ✅ 부분 해결
- `course-marker.tsx`에서 수정됨
- 다른 파일은 추가 검토 필요

### BUG-008: 하드코딩된 좌표값 중복
**영향 파일**: 5개 이상
**권장 수정**: `@/core/config/map.ts` 단일 소스로 통합

### BUG-009: 카테고리 네비게이션 에러 바운더리 없음
**파일**: `category-full-screen.tsx`

### BUG-010: 미사용 상태 변수
**파일**: `trail-map.tsx` - `currentDistance`

---

## 수정 우선순위 (업데이트)

### ✅ 완료 (Sprint 1)
- [x] BUG-001: 마커 오프셋 계산 버그
- [x] BUG-002: 클러스터 클릭 에러 피드백
- [x] BUG-003: 카테고리 전환 레이스 컨디션
- [x] BUG-007: Console.log 제거 (부분)

### 다음 Sprint
- [ ] BUG-006: GPX 스키마 검증
- [ ] BUG-008: 좌표값 통합
- [ ] BUG-004: 애니메이션 속도 조정

### Backlog
- [ ] BUG-005: 메모리 누수 수정
- [ ] BUG-009: 에러 바운더리 추가
- [ ] BUG-010: 미사용 변수 정리

---

## 테스트 체크리스트

### 마커 시스템 ✅
- [x] 마커 클릭 시 중앙 정렬 확인 (모든 바텀시트 상태)
- [x] 클러스터 클릭 후 코스 목록 표시
- [x] 빈 클러스터 클릭 시 토스트 피드백

### 카테고리 필터 ✅
- [x] 카테고리 전환 시 올바른 바운드
- [x] 빠른 전환 시 정상 동작 (디바운스)

### 트레일 맵
- [ ] 페이지 이동 시 애니메이션 정리
- [ ] GPX 데이터 오류 시 에러 메시지

---

**Document End**
