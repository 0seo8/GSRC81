# 관리자 페이지 사용자 관리 기능 설계

## 현재 상황 분석

### 데이터베이스 구조

#### 1. `access_links` 테이블 (일반 사용자)
```sql
- id (uuid, pk)
- access_code (varchar)
- is_active (boolean)
- kakao_user_id (varchar, unique)
- kakao_nickname (varchar)
- kakao_profile_url (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**용도**: Kakao 로그인한 일반 사용자 관리

#### 2. `admin` 테이블 (관리자)
```sql
- id (uuid, pk)
- username (varchar, unique)
- password_hash (varchar)
- created_at (timestamptz)
- last_login_at (timestamptz)
```

**용도**: 관리자 계정 관리 (별도 username/password 로그인)

### 문제점

- `access_links`와 `admin` 테이블이 독립적으로 존재
- 일반 사용자를 관리자로 승격할 수 있는 연결 고리가 없음
- 두 가지 인증 시스템이 분리되어 있음

---

## 해결 방안

### 방안 1: `access_links` 테이블에 `is_admin` 컬럼 추가 (추천 ⭐⭐⭐)

#### 장점
- ✅ 간단하고 직관적
- ✅ 기존 인증 시스템 활용
- ✅ 마이그레이션 최소화
- ✅ 일반 사용자와 관리자를 한 곳에서 관리

#### 구현
```sql
ALTER TABLE access_links
ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- 인덱스 추가 (관리자 조회 성능 향상)
CREATE INDEX idx_access_links_is_admin ON access_links(is_admin)
WHERE is_admin = true;
```

#### 데이터 흐름
1. 사용자가 Kakao로 로그인 → `access_links` 테이블에 저장
2. 관리자가 해당 사용자를 관리자로 지정 → `is_admin = true`
3. 로그인 시 `is_admin` 체크하여 관리자 권한 부여

### 방안 2: `admin` 테이블에 `user_id` 컬럼 추가

#### 구현
```sql
ALTER TABLE admin
ADD COLUMN user_id UUID REFERENCES access_links(id);

-- 기존 username/password 로그인도 유지
-- user_id가 있으면 Kakao 사용자 기반 관리자
-- user_id가 NULL이면 전통적인 username/password 관리자
```

#### 장점
- ✅ 두 인증 시스템 모두 유지
- ✅ 관리자 전용 테이블 유지

#### 단점
- ❌ 복잡도 증가
- ❌ 두 가지 관리자 타입 관리 필요
- ❌ 인증 로직 복잡해짐

---

## 추천 방안: 방안 1

### 이유
1. **단순성**: 하나의 테이블에서 모든 사용자 관리
2. **일관성**: 모든 사용자가 Kakao 로그인 사용
3. **확장성**: 향후 역할 기반 권한 관리(RBAC)로 확장 가능
4. **성능**: 조인 없이 사용자 정보와 권한 확인 가능

### 마이그레이션 계획

#### 1단계: 데이터베이스 스키마 변경
```sql
-- is_admin 컬럼 추가
ALTER TABLE access_links
ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- 인덱스 추가
CREATE INDEX idx_access_links_is_admin ON access_links(is_admin)
WHERE is_admin = true;

