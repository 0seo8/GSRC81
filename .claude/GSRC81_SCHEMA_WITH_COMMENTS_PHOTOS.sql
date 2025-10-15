-- ====================================================================
-- GSRC81 MAPS — PDF 기반 최종 스키마 (+ 댓글 수정/삭제 + 사진 첨부)
-- ====================================================================
-- DB: PostgreSQL / Supabase
-- 요구사항 요약:
--  - 코스/카테고리
--  - GPX 단일 소스(JSONB, points[].dist 포함 → 1km 마커용)
--  - 비행 중 노트(지도 주석)
--  - 사용자 댓글(카카오 로그인 기반, 수정/삭제 가능)
--  - 댓글 사진 첨부(1:N)
--  - 카카오 로그인 정보 저장(간단)
--  - 관리자 계정
--  - (선택) RLS 정책 샘플 포함
-- ====================================================================

BEGIN;

-- --------------------------------------------------------------------
-- 0) Extensions (Supabase는 기본 제공하는 경우가 많지만 안전하게)
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------------------------
-- 1) 카테고리 (진관/트랙/트레일/로드)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          varchar UNIQUE NOT NULL,      -- 'jingwan'|'track'|'trail'|'road'
  name         varchar NOT NULL,             -- 표시명
  sort_order   int DEFAULT 0,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- 기본 Seed (필요시)
INSERT INTO public.course_categories (key, name, sort_order)
VALUES
  ('jingwan', '진관동러닝', 1),
  ('track', '트랙러닝', 2),
  ('trail', '트레일러닝', 3),
  ('road', '로드러닝', 4)
ON CONFLICT (key) DO NOTHING;

-- --------------------------------------------------------------------
-- 2) 코스 (메인 데이터 + GPX 단일소스)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         uuid REFERENCES public.course_categories(id) ON DELETE SET NULL,

  title               varchar NOT NULL,        -- 예: 구파발천 정기런
  description         text,                    -- 예: 로드러닝코스
  cover_image_url     text,                    -- 썸네일

  difficulty          varchar NOT NULL DEFAULT 'medium'
                     CHECK (difficulty IN ('easy','medium','hard')),
  distance_km         numeric NOT NULL,        -- km 단위
  avg_time_min        integer,                 -- 상세 헤더(시간)
  elevation_gain      integer,                 -- 상세 헤더(고도)

  start_latitude      double precision,
  start_longitude     double precision,
  end_latitude        double precision,
  end_longitude       double precision,

  -- GPX 단일소스(JSONB). points[].{lat,lng,ele,dist}, stats.{totalDistance,elevationGain}
  gpx_data            jsonb NOT NULL,

  view_count          int    DEFAULT 0,
  like_count          int    DEFAULT 0,

  is_active           boolean DEFAULT true,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_category      ON public.courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_active        ON public.courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_gpxdata_gin   ON public.courses USING GIN (gpx_data);

-- --------------------------------------------------------------------
-- 3) 비행 중 노트 (지도 좌표 기반 주석)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_location_notes (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id              uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,

  latitude               double precision NOT NULL,
  longitude              double precision NOT NULL,
  title                  varchar NOT NULL,
  content                text,
  memo_type              varchar DEFAULT 'general'
                         CHECK (memo_type IN ('general','warning','highlight','rest')),
  show_during_animation  boolean DEFAULT true,

  created_by             varchar,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_course ON public.course_location_notes(course_id);

-- --------------------------------------------------------------------
-- 4) 사용자 댓글 (카카오 로그인 기반 수정/삭제 + 메타)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_comments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,

  -- 표시용 스냅샷 (닉네임/아바타)
  author_nickname  varchar NOT NULL,
  avatar_url       text,

  -- 소유권 판정 키 (카카오 식별자 또는 내부 사용자 키)
  author_user_key  text,  -- 예: kakao_user_id (NULL 허용 → 비로그인/게스트 허용 시)

  message          text NOT NULL,

  -- 좋아요 집계(단순 카운트; 개별 사용자 히스토리는 범위 밖)
  likes_count      int DEFAULT 0,

  -- 수정/삭제 메타
  edited_at        timestamptz,
  edit_count       int DEFAULT 0,
  is_deleted       boolean DEFAULT false,
  deleted_at       timestamptz,
  deleted_by       text,                    -- 본인 or 'admin:username'

  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_course       ON public.course_comments(course_id);
CREATE INDEX IF NOT EXISTS idx_comments_created      ON public.course_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user_key     ON public.course_comments(author_user_key);
CREATE INDEX IF NOT EXISTS idx_comments_not_deleted  ON public.course_comments(course_id, is_deleted, created_at DESC);

-- --------------------------------------------------------------------
-- 5) 댓글 사진 (1:N)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_comment_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid NOT NULL REFERENCES public.course_comments(id) ON DELETE CASCADE,
  file_url    text NOT NULL,         -- Supabase Storage URL (public 또는 signed)
  width       int,
  height      int,
  sort_order  int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comment_photos_comment ON public.course_comment_photos(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_photos_sort    ON public.course_comment_photos(comment_id, sort_order);

-- --------------------------------------------------------------------
-- 6) 접근/로그인 (카카오 + 접근코드)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_links (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code      varchar UNIQUE,     -- 기존 비밀번호 기반 접근 (옵션)
  kakao_user_id    varchar,            -- 카카오 식별자
  kakao_nickname   varchar,
  kakao_profile_url text,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_active ON public.access_links(is_active);
CREATE INDEX IF NOT EXISTS idx_access_kakao  ON public.access_links(kakao_user_id);

-- --------------------------------------------------------------------
-- 7) 관리자 계정
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username       varchar UNIQUE NOT NULL,
  password_hash  varchar NOT NULL,
  role           varchar NOT NULL DEFAULT 'editor' CHECK (role IN ('super','editor')),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ====================================================================
