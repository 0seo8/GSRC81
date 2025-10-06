# DB 마이그레이션 영향 분석

## 🚨 작동하지 않을 페이지/기능

### 📊 영향도별 분류

#### 🔴 **HIGH IMPACT** - 즉시 작동 불가
1. **전체 지도 페이지** (`/map`)
2. **코스 상세 페이지** (`/courses/[id]`)  
3. **관리자 코스 목록** (`/admin/courses`)
4. **관리자 코스 관리** (`/admin/courses/[id]/manage`)

#### 🟡 **MEDIUM IMPACT** - 부분 작동 불가
1. **관리자 대시보드** (`/admin`)
2. **GPX 업로드 기능**
3. **댓글 시스템** (현재 비활성화 상태)

#### 🟢 **LOW IMPACT** - 영향 없음
1. **로그인 페이지** (`/admin/login`, `/`)
2. **비밀번호 변경** (`/admin/password`)

---

## 📂 영향받는 파일 상세 분석

### 1. **테이블 참조 직접 영향**

#### `courses` → `courses_v2` 테이블 변경
```typescript
// ❌ 작동 불가 - 기존 테이블명 참조
.from('courses')
.from(TABLES.COURSES) // 'courses'

// ✅ 수정 필요
.from('courses_v2')
```

**영향받는 파일:**
- `/src/lib/courses-data.ts` (getCourses, getCourseById)
- `/src/app/admin/courses/page.tsx` (코스 CRUD)
- `/src/app/admin/courses/[id]/manage/page.tsx`
- `/src/app/courses/[id]/page.tsx`

#### `course_points` 테이블 삭제
```typescript
// ❌ 완전히 작동 불가 - 테이블 자체가 삭제됨
.from('course_points')
```

**영향받는 파일:**
- `/src/components/map/trail-map-db.tsx` (핵심 렌더링 로직)
- `/src/app/admin/courses/page.tsx` (GPX 업로드 시 points 저장)

### 2. **데이터 구조 변경 영향**

#### GPX 데이터 접근 방식 변경
```typescript
// ❌ 기존 방식 - 작동 불가
const gpxCoords = JSON.parse(course.gpx_coordinates);

// ✅ 새로운 방식
const gpxData = course.gpx_data; // 이미 JSONB 객체
const points = gpxData.points;
```

**영향받는 파일:**
- `/src/lib/gpx-loader.ts` (전체 파싱 로직)
- `/src/components/map/trail-map-db.tsx` (경로 렌더링)
- `/src/components/map/course-detail-map.tsx`
- `/src/components/admin/GPX-upload-form.tsx`

#### 필드명 변경
```typescript
// ❌ 기존 - 작동 불가
coord.lng → coord.lon (gpx-loader.ts에서 변환)
start_latitude, start_longitude (별도 컬럼)

// ✅ 새로운 - 통일된 형식
coord.lng (일관된 형식)
gpx_data.points[0].lat/lng (시작점)
```

---

## 🛠️ 수정이 필요한 핵심 로직

### 1. **lib/supabase.ts**
```typescript
// 기존
export const TABLES = {
  COURSES: 'courses',
  COURSE_COMMENTS: 'course_comments',
  // ...
}

// ✅ 수정 필요
export const TABLES = {
  COURSES: 'courses_v2',
  COURSE_COMMENTS: 'course_comments_v2',
  USERS: 'users', // 신규 추가
  // ...
}
```

### 2. **lib/courses-data.ts**
```typescript
// ❌ 기존 - 작동 불가
const { data, error } = await supabaseServer
  .from(TABLES.COURSES) // 'courses'
  .select(`
    *,
    course_comments(count)  // 구 테이블명
  `)

// ✅ 수정 필요
const { data, error } = await supabaseServer
  .from(TABLES.COURSES) // 'courses_v2'
  .select(`
    *,
    course_comments_v2(count)  // 신 테이블명
  `)
```

### 3. **components/map/trail-map-db.tsx**
```typescript
// ❌ 기존 - 완전히 작동 불가
const { data: points } = await supabase
  .from("course_points")  // 삭제된 테이블
  .select("*")

// ✅ 수정 필요 - JSONB에서 직접 읽기
const course = await supabase
  .from("courses_v2")
  .select("gpx_data")
  .single();

const points = course.gpx_data.points;
```

