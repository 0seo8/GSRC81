-- ============================================================================
-- GSRC81 관리자 감사 로그 시스템
-- 생성일: 2025-12-25
-- 설명: 관리자 작업 추적 및 감사를 위한 테이블 생성
-- ============================================================================

-- ============================================================================
-- 1. admin_audit_logs 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 관리자 정보
  admin_user_id TEXT NOT NULL, -- Kakao 사용자 ID
  admin_nickname TEXT, -- 관리자 닉네임 (스냅샷)

  -- 작업 정보
  action TEXT NOT NULL, -- 작업 타입
  target_type TEXT, -- 대상 타입 (course, user, settings)
  target_id TEXT, -- 대상 ID

  -- 변경 내용
  metadata JSONB DEFAULT '{}'::jsonb, -- 추가 메타데이터
  old_value JSONB, -- 변경 전 값
  new_value JSONB, -- 변경 후 값

  -- IP 및 환경 정보
  ip_address TEXT,
  user_agent TEXT,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. 인덱스 생성
-- ============================================================================

-- 관리자별 로그 조회 최적화
CREATE INDEX idx_admin_audit_logs_admin_user_id
ON admin_audit_logs(admin_user_id);

-- 작업 타입별 조회 최적화
CREATE INDEX idx_admin_audit_logs_action
ON admin_audit_logs(action);

-- 대상 타입별 조회 최적화
CREATE INDEX idx_admin_audit_logs_target
ON admin_audit_logs(target_type, target_id);

-- 시간별 조회 최적화
CREATE INDEX idx_admin_audit_logs_created_at
ON admin_audit_logs(created_at DESC);

-- ============================================================================
-- 3. RLS (Row Level Security) 설정
-- ============================================================================

-- RLS 활성화
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 자신의 로그 조회 가능
CREATE POLICY "Admins can view their own logs"
ON admin_audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.kakao_user_id = admin_audit_logs.admin_user_id
    AND users.is_admin = true
  )
);

-- 관리자만 로그 생성 가능
CREATE POLICY "Admins can create logs"
ON admin_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.kakao_user_id = admin_audit_logs.admin_user_id
    AND users.is_admin = true
  )
);

-- 로그 수정/삭제 불가 (감사 무결성 보장)
-- 별도의 UPDATE/DELETE 정책 없음

-- ============================================================================
-- 4. 주석 추가
-- ============================================================================

COMMENT ON TABLE admin_audit_logs IS '관리자 작업 감사 로그';
COMMENT ON COLUMN admin_audit_logs.admin_user_id IS '작업 수행한 관리자 Kakao ID';
COMMENT ON COLUMN admin_audit_logs.action IS '작업 타입 (예: CREATE_COURSE, DELETE_COURSE, GRANT_ADMIN)';
COMMENT ON COLUMN admin_audit_logs.target_type IS '대상 타입 (course, user, settings 등)';
COMMENT ON COLUMN admin_audit_logs.target_id IS '대상 객체 ID';
COMMENT ON COLUMN admin_audit_logs.metadata IS '추가 메타데이터 (JSONB)';
COMMENT ON COLUMN admin_audit_logs.old_value IS '변경 전 값';
COMMENT ON COLUMN admin_audit_logs.new_value IS '변경 후 값';

-- ============================================================================
-- 5. 작업 타입 Enum (문서화 목적)
-- ============================================================================

-- 코스 관련
-- - CREATE_COURSE: 코스 생성
-- - UPDATE_COURSE: 코스 수정
-- - DELETE_COURSE: 코스 삭제
-- - PUBLISH_COURSE: 코스 활성화
-- - UNPUBLISH_COURSE: 코스 비활성화

-- 사용자 관련
-- - GRANT_ADMIN: 관리자 권한 부여
-- - REVOKE_ADMIN: 관리자 권한 해제
-- - UPDATE_USER: 사용자 정보 수정
-- - DELETE_USER: 사용자 삭제

-- 설정 관련
-- - UPDATE_FLIGHT_SETTINGS: 비행 모드 설정 변경
-- - UPDATE_APP_SETTINGS: 앱 설정 변경
-- - CHANGE_PASSWORD: 앱 비밀번호 변경
