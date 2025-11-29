# 사용자 관리 시스템 마이그레이션 실행 가이드

## 1단계: Supabase SQL Editor 열기

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 `SQL Editor` 클릭
   - 또는 직접 URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`

## 2단계: 마이그레이션 SQL 실행

### 방법 1: 파일 내용 복사해서 실행

1. **마이그레이션 파일 열기**
   ```bash
   # 로컬에서 파일 확인
   cat migrations/20250129_add_user_admin_system.sql
   ```

2. **SQL Editor에서 실행**
   - `New query` 버튼 클릭
   - 마이그레이션 파일 전체 내용 복사
   - SQL Editor에 붙여넣기
   - `Run` 버튼 클릭 (또는 `Cmd/Ctrl + Enter`)

### 방법 2: Supabase CLI 사용 (선택사항)

```bash
# Supabase CLI가 설치되어 있다면
supabase db push
```

## 3단계: 마이그레이션 확인

실행 후 다음 쿼리로 확인:

```sql
-- 1. is_admin 컬럼이 추가되었는지 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'access_links' AND column_name = 'is_admin';

-- 2. admin_action_logs 테이블이 생성되었는지 확인
SELECT * FROM information_schema.tables
WHERE table_name = 'admin_action_logs';

-- 3. 인덱스 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('access_links', 'admin_action_logs')
AND indexname LIKE '%admin%';

-- 4. RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('access_links', 'admin_action_logs');

-- 5. 트리거 확인
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'ensure_minimum_admin';
```

**예상 결과**:
- ✅ `is_admin` 컬럼이 `access_links` 테이블에 존재
- ✅ `admin_action_logs` 테이블이 생성됨
- ✅ 인덱스 3개 이상 생성됨
- ✅ RLS 정책 5개 이상 생성됨
- ✅ `ensure_minimum_admin` 트리거 생성됨

## 4단계: 첫 관리자 설정

### 방법 A: Kakao User ID로 설정 (추천)

```sql
-- 먼저 본인의 Kakao User ID 확인
SELECT id, kakao_user_id, kakao_nickname, is_admin
FROM access_links
WHERE kakao_nickname = '본인닉네임';

-- 본인을 관리자로 설정
UPDATE access_links
SET is_admin = true
WHERE kakao_user_id = 'YOUR_KAKAO_USER_ID';

-- 또는 ID로 설정
UPDATE access_links
SET is_admin = true
WHERE id = 'YOUR_USER_UUID';

-- 확인
SELECT id, kakao_nickname, is_admin
FROM access_links
WHERE is_admin = true;
```

### 방법 B: 가장 먼저 가입한 사용자를 관리자로 설정

```sql
-- 가장 먼저 가입한 사용자를 관리자로 설정
UPDATE access_links
SET is_admin = true
WHERE id = (
  SELECT id FROM access_links
  ORDER BY created_at ASC
  LIMIT 1
);
```

## 5단계: 테스트

### 테스트 1: 관리자 확인

```sql
-- 관리자 목록 확인
SELECT id, kakao_nickname, is_admin, created_at
FROM access_links
WHERE is_admin = true;
```

### 테스트 2: 최소 관리자 보호 테스트

```sql
-- 마지막 관리자 해제 시도 (실패해야 정상)
UPDATE access_links
SET is_admin = false
WHERE is_admin = true
LIMIT 1;

-- 에러 메시지 확인:
-- "Cannot revoke admin privileges: at least one admin must remain"
```

### 테스트 3: UI 테스트

1. **개발 서버 시작**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **관리자 페이지 접속**
   - http://localhost:3000/admin/login
   - 로그인 후 → http://localhost:3000/admin
   - "사용자 관리" 메뉴 클릭

3. **기능 테스트**
   - ✅ 사용자 목록이 보이는지 확인
   - ✅ 검색 기능 테스트
   - ✅ 필터 (전체/관리자/일반) 테스트
   - ✅ 관리자 지정 버튼 클릭 → 확인 다이얼로그 표시
   - ✅ 관리자 지정 → 성공 토스트 메시지
   - ✅ 감사 로그 확인:
     ```sql
     SELECT * FROM admin_action_logs
     ORDER BY created_at DESC
     LIMIT 10;
     ```

### 테스트 4: API 테스트

```bash
# 사용자 목록 조회
curl http://localhost:3000/api/admin/users

