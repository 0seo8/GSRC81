# GSRC81 데이터베이스 셋업 가이드

> **인수인계 문서** - 새로운 Supabase 프로젝트에서 DB를 처음부터 설정하는 완전한 가이드

---

## 목차

1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [테이블 생성 SQL](#2-테이블-생성-sql)
3. [Row Level Security (RLS) 정책](#3-row-level-security-rls-정책)
4. [초기 데이터 삽입](#4-초기-데이터-삽입)
5. [Storage 버킷 설정](#5-storage-버킷-설정)
6. [환경 변수 설정](#6-환경-변수-설정)
7. [TypeScript 타입 생성](#7-typescript-타입-생성)
8. [테스트 및 검증](#8-테스트-및-검증)

---

## 1. Supabase 프로젝트 생성

### 1.1 계정 및 프로젝트 생성

1. https://supabase.com 접속
2. GitHub 또는 이메일로 회원가입
3. "New Project" 클릭
4. 프로젝트 정보 입력:
   - **Name**: `gsrc81-maps` (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 설정 (반드시 저장해둘 것!)
   - **Region**: Northeast Asia (Seoul) - `ap-northeast-2` 권장
5. "Create new project" 클릭 (2-3분 소요)

### 1.2 프로젝트 정보 확인

프로젝트 생성 후 **Settings > API**에서 다음 정보 확인:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. 테이블 생성 SQL

**Supabase Dashboard > SQL Editor**에서 아래 SQL을 **순서대로** 실행하세요.

### 2.1 확장 기능 활성화

```sql
-- UUID 생성 함수 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2.2 핵심 테이블 생성

```sql
-- =============================================
-- 1. 관리자 테이블
-- =============================================
CREATE TABLE admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. 접근 코드 테이블 (초대 코드)
-- =============================================
CREATE TABLE access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- 3. 사용자 인증 테이블 (카카오 로그인)
-- =============================================
CREATE TABLE access_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_code VARCHAR(100),
    access_code_id UUID REFERENCES access_codes(id),
    kakao_user_id VARCHAR(255),
    kakao_nickname VARCHAR(100),
    kakao_profile_url TEXT,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. 코스 카테고리 테이블
-- =============================================
CREATE TABLE course_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. 러닝 코스 테이블 (핵심!)
-- =============================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    detail_description TEXT,
    category_id UUID REFERENCES course_categories(id),

    -- 위치 정보
    start_latitude DECIMAL(10,8) NOT NULL,
    start_longitude DECIMAL(11,8) NOT NULL,

    -- 코스 정보
    distance_km DECIMAL(5,2) NOT NULL,
    avg_time_min INTEGER,
    elevation_gain INTEGER,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',

    -- GPX 데이터 (JSON 형태로 저장)
    gpx_data JSONB,

    -- 추가 정보
    cover_image_url TEXT,
    tags JSONB,
    sort_order INTEGER DEFAULT 0,

    -- 메타데이터
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. 코스 댓글 테이블
-- =============================================
CREATE TABLE course_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    author_nickname VARCHAR(50) NOT NULL,
    author_user_key VARCHAR(255),
    avatar_url TEXT,
    message TEXT NOT NULL,

    -- 위치 정보 (지도 표시용)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    distance_marker DECIMAL(5,2),

    -- 상태
    likes_count INTEGER DEFAULT 0 NOT NULL,
    is_visible_in_flight BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    hidden_by_admin BOOLEAN DEFAULT false,

    -- 타임스탬프
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. 코스 사진 테이블
-- =============================================
CREATE TABLE course_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    caption TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. 댓글 사진 테이블
-- =============================================
CREATE TABLE course_comment_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES course_comments(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 9. 코스 위치 메모 테이블
-- =============================================
CREATE TABLE course_location_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    route_index INTEGER,
    memo_type VARCHAR(50),
    show_during_animation BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 10. 관리자 액션 로그 테이블
-- =============================================
CREATE TABLE admin_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES access_links(id),
    target_user_id UUID NOT NULL REFERENCES access_links(id),
    target_user_nickname VARCHAR(100),
    action_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- 11. 앱 설정 테이블
-- =============================================
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB
);
```

### 2.3 인덱스 생성

```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_courses_is_active ON courses(is_active);
CREATE INDEX idx_courses_sort_order ON courses(sort_order);

CREATE INDEX idx_course_comments_course_id ON course_comments(course_id);
CREATE INDEX idx_course_comments_created_at ON course_comments(created_at DESC);
CREATE INDEX idx_course_comments_author_user_key ON course_comments(author_user_key);

CREATE INDEX idx_course_photos_course_id ON course_photos(course_id);
CREATE INDEX idx_course_comment_photos_comment_id ON course_comment_photos(comment_id);
CREATE INDEX idx_course_location_notes_course_id ON course_location_notes(course_id);

CREATE INDEX idx_access_links_kakao_user_id ON access_links(kakao_user_id);
CREATE INDEX idx_access_links_access_code_id ON access_links(access_code_id);
CREATE INDEX idx_access_codes_is_active ON access_codes(is_active);
```

### 2.4 트리거 함수 (자동 updated_at 갱신)

```sql
-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_codes_updated_at
    BEFORE UPDATE ON access_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_links_updated_at
    BEFORE UPDATE ON access_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Row Level Security (RLS) 정책

Supabase는 기본적으로 RLS가 활성화되어 있습니다. 아래 정책을 설정하세요.

```sql
-- =============================================
-- RLS 활성화
-- =============================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_comment_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_location_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 읽기 정책 (anon 사용자용)
-- =============================================

-- 코스: 활성화된 코스만 읽기 허용
CREATE POLICY "courses_read_active" ON courses
    FOR SELECT USING (is_active = true);

-- 카테고리: 활성화된 카테고리만 읽기 허용
CREATE POLICY "categories_read_active" ON course_categories
    FOR SELECT USING (is_active = true);

-- 댓글: 삭제되지 않고 숨김처리 안된 댓글만 읽기 허용
CREATE POLICY "comments_read_visible" ON course_comments
    FOR SELECT USING (is_deleted = false AND hidden_by_admin = false);

-- 사진: 모두 읽기 허용
CREATE POLICY "photos_read_all" ON course_photos
    FOR SELECT USING (true);

CREATE POLICY "comment_photos_read_all" ON course_comment_photos
    FOR SELECT USING (true);

-- 위치 메모: 활성화된 것만 읽기 허용
CREATE POLICY "location_notes_read_active" ON course_location_notes
    FOR SELECT USING (is_active = true);

-- 앱 설정: 모두 읽기 허용
CREATE POLICY "app_settings_read_all" ON app_settings
    FOR SELECT USING (true);

-- =============================================
-- 쓰기 정책 (인증된 사용자용)
-- =============================================

-- 댓글 작성: 누구나 가능
CREATE POLICY "comments_insert_all" ON course_comments
    FOR INSERT WITH CHECK (true);

-- 댓글 수정: 자신의 댓글만
CREATE POLICY "comments_update_own" ON course_comments
    FOR UPDATE USING (author_user_key = current_setting('app.user_key', true));

-- 사진 업로드: 누구나 가능
CREATE POLICY "photos_insert_all" ON course_photos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "comment_photos_insert_all" ON course_comment_photos
    FOR INSERT WITH CHECK (true);
```

> **참고**: 관리자용 정책은 서버 사이드에서 `service_role` 키를 사용하여 RLS를 우회합니다.

---

## 4. 초기 데이터 삽입

```sql
-- =============================================
-- 앱 설정 초기값
-- =============================================
INSERT INTO app_settings (setting_key, setting_value) VALUES
    ('app_name', '"GSRC81 Maps"'),
    ('app_version', '"1.0.0"'),
    ('default_map_center', '{"lat": 37.6176, "lng": 126.9227}'),
    ('default_map_zoom', '13'),
    ('comment_max_length', '200');

-- =============================================
-- 기본 카테고리 (예시)
-- =============================================
INSERT INTO course_categories (key, name, description, sort_order) VALUES
    ('mountain', '산길 코스', '은평구 주변 산악 러닝 코스', 1),
    ('river', '하천 코스', '불광천, 창릉천 등 하천변 코스', 2),
    ('park', '공원 코스', '공원 내 러닝 코스', 3),
    ('urban', '도심 코스', '도심 도로 러닝 코스', 4);

-- =============================================
-- 기본 접근 코드 (테스트용)
-- =============================================
INSERT INTO access_codes (code, description, is_active) VALUES
    ('GSRC81-2025', '기본 접근 코드', true);

-- =============================================
-- 기본 관리자 계정
-- 비밀번호: admin123 (bcrypt 해시)
-- 실제 운영 시 반드시 변경할 것!
-- =============================================
INSERT INTO admin (username, password_hash) VALUES
    ('admin', '$2b$10$rOCNrH2OH5YmEIWV7JtBk.FX3Ul4nxj6YOKJhpjQO7AHrg6/Y3qSu');
```

---

## 5. Storage 버킷 설정

### 5.1 버킷 생성

**Supabase Dashboard > Storage**에서 다음 버킷을 생성:

| 버킷 이름 | Public | 용도 |
|----------|--------|------|
| `course-images` | ✅ Yes | 코스 대표 이미지, 갤러리 |
| `comment-photos` | ✅ Yes | 댓글 첨부 사진 |
| `category-images` | ✅ Yes | 카테고리 커버 이미지 |
| `gpx-files` | ❌ No | GPX 원본 파일 (백업용) |

### 5.2 Storage 정책

```sql
-- course-images 버킷: 모두 읽기 가능, 인증된 사용자만 업로드
CREATE POLICY "course_images_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'course-images');

CREATE POLICY "course_images_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'course-images');

-- comment-photos 버킷
CREATE POLICY "comment_photos_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'comment-photos');

CREATE POLICY "comment_photos_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'comment-photos');
```

---

## 6. 환경 변수 설정

프로젝트 루트의 `.env.local` 파일 생성:

```env
# Supabase (Dashboard > Settings > API에서 확인)
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# 서버 사이드 전용 (관리자 기능용)
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

# Mapbox (https://account.mapbox.com/)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=[YOUR_MAPBOX_TOKEN]

# Kakao API (https://developers.kakao.com/)
KAKAO_REST_API_KEY=[YOUR_KAKAO_API_KEY]

# 앱 설정
NEXT_PUBLIC_APP_PASSWORD=[OPTIONAL_APP_PASSWORD]
```

> ⚠️ **주의**: `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출되면 안 됩니다!

---

## 7. TypeScript 타입 생성

### 7.1 Supabase CLI 설치

```bash
npm install -g supabase
```

### 7.2 타입 생성

```bash
# Supabase에 로그인
npx supabase login

# 타입 생성 (YOUR_PROJECT_REF를 실제 값으로 변경)
npx supabase gen types typescript \
  --project-id [YOUR_PROJECT_REF] \
  > src/shared/types/database.types.ts
```

### 7.3 타입 사용 예시

```typescript
import type { Database, Tables } from '@/shared/types/database.types';

// 테이블 Row 타입
type Course = Tables<'courses'>;
type Comment = Tables<'course_comments'>;

// Supabase 클라이언트 타입
import { createClient } from '@supabase/supabase-js';
const supabase = createClient<Database>(url, key);
```

---

## 8. 테스트 및 검증

### 8.1 연결 테스트

```typescript
// src/lib/supabase/test-connection.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testConnection() {
  // 카테고리 조회 테스트
  const { data, error } = await supabase
    .from('course_categories')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Connection failed:', error);
    return false;
  }

  console.log('Connection successful!', data);
  return true;
}

testConnection();
```

### 8.2 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] 모든 테이블 생성 완료 (11개)
- [ ] 인덱스 생성 완료
- [ ] 트리거 설정 완료
- [ ] RLS 정책 설정 완료
- [ ] Storage 버킷 생성 완료
- [ ] 환경 변수 설정 완료
- [ ] TypeScript 타입 생성 완료
- [ ] 연결 테스트 통과

---

## 문제 해결 (Troubleshooting)

### "permission denied" 오류

```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'courses';

-- 임시로 RLS 비활성화 (개발 중에만!)
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
```

### 타입 생성 실패

```bash
# 프로젝트 ID 확인
npx supabase projects list

# 링크 확인
npx supabase link --project-ref [YOUR_PROJECT_REF]
```

### FK 제약 조건 오류

테이블 생성 순서가 중요합니다. 위의 SQL을 순서대로 실행하세요.

---

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase CLI 가이드](https://supabase.com/docs/guides/cli)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage 가이드](https://supabase.com/docs/guides/storage)

---

## 연락처

문제가 있으면 프로젝트 원 개발자에게 연락하세요.
