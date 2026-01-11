# GSRC81 Map Feature Specification
> 은평구 러닝 코스 지도 애플리케이션 기획서

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Author**: Claude Code Analysis

---

## 1. 개요 (Overview)

### 1.1 프로젝트 목적
은평구 지역의 러닝/트레일 코스를 인터랙티브 지도로 제공하여 사용자가 쉽게 코스를 탐색하고 상세 정보를 확인할 수 있도록 합니다.

### 1.2 기술 스택
| 분류 | 기술 |
|------|------|
| Framework | Next.js 15 (App Router) |
| UI Library | React 19 |
| Backend | Supabase (PostgreSQL + Auth) |
| Map | Mapbox GL JS 3.14 |
| Styling | Tailwind CSS |
| Animation | Framer Motion |

### 1.3 주요 기능 요약
- 🗺️ 인터랙티브 지도 뷰
- 📍 코스 마커 & 클러스터링
- 🏷️ 카테고리 필터링
- 📱 바텀시트 UI
- 🛤️ 3D 트레일 시각화
- 📍 현재 위치 추적

---

## 2. 사용자 시나리오 (User Scenarios)

### 2.1 코스 탐색
```
사용자 → 지도 페이지 접근
      → 지도에서 마커 확인
      → 카테고리 선택 (진관동, 송북동 등)
      → 관심 코스 마커 클릭
      → 바텀시트에서 상세정보 확인
      → 코스 상세 페이지로 이동
```

### 2.2 트레일 뷰
```
사용자 → 코스 상세 페이지 접근
      → 3D 트레일 맵 로드
      → "시작" 버튼으로 드론 비행 애니메이션
      → POI 마커로 주요 지점 확인
      → 고도 프로필 확인
      → GPX 파일 다운로드 (선택)
```

### 2.3 내 위치 확인
```
사용자 → 위치 버튼 클릭
      → GPS 권한 요청 (최초)
      → 현재 위치로 지도 이동
      → 주변 코스 확인
```

---

## 3. 기능 상세 (Feature Specifications)

### 3.1 지도 뷰 (Map View)

#### 3.1.1 기본 설정
| 항목 | 값 |
|------|-----|
| 중심점 | 126.9285, 37.6176 (은평구) |
| 기본 줌 | 11.5 |
| 최소 줌 | 10 |
| 최대 줌 | 12.85 |
| 스타일 | GSRC81 Brand / Light-v11 |

#### 3.1.2 한국어 라벨
Mapbox 기본 스타일에 한국어 라벨 레이어 오버레이
- 우선순위: `name:ko` → `name_ko` → `name_kr` → `name`

#### 3.1.3 지도 컨트롤
- 줌 인/아웃 버튼
- 북쪽 방향 리셋
- 전체 코스 보기 (fit bounds)
- 3D 모드 토글 (트레일 뷰)

---

### 3.2 마커 시스템 (Marker System)

#### 3.2.1 NumberMarker
원형 마커에 코스 번호 표시
```
┌───────┐
│   1   │  ← 코스 번호 (1-999+)
└───────┘
색상: 카테고리별 상이
크기: 32x32px
```

#### 3.2.2 클러스터링
| 조건 | 동작 |
|------|------|
| 줌 ≤ 12 | 클러스터 활성화 |
| 반경 | 50px 내 마커 그룹화 |
| 표시 | 그룹 내 코스 개수 |
| 클릭 | 그룹 코스 목록 표시 |

#### 3.2.3 마커 상태
| 상태 | 스타일 |
|------|--------|
| 기본 | 카테고리 색상 |
| 호버 | Scale 1.1 |
| 선택 | 강조 테두리 + 중앙 정렬 |
| 로딩 | MarkerSkeleton |

---

### 3.3 바텀시트 (Bottom Sheet)

#### 3.3.1 스냅 포인트
| 상태 | 높이 | 트리거 |
|------|------|--------|
| 닫힘 | 0vh | 아래로 스와이프 |
| 중간 | 60vh | 기본 상태, 마커 클릭 |
| 전체 | 95vh | 위로 스와이프, 스크롤 |

#### 3.3.2 제스처
- 드래그: 헤더 영역 터치 드래그
- 속도 임계값: 500px/s 이상 시 다음 스냅으로 이동
- 거리 임계값: 100px 이상 드래그 시 스냅 전환

#### 3.3.3 컴포넌트 구성
```
CategoryFullScreen
├── BottomSheetHeader
│   ├── 카테고리 이름
│   ├── 동 이름 목록
│   └── 드래그 핸들
│
├── CourseCardStack
│   ├── CourseCard (front)
│   ├── CourseCard (middle) ← 3개 이상일 때
│   └── CourseCard (back)
│
└── 확장 시 리스트 뷰
```

#### 3.3.4 CourseCard
| 필드 | 내용 |
|------|------|
| 이미지 | 코스 커버 이미지 |
| 제목 | 코스명 |
| 거리 | X.X km |
| 난이도 | 쉬움/보통/어려움 |
| 고도 | +XXm |

---

### 3.4 카테고리 시스템 (Categories)

#### 3.4.1 카테고리 목록
| Key | 이름 | 색상 |
|-----|------|------|
| all | 전체 | #333333 |
| jingwan | 진관동 | #FF6B35 |
| songbuk | 송북동 | #4ECDC4 |
| ... | ... | ... |

