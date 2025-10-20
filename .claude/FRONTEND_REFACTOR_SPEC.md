# 📘 GSRC81 MAPS - 프론트엔드 리팩토링 스펙 시트

## v3 스키마 기반 완전 재구성 가이드

---

## 🗂️ 1. 데이터 구조 매핑

### 1.1 Core Course Data (courses 테이블)

| DB 필드           | 타입      | UI 표시 위치                       | 비고                                           |
| ----------------- | --------- | ---------------------------------- | ---------------------------------------------- |
| `id`              | uuid      | URL 파라미터, 내부 key             |                                                |
| `category_id`     | uuid FK   | 카테고리 탭, 필터, 관리자 선택박스 | → `course_categories.name` 조인                |
| `title`           | varchar   | 코스 카드 제목, 상세 헤더          |                                                |
| `description`     | text      | 코스 카드 부제목, 상세 설명        |                                                |
| `cover_image_url` | text      | 코스 카드 썸네일, 상세 커버        | 없으면 기본 이미지                             |
| `difficulty`      | enum      | 코스 카드 배지, 필터               | easy/medium/hard → 🟢🟡🔴                      |
| `distance_km`     | numeric   | 코스 카드 거리, 상세 통계          | gpx_data.stats.totalDistance와 동기화          |
| `avg_time_min`    | integer   | 코스 카드 예상시간                 | gpx_data.stats.estimatedDuration와 동기화      |
| `elevation_gain`  | integer   | 상세 페이지 고도 정보              | gpx_data.stats.elevationGain와 동기화          |
| `start_latitude`  | double    | 지도 마커 초기 위치                | gpx_data.points[0] 또는 metadata.startPoint    |
| `start_longitude` | double    | 지도 마커 초기 위치                | gpx_data.points[0] 또는 metadata.startPoint    |
| `end_latitude`    | double    | 상세 페이지 도착지 정보            | gpx_data.points[마지막] 또는 metadata.endPoint |
| `end_longitude`   | double    | 상세 페이지 도착지 정보            | gpx_data.points[마지막] 또는 metadata.endPoint |
| **`gpx_data`**    | **jsonb** | **모든 지도/비행 렌더링**          | **🔥 핵심 필드 - 구조는 1.2 참조**             |
| `like_count`      | integer   | 코스 카드 좋아요 수                | 추후 사용자 좋아요 기능용                      |
| `view_count`      | integer   | 코스 카드 조회수                   | 조회 시마다 +1                                 |
| `is_active`       | boolean   | 관리자 페이지에서만 표시           | false면 사용자에게 숨김                        |

### 1.2 GPX Data 구조 (gpx_data JSONB)

```typescript
interface GPXData {
  version: "1.1";
  points: Array<{
    lat: number; // 위도
    lng: number; // 경도
    ele?: number; // 고도 (옵션)
    dist: number; // 🔥 시작점부터의 누적거리(미터) - 1km 마커용
  }>;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  stats: {
    totalDistance: number; // km 단위 (예: 5.234)
    elevationGain: number; // 미터 단위 (예: 230)
    estimatedDuration: number; // 분 단위 (예: 45)
  };
  metadata?: {
    startPoint?: { lat: number; lng: number };
    endPoint?: { lat: number; lng: number };
    nearestStation?: string;
    importedAt?: string;
  };
}
```

**🎯 핵심 사용법:**

- **지도 렌더링**: `gpx_data.points.map(p => [p.lng, p.lat])`
- **1km 마커**: `gpx_data.points.filter(p => Math.abs(p.dist % 1000) < 10)`
- **경계 계산**: `gpx_data.bounds`로 지도 fitBounds
- **통계 표시**: `gpx_data.stats`의 거리/고도/시간

---

## 🗂️ 2. 페이지별 데이터 요구사항

### 2.1 사용자 페이지

#### 🏠 메인 지도 페이지 (`/map`)

**데이터 소스:**

