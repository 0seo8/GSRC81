-- ============================================================================
-- GSRC81 게스트 모드 지원 마이그레이션
-- 생성일: 2025-12-20
-- 설명: 게스트 사용자 및 코드 인증 사용자 구분 지원
-- ============================================================================

-- ============================================================================
-- 1. access_links 테이블에 verified 컬럼 추가
-- ============================================================================
-- verified = TRUE: 접근 코드로 인증된 사용자 (코스 등록 가능)
-- verified = FALSE: 게스트 사용자 (조회만 가능)

ALTER TABLE access_links
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 2. 기존 사용자들 verified = TRUE로 마이그레이션
-- ============================================================================
-- access_code_id가 있는 기존 사용자는 모두 인증된 사용자로 처리

UPDATE access_links
SET verified = TRUE
WHERE access_code_id IS NOT NULL;

-- ============================================================================
-- 3. access_links RLS 정책 업데이트
-- ============================================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "allow_insert_for_verification_or_guest" ON access_links;

-- 신규 정책: 게스트 사용자 생성 허용
CREATE POLICY "allow_guest_user_creation"
  ON access_links FOR INSERT
  WITH CHECK (
    -- 게스트 사용자: access_code_id = NULL, verified = FALSE
    (access_code_id IS NULL AND verified = FALSE)
    OR
    -- 코드 인증 사용자: access_code_id가 유효한 코드
    (access_code_id IS NOT NULL)
  );

-- ============================================================================
-- 4. 인덱스 추가 (성능 최적화)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_access_links_verified
  ON access_links(verified);

CREATE INDEX IF NOT EXISTS idx_access_links_kakao_user_verified
  ON access_links(kakao_user_id, verified);

-- ============================================================================
-- 5. 주석 추가
-- ============================================================================

COMMENT ON COLUMN access_links.verified IS '접근 코드로 인증된 사용자 여부 (TRUE: 코스 등록 가능, FALSE: 게스트)';