#### 3.4.2 필터링 로직
```typescript
const displayCourses = useMemo(() => {
  if (currentCategory === 'all') return courses;
  return courses.filter(c => c.category?.key === currentCategory);
}, [courses, currentCategory]);
```

---

### 3.5 트레일 맵 (Trail Map)

#### 3.5.1 GPX 시각화
- LineString 레이어로 경로 표시
- 그라데이션 색상 (시작 → 끝)
- 아웃라인으로 가시성 확보

#### 3.5.2 3D 모드
| 항목 | 설정 |
|------|------|
| 지형 소스 | mapbox-terrain-dem-v1 |
| 고도 배율 | 2.5x |
| 피치 | 60° |

#### 3.5.3 드론 애니메이션
- 경로를 따라 카메라 이동
- 속도: 2.3 km/h (조정 필요)
- 지속시간: 26초 ~ 104초 (거리 비례)

#### 3.5.4 POI 마커
| 타입 | 아이콘 | 설명 |
|------|--------|------|
| start | 🟢 | 출발점 |
| end | 🔴 | 도착점 |
| viewpoint | 📷 | 전망대 |
| rest | 🪑 | 휴식 공간 |
| food | 🍽️ | 식당/카페 |
| water | 💧 | 급수대 |
| danger | ⚠️ | 위험 구간 |

---

## 4. 데이터 모델 (Data Model)

### 4.1 courses 테이블
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_latitude FLOAT NOT NULL,
  start_longitude FLOAT NOT NULL,
  distance_km NUMERIC(5,2),
  elevation_gain INTEGER,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  gpx_data JSONB, -- {points: [{lat, lng, ele}]}
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  category_id UUID REFERENCES course_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 course_categories 테이블
```sql
CREATE TABLE course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

### 4.3 course_comments 테이블
```sql
CREATE TABLE course_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. API 엔드포인트 (API Endpoints)

### 5.1 Repository 메서드
| 메서드 | 설명 |
|--------|------|
| `courseRepository.getActiveCourses()` | 활성 코스 전체 조회 |
| `courseRepository.getCoursesByCategory(key)` | 카테고리별 코스 |
| `courseRepository.getCourseById(id)` | 단일 코스 상세 |
| `categoryRepository.getActiveCategories()` | 카테고리 목록 |

### 5.2 캐싱 전략
- **ISR**: `revalidate = 3600` (1시간)
- **On-demand**: 관리자 수정 시 revalidate 호출

---

## 6. 성능 요구사항 (Performance Requirements)

| 지표 | 목표 |
|------|------|
| FCP | < 1.5s |
| LCP | < 2.5s |
| TTI | < 3.5s |
| 마커 렌더링 | < 500ms (100개 기준) |
| 지도 로드 | < 2s |

---

## 7. 접근성 (Accessibility)

### 7.1 현재 상태
- ⚠️ 키보드 네비게이션 미지원
- ⚠️ 스크린 리더 미지원
- ⚠️ ARIA 라벨 부재

### 7.2 개선 계획
- [ ] 마커에 aria-label 추가
- [ ] 바텀시트 키보드 접근성
- [ ] 포커스 트랩 구현
- [ ] 고대비 모드 지원

---

## 8. 알려진 이슈 (Known Issues)

### 8.1 Critical
1. **마커 오프셋 버그**: 바텀시트 높이에 따른 마커 중앙 정렬 불일치
2. **레이스 컨디션**: 빠른 카테고리 전환 시 바운드 계산 오류

### 8.2 Major
3. **애니메이션 속도**: 트레일 애니메이션 속도가 비현실적
4. **메모리 누수**: 언마운트 시 애니메이션 프레임 정리 미흡

### 8.3 Minor
5. 프로덕션 console.log 노출
6. 하드코딩된 좌표값 중복
7. GPX 스키마 검증 없음

---

## 9. 로드맵 (Roadmap)

### Phase 1: 버그 수정 (1-2주)
- [ ] Critical/Major 버그 해결
- [ ] 테스트 코드 작성
- [ ] 에러 바운더리 추가

### Phase 2: 기능 개선 (3-4주)
- [ ] 실시간 구독 (Supabase Realtime)
- [ ] 고급 필터 (난이도, 거리, 검색)
- [ ] 사용자 위치 기반 추천

### Phase 3: UX 개선 (2-3주)
- [ ] 접근성 개선
- [ ] 애니메이션 최적화
- [ ] 모바일 제스처 개선

### Phase 4: 확장 (4주+)
- [ ] PWA 오프라인 지원
- [ ] 코스 완주 기록
- [ ] 소셜 기능 (공유, 댓글)

---

## 10. 부록 (Appendix)

### 10.1 파일 구조
```
src/features/map/
├── components/
│   ├── mapbox-map.tsx
│   ├── course-marker.tsx
│   ├── optimized-map-client.tsx
│   ├── category-full-screen.tsx
│   ├── trail-map.tsx
│   └── ...
├── hooks/
│   ├── use-map-state.ts
│   ├── use-bottom-sheet-snap.ts
│   └── ...
└── types/
    └── index.ts
```

### 10.2 환경 변수
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxx
NEXT_PUBLIC_MAPBOX_BRAND_STYLE=mapbox://styles/xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 10.3 참고 링크
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev/)

---

**Document End**
