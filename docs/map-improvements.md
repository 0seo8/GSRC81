# Map Feature 개선 사항

> 생성일: 2026-01-11
> 상태: 완료

## 개요

Map 기능의 코드 품질, 성능, 접근성 개선을 위한 분석 및 개선 계획입니다.

---

## 기존 설계 분석 (잘 되어있는 부분)

### ✅ React Root 관리 - 문제 없음
**파일:** `src/features/map/components/course-marker.tsx`

**분석 결과:**
- `marker.remove()` 호출 시 Mapbox가 DOM 요소를 제거함
- DOM 요소가 제거되면 해당 React root도 GC(Garbage Collection) 대상이 됨
- React 18의 `createRoot`는 DOM 요소 제거 시 자동으로 정리됨

**결론:** 명시적 `unmount()` 없어도 메모리 누수 없음

---

### ✅ 마커 업데이트 최적화 - 이미 최적화됨
**파일:** `src/features/map/components/course-marker.tsx`

**분석 결과:**
```typescript
// Line 130-131: 이미 존재하는 마커는 스킵
if (markersRef.current[markerId]) {
  continue;  // 재생성하지 않음
}
```

- 새 마커만 생성하고, 화면에서 벗어난 마커만 제거
- 전체 마커를 재생성하지 않음 (효율적인 diff 로직)

**결론:** 이미 효율적으로 구현됨

---

### ✅ 이벤트 디바운스 - 불필요
**파일:** `src/features/map/components/course-marker.tsx`

**분석 결과:**
- `moveend`, `zoomend`는 **드래그/줌 종료 후** 1회만 발생
- 드래그 중에는 이벤트가 발생하지 않음
- Mapbox GL이 이미 이벤트를 throttle함

**결론:** 추가 디바운스 불필요

---

## 우선순위별 개선 사항

### 🟡 MEDIUM (개선 권장)

#### 1. 접근성(A11y) 개선
**파일:** `course-marker.tsx`, `optimized-map-client.tsx`

**문제점:**
- 마커에 ARIA role, label 누락
- 위치 버튼에 `aria-pressed` 상태 없음
- 스크린리더 사용자가 마커 정보 접근 불가

**해결 방안:**
```typescript
// 마커 요소에 접근성 속성 추가
el.setAttribute("role", "button");
el.setAttribute("aria-label", `${props.title || "코스"} 마커`);
el.setAttribute("tabindex", "0");

// 위치 버튼
<button aria-pressed={isAtCurrentLocation} ...>
```

---

#### 2. Geolocation 에러 UI 미구현
**파일:** `src/features/map/components/optimized-map-client.tsx`

**문제점:**
```typescript
// TODO: 사용자에게 토스트/알림으로 에러 표시
console.error("Geolocation error:", error);
```

**해결 방안:** `toast.error()` 추가하여 사용자에게 피드백 제공

---

### 🟢 LOW (선택적 개선)

#### 3. Magic Numbers 상수화
**파일:** `course-marker.tsx`

**문제점:**
```typescript
z-index: ${isCluster ? 10 : 5};  // 하드코딩된 값
```

**해결 방안:** `MARKER_Z_INDEX` 상수로 추출

---

## 구현 순서

1. ✅ 문서화
2. ✅ 접근성 개선 (마커 + 위치 버튼)
3. ✅ Geolocation 에러 UI
4. ✅ Magic Numbers 상수화
5. ✅ 빌드 검증 및 커밋

---

## 예상 소요 시간

| 우선순위 | 항목 | 예상 시간 |
|----------|------|-----------|
| MEDIUM | 접근성 개선 | 15분 |
| MEDIUM | Geolocation 에러 UI | 5분 |
| LOW | 상수화 | 5분 |
| - | 빌드 검증 | 5분 |
| **합계** | | **~30분** |

---

## 주의사항

- 모든 변경은 기존 기능에 영향을 주지 않아야 함
- 각 변경 후 빌드 검증 필수
- 변경 단위별 커밋 권장