-- 기존 admin 테이블의 사용자를 access_links로 마이그레이션 (선택사항)
-- 또는 admin 테이블은 유지하되 새로운 관리자는 access_links 사용
```

#### 2단계: 인증 로직 수정
```typescript
// contexts/AdminContext.tsx 또는 middleware
async function checkAdminPermission(userId: string) {
  const { data } = await supabase
    .from('access_links')
    .select('is_admin')
    .eq('id', userId)
    .single();

  return data?.is_admin === true;
}
```

#### 3단계: 사용자 관리 UI 추가
- `/admin/users` 페이지 생성
- 사용자 목록 표시
- 관리자 지정/해제 토글

---

## UI/UX 설계

### 새 페이지: `/admin/users`

#### 레이아웃
```
+------------------------------------------+
| 관리자 대시보드 > 사용자 관리             |
+------------------------------------------+
| 🔍 검색: [        ] | 필터: [전체▼]      |
+------------------------------------------+
| 사용자 목록 (총 25명)                     |
+------------------------------------------+
| 👤 홍길동              | 일반 | [관리자 지정] |
| 📅 가입일: 2025-01-15                    |
+------------------------------------------+
| 👤 김철수             | ⭐관리자 | [해제]    |
| 📅 가입일: 2025-01-10                    |
+------------------------------------------+
| 👤 이영희              | 일반 | [관리자 지정] |
| 📅 가입일: 2025-01-20                    |
+------------------------------------------+
```

#### 주요 기능
1. **사용자 목록**
   - Kakao 닉네임
   - 프로필 이미지
   - 가입일
   - 상태 (일반/관리자)
   - 활성/비활성

2. **필터링**
   - 전체
   - 관리자만
   - 일반 사용자만
   - 비활성 사용자

3. **검색**
   - 닉네임으로 검색

4. **작업**
   - 관리자 지정/해제
   - 사용자 비활성화

#### 모바일 최적화
```
+-------------------------+
| 사용자 관리              |
+-------------------------+
| 🔍 [검색창]             |
+-------------------------+
| 👤 홍길동               |
| 일반 사용자             |
| 2025-01-15             |
| [관리자 지정]           |
+-------------------------+
| 👤 김철수 ⭐            |
| 관리자                 |
| 2025-01-10             |
| [관리자 해제]           |
+-------------------------+
```

---

## 보안 고려사항

### 1. 권한 체크
```typescript
// middleware.ts 또는 API route
export async function requireAdmin(userId: string) {
  const { data } = await supabase
    .from('access_links')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (!data?.is_admin) {
    throw new Error('Unauthorized');
  }
}
```

### 2. 감사 로그
```sql
-- admin_actions 테이블 생성 (선택사항)
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES access_links(id),
  action_type VARCHAR, -- 'grant_admin', 'revoke_admin', etc.
  target_user_id UUID REFERENCES access_links(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. 최소 관리자 보호
- 최소 1명의 관리자는 항상 유지
- 자기 자신의 관리자 권한은 해제 불가

---

## 구현 체크리스트

### Phase 1: 데이터베이스
- [ ] `access_links` 테이블에 `is_admin` 컬럼 추가
- [ ] 인덱스 추가
- [ ] 마이그레이션 스크립트 작성

### Phase 2: API/로직
- [ ] 관리자 체크 함수 추가
- [ ] 사용자 목록 조회 API
- [ ] 관리자 지정/해제 API
- [ ] 권한 미들웨어 업데이트

### Phase 3: UI
- [ ] `/admin/users` 페이지 생성
- [ ] 사용자 목록 컴포넌트
- [ ] 관리자 지정/해제 버튼
- [ ] 검색/필터 기능
- [ ] 모바일 반응형 디자인

### Phase 4: 테스트
- [ ] 관리자 지정 테스트
- [ ] 권한 체크 테스트
- [ ] 최소 관리자 보호 테스트
- [ ] UI/UX 테스트

---

## 예상 작업 시간

- 데이터베이스 마이그레이션: 30분
- API 구현: 1시간
- UI 구현: 2시간
- 테스트 및 버그 수정: 1시간

**총 예상 시간**: 4-5시간

---

## 리스크 분석 및 완화 방안

### 🔴 HIGH 리스크

#### 1. 모든 관리자 제거 (시스템 잠김)

**리스크**: 실수로 모든 관리자 권한을 제거하면 아무도 관리자 페이지에 접근 불가

**완화 방안**:
```typescript
// 관리자 제거 전 체크
async function revokeAdmin(userId: string) {
  // 현재 관리자 수 확인
  const { count } = await supabase
    .from('access_links')
    .select('*', { count: 'exact', head: true })
    .eq('is_admin', true);

  if (count <= 1) {
    throw new Error('최소 1명의 관리자가 필요합니다');
  }

  // 제거 진행
  await supabase
    .from('access_links')
    .update({ is_admin: false })
    .eq('id', userId);
}
```

**추가 보호**:
- UI에서 마지막 관리자의 "해제" 버튼 비활성화
- 데이터베이스 레벨 제약 조건 추가 (트리거)
- 백업 관리자 계정 생성 및 보관

#### 2. 기존 `admin` 테이블과 충돌

**리스크**:
- 기존 `admin` 테이블 사용자와 새로운 `is_admin` 시스템이 충돌
- 두 가지 관리자 인증 방식이 공존하여 혼란

**완화 방안**:

**옵션 A - 기존 admin 테이블 유지 (하이브리드)**:
```typescript
async function isAdmin(userId: string, username?: string) {
  // 1. access_links의 is_admin 체크
  const { data: user } = await supabase
    .from('access_links')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (user?.is_admin) return true;

  // 2. 기존 admin 테이블 체크 (username 기반)
  if (username) {
    const { data: admin } = await supabase
      .from('admin')
      .select('id')
      .eq('username', username)
      .single();

    if (admin) return true;
  }

  return false;
}
```

**옵션 B - 완전 마이그레이션 (추천)**:
```sql
-- 1. 기존 admin 테이블 데이터 확인
SELECT * FROM admin;

-- 2. 필요시 admin 테이블을 백업
CREATE TABLE admin_backup AS SELECT * FROM admin;

-- 3. admin 테이블 사용 중단 (향후 삭제)
-- DROP TABLE admin; -- 나중에
```

#### 3. 권한 에스컬레이션 (자기 자신을 관리자로 만들기)

**리스크**: 일반 사용자가 API를 직접 호출하여 자신을 관리자로 만들 수 있음

**완화 방안**:
```typescript
// API route: /api/admin/users/[userId]/promote
export async function POST(req: Request) {
  // 1. 현재 로그인한 사용자 확인
  const currentUserId = await getCurrentUserId(req);

  // 2. 현재 사용자가 관리자인지 확인
  const { data: currentUser } = await supabase
    .from('access_links')
    .select('is_admin')
    .eq('id', currentUserId)
    .single();

  if (!currentUser?.is_admin) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // 3. 대상 사용자 ID 가져오기
  const { userId: targetUserId } = await req.json();

  // 4. 관리자 권한 부여
  await supabase
    .from('access_links')
    .update({ is_admin: true })
    .eq('id', targetUserId);

  return Response.json({ success: true });
}
```

**Row Level Security (RLS) 추가**:
```sql
-- access_links 테이블에 RLS 정책 추가
ALTER TABLE access_links ENABLE ROW LEVEL SECURITY;

-- is_admin 컬럼은 관리자만 수정 가능
CREATE POLICY "Only admins can update is_admin"
ON access_links
FOR UPDATE
USING (
  -- 현재 사용자가 관리자인 경우에만 허용
  EXISTS (
    SELECT 1 FROM access_links
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  -- 업데이트하려는 사용자가 관리자인 경우에만 허용
  EXISTS (
    SELECT 1 FROM access_links
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

### 🟡 MEDIUM 리스크

#### 4. 실수로 잘못된 사용자를 관리자로 지정

**리스크**: UI에서 실수로 클릭하여 의도하지 않은 사용자에게 관리자 권한 부여

**완화 방안**:
```typescript
// 확인 다이얼로그 추가
function AdminToggleButton({ user }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = async () => {
    // 1차 확인
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    // 2차 확인 후 실행
    if (user.is_admin) {
      await revokeAdmin(user.id);
    } else {
      await grantAdmin(user.id);
    }

    setShowConfirm(false);
  };

  return (
    <>
      <Button onClick={handleToggle}>
        {user.is_admin ? '관리자 해제' : '관리자 지정'}
      </Button>

      {showConfirm && (
        <Alert>
          <p>{user.nickname}님을 {user.is_admin ? '일반 사용자' : '관리자'}로 변경하시겠습니까?</p>
          <Button onClick={handleToggle}>확인</Button>
          <Button onClick={() => setShowConfirm(false)}>취소</Button>
        </Alert>
      )}
    </>
  );
}
```

#### 5. 감사 로그 부재

**리스크**: 누가 언제 누구를 관리자로 만들었는지 추적 불가

**완화 방안**:
```sql
-- 감사 로그 테이블 생성
CREATE TABLE admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES access_links(id), -- 작업 수행자
  action_type VARCHAR NOT NULL, -- 'grant_admin', 'revoke_admin'
  target_user_id UUID REFERENCES access_links(id), -- 대상 사용자
  target_user_nickname VARCHAR, -- 대상 사용자 닉네임 (스냅샷)
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX idx_admin_action_logs_admin_id ON admin_action_logs(admin_id);
CREATE INDEX idx_admin_action_logs_target_user_id ON admin_action_logs(target_user_id);
CREATE INDEX idx_admin_action_logs_created_at ON admin_action_logs(created_at DESC);
```

```typescript
// 로그 기록 함수
async function logAdminAction(
  adminId: string,
  action: 'grant_admin' | 'revoke_admin',
  targetUserId: string,
  targetUserNickname: string,
  req: Request
) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  await supabase.from('admin_action_logs').insert({
    admin_id: adminId,
    action_type: action,
    target_user_id: targetUserId,
    target_user_nickname: targetUserNickname,
    ip_address: ip,
    user_agent: userAgent,
  });
}
```

#### 6. 성능 문제 (대량 사용자)

**리스크**: 사용자가 수천 명이 되면 목록 로딩이 느려짐

**완화 방안**:
```typescript
// 페이지네이션 추가
async function getUsers(page = 1, pageSize = 20, filter?: 'admin' | 'user') {
  let query = supabase
    .from('access_links')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // 필터 적용
  if (filter === 'admin') {
    query = query.eq('is_admin', true);
  } else if (filter === 'user') {
    query = query.eq('is_admin', false);
  }

  // 페이지네이션
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.range(from, to);

  return {
    data,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}
```

### 🟢 LOW 리스크

#### 7. 데이터베이스 마이그레이션 실패

**리스크**: 마이그레이션 중 오류 발생

**완화 방안**:
```sql
-- 트랜잭션으로 실행
BEGIN;

-- 백업 테이블 생성
CREATE TABLE access_links_backup_20250129 AS
SELECT * FROM access_links;

-- 컬럼 추가
ALTER TABLE access_links
ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- 인덱스 추가
CREATE INDEX idx_access_links_is_admin ON access_links(is_admin)
WHERE is_admin = true;

-- 문제 없으면 커밋
COMMIT;
-- 문제 있으면 ROLLBACK;
```

#### 8. UI/UX 혼란

**리스크**: 관리자와 일반 사용자 구분이 명확하지 않음

**완화 방안**:
- 명확한 배지 표시 (⭐ 아이콘, "관리자" 라벨)
- 색상 구분 (관리자: 파란색, 일반: 회색)
- 툴팁으로 권한 설명

---

## 리스크 우선순위 및 필수 구현

### 필수 (MUST)
1. ✅ 최소 1명 관리자 유지 로직
2. ✅ 권한 체크 (API + RLS)
3. ✅ 확인 다이얼로그
4. ✅ 마이그레이션 트랜잭션

### 권장 (SHOULD)
5. ⚠️ 감사 로그
6. ⚠️ 페이지네이션
7. ⚠️ 기존 admin 테이블 처리 방안 결정

### 선택 (NICE TO HAVE)
8. 💡 되돌리기 기능
9. 💡 관리자 권한 만료 시간
10. 💡 이메일 알림

---

## 롤백 계획

만약 문제가 발생하면:

### 1. 데이터베이스 롤백
```sql
-- 백업에서 복원
DROP TABLE access_links;
ALTER TABLE access_links_backup_20250129 RENAME TO access_links;
```

### 2. 코드 롤백
```bash
git revert <commit-hash>
```

### 3. 긴급 관리자 복구
```sql
-- 직접 SQL로 관리자 권한 부여
UPDATE access_links
SET is_admin = true
WHERE kakao_user_id = '<your-kakao-id>';
```

---

## 다음 단계

1. ✅ 설계 문서 검토 및 승인
2. ✅ 리스크 분석 검토
3. ⏳ 리스크 완화 방안 구현 여부 결정
4. ⏳ 데이터베이스 마이그레이션 실행
5. ⏳ API 엔드포인트 구현
6. ⏳ UI 컴포넌트 개발
7. ⏳ 통합 테스트
