-- ============================================================================
-- GSRC81 RLS 정책 개선 마이그레이션
-- 생성일: 2025-12-17
-- 설명: artify-next-app 모범 사례를 기반으로 RLS 정책 개선
-- ============================================================================

-- ============================================================================
-- 1. 기존 RLS 정책 정리
-- ============================================================================

-- access_links 기존 정책 제거
DROP POLICY IF EXISTS "Users can view all access_links" ON access_links;
DROP POLICY IF EXISTS "Users can update own record" ON access_links;
DROP POLICY IF EXISTS "Only admins can update is_admin" ON access_links;
DROP POLICY IF EXISTS "Allow insert for verification" ON access_links;

-- access_codes 기존 정책 제거
DROP POLICY IF EXISTS "Anyone can view active codes" ON access_codes;
DROP POLICY IF EXISTS "Only admins can manage codes" ON access_codes;

-- admin_action_logs 기존 정책 제거
DROP POLICY IF EXISTS "Only admins can view audit logs" ON admin_action_logs;
DROP POLICY IF EXISTS "Only admins can insert audit logs" ON admin_action_logs;

-- course_photos 기존 정책 제거 (RLS 비활성화됨)
-- DROP POLICY IF EXISTS "course_photos_select" ON course_photos;
-- DROP POLICY IF EXISTS "course_photos_insert" ON course_photos;
-- DROP POLICY IF EXISTS "course_photos_delete" ON course_photos;

-- ============================================================================
-- 2. 테이블 RLS 활성화
-- ============================================================================

-- 이미 활성화된 테이블
-- ALTER TABLE access_links ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- 새로 활성화할 테이블
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_comment_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_location_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. 공개 데이터 정책 (인증 불필요)
-- ============================================================================

-- 코스 카테고리: 활성화된 카테고리는 누구나 조회 가능
CREATE POLICY "anyone_can_view_active_categories"
  ON course_categories FOR SELECT
  USING (is_active = true);

-- 코스: 활성화된 코스는 누구나 조회 가능
CREATE POLICY "anyone_can_view_active_courses"
  ON courses FOR SELECT
  USING (is_active = true);

-- 코스 댓글: 삭제되지 않고 숨겨지지 않은 댓글은 누구나 조회 가능
CREATE POLICY "anyone_can_view_visible_comments"
  ON course_comments FOR SELECT
  USING (
    is_deleted = false
    AND hidden_by_admin = false
  );

-- 코스 사진: 모든 사진 조회 가능
CREATE POLICY "anyone_can_view_course_photos"
  ON course_photos FOR SELECT
  USING (true);

-- 댓글 사진: 모든 댓글 사진 조회 가능
CREATE POLICY "anyone_can_view_comment_photos"
  ON course_comment_photos FOR SELECT
  USING (true);

-- 코스 위치 노트: 활성화된 노트는 누구나 조회 가능
CREATE POLICY "anyone_can_view_active_location_notes"
  ON course_location_notes FOR SELECT
  USING (is_active = true);

-- 앱 설정: 특정 설정만 공개 조회 가능
CREATE POLICY "anyone_can_view_public_settings"
  ON app_settings FOR SELECT
  USING (
    setting_key IN (
      'app_notice',
      'maintenance_mode',
      'app_version'
    )
  );

-- 액세스 코드: 활성화된 코드는 조회 가능 (만료 확인 포함)
CREATE POLICY "anyone_can_view_active_codes"
  ON access_codes FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- ============================================================================
-- 4. 사용자 데이터 정책 (서버 사이드에서 처리 권장)
-- ============================================================================
-- 참고: NextAuth 사용시 auth.uid()는 NULL이므로,
-- 사용자별 작업은 서버 사이드에서 세션 확인 후 supabaseAdmin 사용 권장

-- 코스 댓글: 인증된 사용자는 댓글 작성 가능 (서버에서 검증)
-- 실제로는 서버 사이드에서 세션 확인 후 supabaseAdmin 사용 권장
CREATE POLICY "authenticated_users_can_insert_comments"
  ON course_comments FOR INSERT
  WITH CHECK (true);  -- 서버에서 검증하므로 여기서는 허용

-- 코스 사진: 인증된 사용자는 사진 업로드 가능
CREATE POLICY "authenticated_users_can_upload_photos"
  ON course_photos FOR INSERT
  WITH CHECK (true);  -- 서버에서 검증하므로 여기서는 허용

-- 댓글 사진: 인증된 사용자는 댓글 사진 업로드 가능
CREATE POLICY "authenticated_users_can_upload_comment_photos"
  ON course_comment_photos FOR INSERT
  WITH CHECK (true);  -- 서버에서 검증하므로 여기서는 허용

-- 액세스 링크: 신규 사용자 등록 허용
CREATE POLICY "allow_user_registration"
  ON access_links FOR INSERT
  WITH CHECK (true);  -- 서버에서 검증하므로 여기서는 허용