```sql
SELECT c.*, cat.name as category_name
FROM courses c
LEFT JOIN course_categories cat ON c.category_id = cat.id
WHERE c.is_active = true
  AND c.gpx_data IS NOT NULL
ORDER BY c.created_at DESC;
```

**UI 요소:**

- 카테고리 탭: `course_categories` 기준 필터링
- 코스 마커: `start_latitude`, `start_longitude` 위치
- 코스 카드: `title`, `distance_km`, `difficulty`, `cover_image_url`
- 필터: 거리 범위, 난이도별

#### 🗺️ 코스 상세 페이지 (`/courses/[id]`)

**데이터 소스:**

```sql
-- 메인 코스 데이터
SELECT c.*, cat.name as category_name
FROM courses c
LEFT JOIN course_categories cat ON c.category_id = cat.id
WHERE c.id = $1;

-- 노트 데이터 (비행 중 표시용)
SELECT * FROM course_location_notes
WHERE course_id = $1 AND show_during_animation = true
ORDER BY created_at;

-- 댓글 데이터 (페이징)
SELECT cc.*, ccp.file_url as photo_urls
FROM course_comments cc
LEFT JOIN course_comment_photos ccp ON cc.id = ccp.comment_id
WHERE cc.course_id = $1 AND cc.is_deleted = false
ORDER BY cc.created_at DESC
LIMIT 20 OFFSET $2;
```

**UI 요소:**

- 지도: `gpx_data.points` 전체 경로 렌더링
- 비행 버튼: `gpx_data.points` 순차 애니메이션
- 1km 마커: `points.filter(p => Math.abs(p.dist % 1000) < 10)`
- 노트 팝업: `course_location_notes` 위치별 표시
- 댓글 섹션: `course_comments` + `course_comment_photos`

### 2.2 관리자 페이지

#### 📋 코스 목록 (`/admin/courses`)

**데이터 소스:**

```sql
SELECT c.*, cat.name as category_name,
       (SELECT COUNT(*) FROM course_comments WHERE course_id = c.id) as comment_count
FROM courses c
LEFT JOIN course_categories cat ON c.category_id = cat.id
ORDER BY c.created_at DESC;
```

**UI 요소:**

- 코스 목록 테이블: 제목, 카테고리, 활성상태, 댓글수
- 필터: 카테고리별, 활성상태별
- 액션: 수정/삭제/비활성화

#### ⚙️ 코스 관리 (`/admin/courses/[id]/manage`)

**탭 구성:**

1. **기본 정보** - 제목, 설명, 난이도, 카테고리, 썸네일
2. **GPX 데이터** - 파일 업로드, 경로 미리보기, 통계 확인
3. **노트 관리** - `course_location_notes` CRUD
4. **댓글 관리** - `course_comments` 목록, 삭제된 댓글 복원

#### 🏷️ 카테고리 관리 (`/admin/categories`)

**데이터 소스:**

```sql
SELECT *,
       (SELECT COUNT(*) FROM courses WHERE category_id = course_categories.id) as course_count
FROM course_categories
ORDER BY sort_order;
```

#### 👥 접근 관리 (`/admin/access`)

**데이터 소스:**

```sql
SELECT * FROM access_links
ORDER BY created_at DESC;
```

---

## 🗂️ 3. 컴포넌트 아키텍처

### 3.1 데이터 접근 레이어 (`/lib/data-access/`)

```typescript
// courses.ts
export async function getActiveCourses(): Promise<Course[]>;
export async function getCourseById(id: string): Promise<Course | null>;
export async function createCourse(data: CreateCourseDTO): Promise<Course>;
export async function updateCourse(
  id: string,
  data: UpdateCourseDTO,
): Promise<Course>;

// categories.ts
export async function getActiveCategories(): Promise<Category[]>;
export async function getCategoryById(id: string): Promise<Category | null>;

// comments.ts
export async function getCommentsByCourse(
  courseId: string,
  page: number,
): Promise<Comment[]>;
export async function createComment(data: CreateCommentDTO): Promise<Comment>;
export async function updateComment(
  id: string,
  data: UpdateCommentDTO,
): Promise<Comment>;
export async function deleteComment(id: string): Promise<void>;

// notes.ts
export async function getNotesByCourse(courseId: string): Promise<Note[]>;
export async function createNote(data: CreateNoteDTO): Promise<Note>;

// auth.ts
export async function getCurrentUser(): Promise<User | null>;
export async function loginWithKakao(kakaoData: KakaoUserData): Promise<User>;
```

