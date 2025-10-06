
#  GSRC81 MAPS 통합 개선 기획서 (2025 Q4) — 프롬프트 버전

**프롬프트 제목:**

> 🔧 “GSRC81 Maps 2025 Q4 통합 기획서 기반으로 문서 / 코드 / DB 설계 생성”

---

## 🧭 프롬프트 내용

너는 지금 **GSRC81 Maps 프로젝트의 기획/개발 담당자**야.
아래 내용은 **2025 Q4 기준 최신 기획 및 설계 명세서**야.
이 정보를 기반으로 문서, 설계, 코드, DB 스키마, UI 플로우 등을 생성해줘.

---

### 📘 1. 프로젝트 개요

**프로젝트명:** GSRC81 Maps
**목표:**

1. UI/UX 개선 및 GSRC81 브랜드 통일성 강화
2. GPX 데이터 구조를 JSONB 기반으로 단일화
3. 비행모드(Flight Mode)와 지점별 댓글(Comments by Waypoint) 추가

---

### 🧭 2. 사용자 페이지

#### 2.1 랜딩

* GSRC81 브랜드 애니메이션(크루 모션) 적용
* 첫 진입 시 브랜드 경험 중심 연출
* 반응형 레이아웃, 협의형 애니메이션

#### 2.2 로그인

* 비밀번호 / 관리자 / 카카오톡 로그인 지원
* 전체 그래픽 톤 통일
* 프로필 이미지 표시

#### 2.3 전체 맵

* 지도 그래픽 유지
* 스타트 포인트 그래픽 리디자인
* 확대 시 클러스터링 적용
* JSONB 데이터에서 좌표 직접 읽기

#### 2.4 루트 리스트

* 루트 수에 따른 카드형 자동 조정
* 스크롤 암시 추가
* 거리·시간 등은 gpx_data → STORED 컬럼 표시

#### 2.5 루트 상세 (핵심 개선)

**🛰 비행모드 (Flight Mode)**

* GPX 경로 자동 재생 (points 배열 순차 이동)
* 카메라 시점 자동 이동
* 재생/일시정지/속도조절 UI
* 하단 고정형 컨트롤 바

**💬 지점별 댓글 (Waypoint Comments)**

* 각 포인트 클릭 시 말풍선 팝업
* 로그인 사용자 댓글 작성 가능
* 관리자 댓글 관리 기능
* 실시간 반영

**데이터 예시**

```json
{
  "points": [
    { "lat": 37.544, "lng": 127.038, "ele": 14.2 },
    {
      "lat": 37.545, "lng": 127.041,
      "comments": [
        { "id": "c1", "user": "홍길동", "content": "전망이 좋아요", "createdAt": "2025-10-05T09:00:00Z" }
      ]
    }
  ]
}
```

---

### 🧑‍💼 3. 관리자 페이지

* 시간: 90분 → “1시간 30분”
* 거리: 소수점 셋째 자리 표시
* 가까운 지하철역 필드 제거
* 댓글 관리 기능 추가

---

### 🗄️ 4. DB 구조

| 테이블                 | 역할                         |
| ------------------- | -------------------------- |
| `courses_v2`        | GPX 경로 및 통계 데이터 (JSONB 통합) |
| `course_comments`   | 지점별 댓글                     |
| `users`             | 카카오 로그인 사용자                |
| `course_likes` (선택) | 좋아요/북마크 확장                 |

---

#### courses_v2

```sql
CREATE TABLE courses_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  nearest_station VARCHAR(100),
  gpx_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  distance_km DECIMAL(6,2) GENERATED ALWAYS AS 
      ((gpx_data->'stats'->>'totalDistance')::DECIMAL) STORED,
  elevation_gain DECIMAL(6,2) GENERATED ALWAYS AS 
      ((gpx_data->'stats'->>'elevationGain')::DECIMAL) STORED
);
CREATE INDEX idx_gpx_data_gin ON courses_v2 USING GIN (gpx_data jsonb_path_ops);
```

#### course_comments

```sql
CREATE TABLE course_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses_v2(id) ON DELETE CASCADE,
  point_index INT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  user_id UUID REFERENCES users(id),
  username VARCHAR(100),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) DEFAULT 'kakao',
  provider_id VARCHAR(200),
  username VARCHAR(100),
  email VARCHAR(200),
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 🧱 UnifiedGPXData (v1.1)

```typescript
interface UnifiedGPXData {
  version: "1.1";
  points: Array<{
    lat: number;
    lng: number;
    ele?: number;
    dist?: number;
    comments?: Array<{
      id: string;
      user_id: string;
      username: string;
      content: string;
      createdAt: string;
    }>;
  }>;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  stats: {
    totalDistance: number;
    elevationGain: number;
    elevationLoss: number;
    estimatedDuration: number;
  };
  metadata?: {
    originalFileName?: string;
    uploadedAt?: string;
    processedAt?: string;
  };
}
```

---

### ⚙️ 5. 마이그레이션 플랜

| 단계  | 작업 내용                                  |
| --- | -------------------------------------- |
| 1️⃣ | `courses_v2` 생성 및 백업                   |
| 2️⃣ | `courses` / `course_points` → JSONB 변환 |
| 3️⃣ | 병행 운영 (2주)                             |
| 4️⃣ | 완전 전환 및 백업 테이블 삭제                      |
| 5️⃣ | 댓글/비행모드 기능 점진적 배포                      |

---

### 📈 6. 기대 효과

* 중복 테이블 제거로 데이터 일원화
* GIN 인덱스 기반 조회 속도 향상 (3~5배)
* JSONB 확장성으로 향후 기능 추가 용이
* UI/UX 일체감 강화
* 사용자 참여형 인터랙션 (비행모드 + 댓글)

---

### 📎 7. 참고

* 적용 대상 파일:
  `trail-map.tsx`, `trail-map-db.tsx`, `gpx-loader.ts`, `GPX-upload-form.tsx`
* 테스트 항목:

  * GPX 업로드
  * 맵 렌더링
  * 비행모드 경로 재생
  * 댓글 CRUD
  * DB 성능 비교



