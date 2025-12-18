# Admin 인증 마이그레이션 가이드

## ⚠️ 보안 취약점 수정

기존 AdminContext는 다음과 같은 보안 취약점이 있었습니다:

1. **localStorage 사용** - XSS 공격에 취약
2. **클라이언트에서 Admin 테이블 조회** - 민감한 테이블 노출
3. **클라이언트에서 bcrypt 해싱** - 보안 취약

## 새로운 안전한 방식

### Server Component에서 Admin 보호

```typescript
// app/admin/layout.tsx
import { getAdminSession } from '@/app/actions/admin-auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div>
      <p>Welcome, {session.username}</p>
      {children}
    </div>
  );
}
```

### Client Component에서 로그인

```typescript
// app/admin/login/page.tsx
'use client';

import { loginAdmin } from '@/app/actions/admin-auth';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const result = await loginAdmin(username, password);

    if (result.success) {
      router.push('/admin');
      router.refresh(); // Server Component 리프레시
    } else {
      alert(result.error);
    }
  };

  return (
    <form action={handleSubmit}>
      <input name="username" required />
      <input name="password" type="password" required />
      <button type="submit">로그인</button>
    </form>
  );
}
```

### 로그아웃

```typescript
'use client';

import { logoutAdmin } from '@/app/actions/admin-auth';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAdmin();
    router.push('/');
    router.refresh();
  };

  return <button onClick={handleLogout}>로그아웃</button>;
}
```

## 보안 개선 사항

### Before (기존 - 취약)

```typescript
// ❌ localStorage (XSS 취약)
localStorage.setItem("gsrc81-admin-auth", JSON.stringify(adminAuth));

// ❌ 클라이언트에서 Admin 테이블 조회
const { data } = await supabase.from("admin").select("*");

// ❌ 클라이언트에서 bcrypt
const isValid = await bcrypt.compare(password, passwordHash);
```

### After (새 방식 - 안전)

```typescript
// ✅ httpOnly 쿠키 (XSS 방지)
cookieStore.set(ADMIN_SESSION_COOKIE, session, { httpOnly: true });

// ✅ Service Role로 RLS 우회 (서버 사이드만)
const supabase = createAdminClient();

// ✅ 서버에서만 bcrypt 처리
const isValid = await bcrypt.compare(password, admin.password_hash);
```

## RLS 정책 강화

Admin 테이블은 이제 클라이언트에서 완전히 차단됩니다:

```sql
-- 모든 클라이언트 접근 차단
CREATE POLICY "Block all client access to admin table"
ON admin FOR SELECT USING (false);
```

## 마이그레이션 체크리스트

- [ ] `AdminContext.tsx` 사용 중지
- [ ] Admin 라우트에 `getAdminSession()` 체크 추가
- [ ] 로그인 페이지를 Server Actions로 전환
- [ ] 기존 localStorage 기반 코드 제거
- [ ] Admin RLS 정책 적용 확인

## 추가 보안 권장사항

1. **HTTPS 필수**: 프로덕션에서 secure 쿠키 사용
2. **Rate Limiting**: 로그인 시도 제한
3. **2FA**: 이중 인증 추가 고려
4. **감사 로그**: Admin 작업 로그 기록