### 4. **admin/courses/page.tsx**
```typescript
// ❌ 기존 GPX 업로드 로직 - 작동 불가
const courseData = {
  gpx_coordinates: JSON.stringify(gpx.coordinates), // ❌
  elevation_gain: gpx.elevationGain, // ❌
  // course_points 테이블 삽입 ❌
};

// ✅ 수정 필요 - 통합 구조
const courseData = {
  gpx_data: {
    version: '1.1',
    points: gpx.coordinates,
    bounds: calculateBounds(gpx.coordinates),
    stats: {
      totalDistance: gpx.distance,
      elevationGain: gpx.elevationGain,
      // ...
    }
  }
};
```

---

## ⚠️ 마이그레이션 시점의 문제

### 1. **다운타임 발생**
- 테이블 생성 중: **2-5분**
- 데이터 이전 중: **5-15분** (데이터량에 따라)
- 인덱스 생성 중: **3-10분**

### 2. **데이터 불일치 위험**
- 마이그레이션 중 새로운 코스 업로드 시 데이터 손실 가능
- 기존 테이블과 새 테이블 간 동기화 필요

### 3. **롤백 복잡성**
- 새 구조로 업로드된 데이터는 구 구조로 롤백 시 손실
- JSONB → 구조 분해 과정에서 데이터 정확성 문제

---

## 🔧 안전한 마이그레이션 전략

### Phase 1: 준비 단계 (개발 환경)
1. **백업 생성**
2. **새 테이블 생성** (production과 동일한 데이터)
3. **코드 수정 및 테스트**

### Phase 2: 병행 운영 (1-2주)
```typescript
// 양방향 호환 코드 예시
const TABLE_NAME = process.env.USE_V2_TABLES ? 'courses_v2' : 'courses';

async function getCourses() {
  if (process.env.USE_V2_TABLES) {
    // 새 로직
    return await getCoursesV2();
  } else {
    // 기존 로직
    return await getCoursesV1();
  }
}
```

### Phase 3: 완전 전환
1. **읽기 전환**: 모든 읽기를 새 테이블로
2. **쓰기 전환**: 새 데이터만 새 테이블에
3. **구 테이블 비활성화**

### Phase 4: 정리
1. **구 테이블 백업 후 삭제**
2. **임시 호환 코드 제거**

---

## 📋 마이그레이션 체크리스트

### 🔴 **필수 수정 파일** (우선순위 순)

1. **`/src/lib/supabase.ts`** - 테이블명 상수 변경
2. **`/src/lib/courses-data.ts`** - 데이터 조회 로직 변경
3. **`/src/lib/gpx-loader.ts`** - GPX 파싱 로직 변경
4. **`/src/components/map/trail-map-db.tsx`** - 렌더링 로직 변경
5. **`/src/app/admin/courses/page.tsx`** - GPX 업로드 로직 변경
6. **`/src/types/index.ts`** - 타입 정의 업데이트

### 🟡 **추가 수정 필요**

7. **`/src/components/map/course-detail-map.tsx`**
8. **`/src/app/admin/courses/[id]/manage/page.tsx`**
9. **`/src/components/admin/GPX-upload-form.tsx`**
10. **`/src/hooks/use-courses.ts`** (간접 영향)

### 🟢 **영향 없음**
- 인증 관련 페이지
- UI 컴포넌트 (button, card 등)
- 유틸리티 함수

---

## 💡 권장사항

### 1. **점진적 마이그레이션**
```bash
# Feature flag로 단계적 전환
NEXT_PUBLIC_USE_V2_SCHEMA=false  # 기존 유지
NEXT_PUBLIC_USE_V2_SCHEMA=true   # 새 스키마 사용
```

### 2. **AB 테스트**
- 일부 사용자만 새 스키마로 라우팅
- 성능/안정성 모니터링

### 3. **백업 전략**
- 마이그레이션 전 전체 DB 백업
- 실시간 백업 설정
- 롤백 스크립트 준비

### 4. **모니터링**
- 응답 시간 측정
- 오류율 추적
- 사용자 피드백 수집

---

**결론**: DB 마이그레이션 시 **주요 기능의 90%가 일시적으로 작동하지 않으므로**, 반드시 점진적 마이그레이션과 충분한 테스트가 필요합니다.