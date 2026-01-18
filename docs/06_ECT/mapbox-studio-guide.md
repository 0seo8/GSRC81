# 🎨 GSRC81 Mapbox Studio 커스텀 지도 가이드

**목표**: location.png 스타일을 100% 재현하는 미니멀 브랜드 지도 생성

---

## 📋 사전 준비

### 1. Mapbox 계정 설정

1. [Mapbox Studio](https://studio.mapbox.com/) 접속
2. GitHub/Google 계정으로 로그인
3. Dashboard → Access Tokens 확인
   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`이 유효한지 체크

### 2. 디자인 스펙

- **배경색**: `#FF6347` (코랄 오렌지)
- **경계선**: 검은색 (`#000000`), 2-3px
- **지역명**: 영어 대문자, 검은색, Roboto Bold
- **불필요한 요소**: 도로, 건물, 물, 공원 등 **전부 제거**

---

## 🚀 Step 1: 새 스타일 생성

### 1-1. Blank Template 선택

```
Mapbox Studio → New Style → Blank (빈 캔버스)
```

- ⚠️ "Light" 템플릿 사용 금지 (불필요한 레이어 너무 많음)
- ✅ Blank로 시작해서 필요한 것만 추가

### 1-2. 스타일 이름 설정

```
Style Name: GSRC81 Brand Map
Description: Minimal brand map with orange background and black boundaries
```

---

## 🎨 Step 2: 배경 레이어 설정

### 2-1. Background Layer 추가

```
1. Layers 패널 → + (Add Layer)
2. Type: Background
3. ID: gsrc81-background
```

### 2-2. 배경색 설정

```json
{
  "id": "gsrc81-background",
  "type": "background",
  "paint": {
    "background-color": "#FF6347"
  }
}
```

**결과**: 전체 화면이 오렌지색으로 채워짐 ✅

---

## 🗺️ Step 3: 데이터 소스 추가

### 3-1. Mapbox Streets V8 소스 추가

```
1. Sources 탭 클릭
2. + Add Source
3. 선택: Mapbox Streets v8 (공식 벡터 타일)
4. Source ID: mapbox-streets
```

**이 소스에 포함된 것:**

- `admin`: 행정구역 경계
- `place_label`: 지역명 텍스트
- `road`, `building`, `water` 등 (우리는 안 씀)

---

## 📐 Step 4: 행정구역 경계선 추가

### 4-1. Admin Boundary Layer 추가

```
1. Layers → + Add Layer
2. Type: Line
3. Source: mapbox-streets
4. Source Layer: admin
5. ID: admin-boundary
```

### 4-2. 필터 설정 (레벨별 경계선)

```json
{
  "filter": [
    "all",
    ["==", ["get", "admin_level"], 2], // 국가 경계는 제외
    ["==", ["get", "disputed"], "false"],
    ["==", ["get", "maritime"], "false"]
  ]
}
```

**또는 서울 구 경계만 표시하려면:**

```json
{
  "filter": [
    "all",
    ["in", ["get", "admin_level"], ["literal", [4, 5, 6]]], // 시/구 레벨
    ["==", ["get", "disputed"], "false"]
  ]
}
```

### 4-3. 스타일 설정

```json
{
  "id": "admin-boundary",
  "type": "line",
  "source": "mapbox-streets",
  "source-layer": "admin",
  "paint": {
    "line-color": "#000000", // 검은색
    "line-width": 2.5, // 2.5px 두께
    "line-opacity": 1
  },
  "layout": {
    "line-join": "miter", // 각진 모서리 (직선 느낌)
    "line-cap": "butt"
  }
}
```

**결과**: 검은색 행정구역 경계선 표시 ✅

---

## 🏷️ Step 5: 지역명 텍스트 추가

### 5-1. Place Label Layer 추가

```
1. Layers → + Add Layer
2. Type: Symbol
3. Source: mapbox-streets
4. Source Layer: place_label
5. ID: place-label
```

### 5-2. 필터 설정 (주요 지역만)

```json
{
  "filter": [
    "in",
    ["get", "type"],
    ["literal", ["neighbourhood", "suburb", "quarter"]]
  ]
}
```

### 5-3. 텍스트 스타일 설정

```json
{
  "id": "place-label",
  "type": "symbol",
  "source": "mapbox-streets",
  "source-layer": "place_label",
  "layout": {
    "text-field": ["upcase", ["get", "name_en"]], // 영어 이름 + 대문자 변환
    "text-font": ["Roboto Bold"], // 폰트
    "text-size": 14, // 크기
    "text-anchor": "center",
    "text-justify": "center",
    "text-max-width": 8
  },
  "paint": {
    "text-color": "#000000", // 검은색
    "text-halo-color": "#FF6347", // 배경색과 동일한 후광 (가독성)
    "text-halo-width": 2,
    "text-halo-blur": 1
  }
}
```

**결과**: EUN PYEUNG, SEODAEMUN 등 영어 대문자로 표시 ✅

---

## 🎯 Step 6: 세밀한 조정

### 6-1. 줌 레벨별 스타일 조정

**경계선 두께 조정:**

```json
{
  "line-width": [
    "interpolate",
    ["linear"],
    ["zoom"],
    10,
    1.5, // 줌 10에서 1.5px
    12,
    2.5, // 줌 12에서 2.5px
    14,
    3.5 // 줌 14에서 3.5px
  ]
}
```

**텍스트 크기 조정:**

```json
{
  "text-size": [
    "interpolate",
    ["linear"],
    ["zoom"],
    10,
    12, // 줌 10에서 12pt
    12,
    14, // 줌 12에서 14pt
    14,
    16 // 줌 14에서 16pt
  ]
}
```

### 6-2. 지역별 텍스트 위치 조정 (선택사항)

```json
{
  "text-offset": [
    "match",
    ["get", "name_en"],
    "Eunpyeong-gu",
    ["literal", [0, 0.5]], // 은평구 약간 아래
    "Seodaemun-gu",
    ["literal", [0, -0.5]], // 서대문구 약간 위
    ["literal", [0, 0]] // 기본값
  ]
}
```

---

## 📱 Step 7: 코스 노선 레이어 (선택사항)

프로젝트에서 코스 노선을 추가하므로, Studio에서는 제외하고 코드에서 추가합니다.

**Studio에서 할 일 없음** - 코드에서 `<Source>`, `<Layer>` 사용

---

## 💾 Step 8: 스타일 저장 및 배포

### 8-1. 스타일 저장

```
1. 우측 상단 "Publish" 클릭
2. 변경사항 확인
3. "Publish" 버튼 클릭
```

### 8-2. 스타일 URL 복사

```
Published 후:
1. Share 버튼 클릭
2. "Style URL" 복사
   예: mapbox://styles/your-username/clxxxxxxxxxxxxxx
```

### 8-3. Production-ready 확인

```
1. Draft URL: mapbox://styles/username/style-id/draft
2. Production URL: mapbox://styles/username/style-id
```

→ **Production URL 사용** (draft 제거)

---

## 🔧 Step 9: 프로젝트에 적용

### 9-1. 환경 변수 추가 (.env.local)

```bash
# Mapbox Access Token (기존)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.ey...

# GSRC81 커스텀 스타일 URL (새로 추가)
NEXT_PUBLIC_MAPBOX_BRAND_STYLE=mapbox://styles/your-username/clxxxxxxxxxxxxxx
```

### 9-2. Config 파일 업데이트

```typescript
// src/core/config/constants.ts
export const MAP_STYLES = {
  SATELLITE: "mapbox://styles/mapbox/satellite-v9",
  STREETS: "mapbox://styles/mapbox/streets-v12",
  LIGHT: "mapbox://styles/mapbox/light-v11",
  // 새로 추가
  GSRC81_BRAND:
    process.env.NEXT_PUBLIC_MAPBOX_BRAND_STYLE ||
    "mapbox://styles/mapbox/light-v11",
} as const;
```

### 9-3. 컴포넌트에 적용

```tsx
// src/features/map/components/course-detail-map.tsx
import { MAP_STYLES } from "@/core/config/constants";

// ...

<Map
  mapStyle={MAP_STYLES.GSRC81_BRAND}  // ← 여기!
  // ... 나머지 props
>
```

---

## ✅ 완성 체크리스트

### 시각적 확인

- [ ] 배경이 오렌지색 (#FF6347)인가?
- [ ] 행정구역 경계선이 검은색으로 명확한가?
- [ ] 도로, 건물, 물 등이 **완전히** 사라졌는가?
- [ ] 지역명이 영어 대문자로 표시되는가? (EUN PYEUNG 등)
- [ ] 줌 인/아웃 시 자연스러운가?

### 기능 확인

- [ ] 코스 노선이 검은색으로 잘 표시되는가?
- [ ] 비행 모드가 정상 작동하는가?
- [ ] 댓글 말풍선이 노선 위에 잘 표시되는가?
- [ ] 3D 지형이 필요할 때 활성화되는가?

### 성능 확인

- [ ] 지도 로딩이 빠른가? (불필요한 레이어 없음)
- [ ] 메모리 사용량이 적절한가?
- [ ] 모바일에서도 부드러운가?

---

## 🎨 고급 팁

### Tip 1: 경계선을 더 각지게 (직선 느낌)

```json
{
  "line-join": "miter",
  "line-miter-limit": 10 // 높을수록 더 각짐 (기본 2)
}
```

### Tip 2: 특정 지역만 강조

```json
{
  "line-width": [
    "match",
    ["get", "name"],
    "Eunpyeong-gu",
    4, // 은평구는 4px
    "Seodaemun-gu",
    4, // 서대문구는 4px
    2.5 // 나머지는 2.5px
  ]
}
```

### Tip 3: 다크모드 대응

```json
// 배경색을 동적으로
{
  "background-color": [
    "case",
    ["==", ["get", "theme"], "dark"],
    "#1a1a1a", // 다크 배경
    "#FF6347" // 라이트 배경 (기본)
  ]
}
```

---

## 🐛 트러블슈팅

### 문제: 경계선이 안 보임

**원인**: 필터가 너무 제한적
**해결**:

```json
{ "filter": ["all"] } // 모든 경계선 표시로 테스트
```

### 문제: 텍스트가 한글로 나옴

**원인**: `name_en` 필드가 없는 지역
**해결**:

```json
{
  "text-field": [
    "coalesce",
    ["get", "name_en"],
    ["get", "name"] // fallback
  ]
}
```

### 문제: 배경색이 안 바뀜

**원인**: 다른 레이어가 배경을 덮음
**해결**: Background 레이어를 **맨 아래** (첫 번째 레이어)로 이동

### 문제: 줌 시 텍스트가 겹침

**원인**: `text-allow-overlap` 설정
**해결**:

```json
{
  "text-allow-overlap": false,
  "text-ignore-placement": false
}
```

---

## 📚 참고 자료

- [Mapbox Studio Manual](https://docs.mapbox.com/studio-manual/)
- [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [Mapbox Streets v8 Reference](https://docs.mapbox.com/vector-tiles/reference/mapbox-streets-v8/)
- [Expression Reference](https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/)

---

## 🎯 다음 단계

1. ✅ 이 가이드대로 Mapbox Studio에서 스타일 생성
2. ✅ 스타일 URL 복사
3. ✅ 환경 변수 설정
4. ✅ Config 파일 업데이트
5. ✅ 컴포넌트에 적용
6. ✅ 빌드 & 테스트
7. ✅ Vercel에 배포

**예상 소요 시간**: 30-45분

---

**완성되면 알려주세요! 코드 적용을 도와드리겠습니다.** 🚀