### 3.2 타입 정의 (`/types/schema.ts`)

```typescript
export interface Course {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  difficulty: "easy" | "medium" | "hard";
  distance_km: number;
  avg_time_min: number | null;
  elevation_gain: number | null;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number | null;
  end_longitude: number | null;
  gpx_data: GPXData;
  like_count: number;
  view_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;

  // 조인 데이터
  category_name?: string;
  comment_count?: number;
}

export interface Category {
  id: string;
  key: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  course_count?: number;
}

export interface Comment {
  id: string;
  course_id: string;
  author_nickname: string;
  author_user_key: string | null;
  avatar_url: string | null;
  message: string;
  likes_count: number;
  edited_at: string | null;
  edit_count: number;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string | null;

  // 관련 데이터
  photos: CommentPhoto[];
}

export interface CommentPhoto {
  id: string;
  comment_id: string;
  file_url: string;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
}
```

### 3.3 유틸리티 함수 (`/lib/utils/`)

```typescript
// gpx-utils.ts
export function extractKmMarkers(points: GPXPoint[]): GPXPoint[];
export function calculateBounds(points: GPXPoint[]): Bounds;
export function validateGPXData(data: unknown): GPXData | null;

// distance-utils.ts
export function formatDistance(km: number): string;
export function formatDuration(minutes: number): string;
export function formatElevation(meters: number): string;

// map-utils.ts
export function pointsToGeoJSON(points: GPXPoint[]): GeoJSON;
export function getBoundsFromGPX(gpxData: GPXData): LngLatBounds;
```

---

## 🗂️ 4. 우선순위별 구현 계획

### Priority 1: 데이터 기반 (1~2일)

- [ ] `/lib/data-access/` 전체 재작성
- [ ] `/types/schema.ts` v3 스키마 반영
- [ ] GPX 업로드 + dist 계산 파이프라인
- [ ] 기본 CRUD 함수들 작동 확인

### Priority 2: 사용자 페이지 (1일)

- [ ] 메인 지도 페이지: 카테고리 탭 + 코스 마커
- [ ] 코스 상세: gpx_data 기반 렌더링 + 1km 마커
- [ ] 댓글 기본 읽기 (작성/수정은 Priority 4)

### Priority 3: 관리자 기능 (1~2일)

- [ ] 코스 목록/관리 페이지
- [ ] GPX 업로드 폼 (파일 → JSON 변환)
- [ ] 카테고리 관리 CRUD
- [ ] 노트 관리 CRUD

### Priority 4: 고급 기능 (1일)

- [ ] 카카오 로그인 연동
- [ ] 댓글 작성/수정/삭제 + 사진 첨부
- [ ] RLS 정책 적용
- [ ] 스토리지 보안 설정

### Priority 5: 테스트 & 최적화 (1일)

- [ ] 전체 기능 테스트
- [ ] 성능 최적화 (메모이제이션, 가상화)
- [ ] 에러 핸들링 개선

---

## 🗂️ 5. 즉시 시작 가능한 첫 번째 태스크

**지금 바로 시작하려면:**

1. **`/lib/data-access/courses.ts`** 파일 생성
2. **기본 CRUD 함수** 작성 (v3 스키마 기준)
3. **간단한 테스트 페이지**에서 데이터 로드 확인

이 작업부터 시작하시겠습니까? 바로 코드를 작성해드릴 수 있습니다! 🚀