-- (선택) RLS 정책 샘플 — Supabase 권장
--  - 전제: JWT에 kakao_user_id 클레임을 주입해 사용
--  - 없을 경우, 정책의 current_setting 키를 프로젝트에 맞춰 수정 필요
-- ====================================================================

-- --------------------------------------------------
-- 공개 조회는 허용(삭제된 댓글은 숨김)
-- --------------------------------------------------
ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='course_comments' AND policyname='comments_select_not_deleted'
  ) THEN
    CREATE POLICY comments_select_not_deleted
      ON public.course_comments
      FOR SELECT
      USING (is_deleted = false OR (author_user_key IS NOT NULL AND author_user_key = current_setting('request.jwt.claim.kakao_user_id', true)));
  END IF;
END$$;

-- 작성(INSERT): 로그인 사용자만, 본인 키로 작성
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='course_comments' AND policyname='comments_insert_self'
  ) THEN
    CREATE POLICY comments_insert_self
      ON public.course_comments
      FOR INSERT
      WITH CHECK (
        current_setting('request.jwt.claim.kakao_user_id', true) IS NOT NULL
        AND author_user_key = current_setting('request.jwt.claim.kakao_user_id', true)
      );
  END IF;
END$$;

-- 수정/삭제(UPDATE/DELETE): 본인 또는 관리자
--  - 관리자는 별도 RPC/서버에서 role 클레임을 넣어 실행하는 패턴 권장
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='course_comments' AND policyname='comments_update_owner_or_admin'
  ) THEN
    CREATE POLICY comments_update_owner_or_admin
      ON public.course_comments
      FOR UPDATE
      USING (
        (author_user_key = current_setting('request.jwt.claim.kakao_user_id', true))
        OR (current_setting('request.jwt.claim.role', true) = 'admin')
      )
      WITH CHECK (
        (author_user_key = current_setting('request.jwt.claim.kakao_user_id', true))
        OR (current_setting('request.jwt.claim.role', true) = 'admin')
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='course_comments' AND policyname='comments_delete_owner_or_admin'
  ) THEN
    CREATE POLICY comments_delete_owner_or_admin
      ON public.course_comments
      FOR DELETE
      USING (
        (author_user_key = current_setting('request.jwt.claim.kakao_user_id', true))
        OR (current_setting('request.jwt.claim.role', true) = 'admin')
      );
  END IF;
END$$;

-- 댓글 사진 RLS
ALTER TABLE public.course_comment_photos ENABLE ROW LEVEL SECURITY;

-- 조회: 상위 댓글이 보이는 조건과 동일하게 허용(간단 버전)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='course_comment_photos' AND policyname='comment_photos_select_public'
  ) THEN
    CREATE POLICY comment_photos_select_public
      ON public.course_comment_photos
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.course_comments c
          WHERE c.id = course_comment_photos.comment_id
            AND (c.is_deleted = false OR (c.author_user_key IS NOT NULL AND c.author_user_key = current_setting('request.jwt.claim.kakao_user_id', true)))
        )
      );
  END IF;
END$$;

-- 삽입/삭제: 상위 댓글의 작성자(또는 관리자)만
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='course_comment_photos' AND policyname='comment_photos_ins_del_owner_or_admin'
  ) THEN
    CREATE POLICY comment_photos_ins_del_owner_or_admin
      ON public.course_comment_photos
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.course_comments c
          WHERE c.id = course_comment_photos.comment_id
            AND (
              c.author_user_key = current_setting('request.jwt.claim.kakao_user_id', true)
              OR current_setting('request.jwt.claim.role', true) = 'admin'
            )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.course_comments c
          WHERE c.id = course_comment_photos.comment_id
            AND (
              c.author_user_key = current_setting('request.jwt.claim.kakao_user_id', true)
              OR current_setting('request.jwt.claim.role', true) = 'admin'
            )
        )
      );
  END IF;
END$$;

-- (선택) 공개 조회 허용을 위한 기본 anon 권한(프로젝트 정책에 맞게 조절)
-- REVOKE ALL ON public.course_comments FROM PUBLIC;
-- REVOKE ALL ON public.course_comment_photos FROM PUBLIC;

COMMIT;

-- ====================================================================
-- 참고:
-- - Kakao 로그인 시 서버(Edge Function 등)에서 JWT에
--   `kakao_user_id`를 custom claim으로 주입하면 위 정책이 동작합니다.
-- - Storage 버킷(`comment-photos`)은 정책을 별도로 구성하고
--   업로드는 signed URL 발급 → 클라이언트 업로드 → file_url 저장 흐름 권장.
-- - 1km 마커: gpx_data.points[].dist(미터) 사전계산 필수.
-- ====================================================================