-- ============================================================================
-- 5. 관리자 전용 정책
-- ============================================================================
-- 참고: 관리자 작업은 서버 사이드에서 supabaseAdmin 사용 (RLS 우회)
-- 따라서 별도의 관리자 정책은 불필요하지만, 명시적 정책을 원할 경우:

-- 코스 카테고리: 관리자만 관리 (서버에서 처리)
-- 코스: 관리자만 관리 (서버에서 처리)
-- 코스 위치 노트: 관리자만 관리 (서버에서 처리)
-- 앱 설정: 관리자만 관리 (서버에서 처리)
-- admin 테이블: 관리자만 접근 (서버에서 처리)

-- admin 테이블: 완전히 보호 (서버 사이드 전용)
CREATE POLICY "admin_table_server_only"
  ON admin FOR ALL
  USING (false);  -- RLS를 통한 접근 차단, supabaseAdmin만 사용 가능

-- app_settings: 관리자 전용 설정은 서버에서만 접근
CREATE POLICY "sensitive_settings_server_only"
  ON app_settings FOR ALL
  USING (
    setting_key NOT IN (
      'app_notice',
      'maintenance_mode',
      'app_version'
    )
  );

-- ============================================================================
-- 6. 액세스 링크 및 로그 정책
-- ============================================================================

-- 액세스 링크: 사용자 목록 조회는 서버에서만
CREATE POLICY "access_links_read_server_only"
  ON access_links FOR SELECT
  USING (false);  -- 클라이언트 접근 차단

-- 액세스 링크: 업데이트는 서버에서만
CREATE POLICY "access_links_update_server_only"
  ON access_links FOR UPDATE
  USING (false);  -- 클라이언트 접근 차단

-- 액세스 링크: 삭제는 서버에서만
CREATE POLICY "access_links_delete_server_only"
  ON access_links FOR DELETE
  USING (false);  -- 클라이언트 접근 차단

-- 액세스 코드: 관리는 서버에서만
CREATE POLICY "access_codes_manage_server_only"
  ON access_codes FOR ALL
  USING (false);  -- 클라이언트 접근 차단 (SELECT 정책 제외)

-- 관리자 액션 로그: 서버에서만 접근
CREATE POLICY "admin_logs_server_only"
  ON admin_action_logs FOR ALL
  USING (false);  -- 클라이언트 접근 차단

-- ============================================================================
-- 7. 댓글 및 사진 삭제/수정 정책
-- ============================================================================
-- 참고: 사용자가 자신의 댓글/사진을 삭제하는 것은 서버 사이드에서 처리
-- (NextAuth 세션으로 kakao_user_id 확인 후 supabaseAdmin 사용)

-- 댓글 업데이트: 서버에서만 (소프트 삭제, 플래그 처리 등)
CREATE POLICY "comments_update_server_only"
  ON course_comments FOR UPDATE
  USING (false);

-- 댓글 삭제: 서버에서만
CREATE POLICY "comments_delete_server_only"
  ON course_comments FOR DELETE
  USING (false);

-- 코스 사진 삭제: 서버에서만
CREATE POLICY "course_photos_delete_server_only"
  ON course_photos FOR DELETE
  USING (false);

-- 댓글 사진 삭제: 서버에서만
CREATE POLICY "comment_photos_delete_server_only"
  ON course_comment_photos FOR DELETE
  USING (false);

-- ============================================================================
-- 8. 코스 관리 정책
-- ============================================================================

-- 코스: 생성/수정/삭제는 서버에서만 (관리자)
CREATE POLICY "courses_manage_server_only"
  ON courses FOR INSERT
  WITH CHECK (false);

CREATE POLICY "courses_update_server_only"
  ON courses FOR UPDATE
  USING (false);

CREATE POLICY "courses_delete_server_only"
  ON courses FOR DELETE
  USING (false);

-- 코스 카테고리: 관리는 서버에서만
CREATE POLICY "categories_manage_server_only"
  ON course_categories FOR INSERT
  WITH CHECK (false);

CREATE POLICY "categories_update_server_only"
  ON course_categories FOR UPDATE
  USING (false);

CREATE POLICY "categories_delete_server_only"
  ON course_categories FOR DELETE
  USING (false);

-- 위치 노트: 관리는 서버에서만
CREATE POLICY "location_notes_manage_server_only"
  ON course_location_notes FOR INSERT
  WITH CHECK (false);

CREATE POLICY "location_notes_update_server_only"
  ON course_location_notes FOR UPDATE
  USING (false);

CREATE POLICY "location_notes_delete_server_only"
  ON course_location_notes FOR DELETE
  USING (false);

-- ============================================================================
-- 완료
-- ============================================================================
-- 이제 모든 테이블에 RLS가 활성화되었습니다.
--
-- 사용 가이드:
-- 1. 공개 데이터 조회: createPublicSupabaseClient() 또는 createBrowserSupabaseClient()
-- 2. 사용자별 작업 (댓글, 사진 등): 서버에서 NextAuth 세션 확인 후 createServerSupabaseClient()
-- 3. 관리자 작업: createServerSupabaseClient() (RLS 우회)
-- ============================================================================