# 사용자 목록 조회 (필터)
curl http://localhost:3000/api/admin/users?filter=admin

# 사용자 목록 조회 (검색)
curl http://localhost:3000/api/admin/users?search=닉네임

# 관리자 지정
curl -X POST http://localhost:3000/api/admin/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"action": "grant"}'

# 관리자 해제
curl -X POST http://localhost:3000/api/admin/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"action": "revoke"}'
```

## 6단계: 프로덕션 배포 (선택사항)

### 프로덕션 데이터베이스에 마이그레이션 실행

**⚠️ 주의사항**:
- 반드시 백업 먼저!
- 트래픽이 적은 시간대 선택
- 롤백 계획 준비

```sql
-- 프로덕션 환경에서도 동일하게 실행
-- 1. migrations/20250129_add_user_admin_system.sql 실행
-- 2. 첫 관리자 설정
-- 3. 테스트
```

## 7단계: 모니터링

### 감사 로그 확인

```sql
-- 최근 관리자 작업 확인
SELECT
  al.created_at,
  a.kakao_nickname as admin_name,
  al.action_type,
  t.kakao_nickname as target_name,
  al.ip_address
FROM admin_action_logs al
JOIN access_links a ON al.admin_id = a.id
JOIN access_links t ON al.target_user_id = t.id
ORDER BY al.created_at DESC
LIMIT 20;
```

### 관리자 수 모니터링

```sql
-- 현재 관리자 수 확인
SELECT COUNT(*) as admin_count
FROM access_links
WHERE is_admin = true;
```

## 롤백 (문제 발생 시)

```sql
-- 전체 롤백
BEGIN;

-- 테이블 삭제
DROP TABLE IF EXISTS admin_action_logs CASCADE;

-- 컬럼 제거
ALTER TABLE access_links DROP COLUMN IF EXISTS is_admin;

-- 트리거 제거
DROP TRIGGER IF EXISTS ensure_minimum_admin ON access_links;
DROP FUNCTION IF EXISTS check_minimum_admin_count();

-- 백업에서 복원 (선택사항)
DROP TABLE IF EXISTS access_links;
ALTER TABLE access_links_backup_20250129 RENAME TO access_links;

COMMIT;
```

## 문제 해결

### 문제 1: 마이그레이션 실행 오류

**증상**: SQL 실행 시 에러 발생

**해결**:
1. 기존 테이블/컬럼 확인
   ```sql
   SELECT * FROM information_schema.columns
   WHERE table_name = 'access_links' AND column_name = 'is_admin';
   ```
2. 이미 존재하면 해당 부분 스킵하고 계속 진행

### 문제 2: RLS 정책 충돌

**증상**: RLS 정책 생성 실패

**해결**:
```sql
-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Users can view all access_links" ON access_links;
-- 마이그레이션 SQL 다시 실행
```

### 문제 3: 관리자 페이지 접근 불가

**증상**: `/admin/users` 페이지 404

**해결**:
1. 개발 서버 재시작
2. 라우트 확인: `src/app/admin/users/page.tsx` 존재 확인

### 문제 4: API 호출 실패

**증상**: API 요청 시 500 에러

**해결**:
1. 브라우저 개발자 도구 → Network 탭 확인
2. 서버 로그 확인
3. Supabase 연결 확인

## 완료 체크리스트

- [ ] 마이그레이션 SQL 실행 완료
- [ ] 테이블 및 컬럼 생성 확인
- [ ] 인덱스 생성 확인
- [ ] RLS 정책 생성 확인
- [ ] 트리거 생성 확인
- [ ] 첫 관리자 설정 완료
- [ ] UI에서 사용자 목록 확인
- [ ] 관리자 지정 기능 테스트
- [ ] 감사 로그 기록 확인
- [ ] 최소 관리자 보호 테스트
- [ ] 프로덕션 배포 (선택사항)

## 다음 단계

모든 테스트가 완료되면:
1. 코드 커밋 및 푸시
2. 문서 업데이트
3. 팀원에게 공유

축하합니다! 🎉 사용자 관리 시스템이 성공적으로 구축되었습니다.