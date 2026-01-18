# Verify Page (`/verify`)

## 1. 개요

`/verify` 페이지는 **카카오 로그인 후 신규 사용자에게 1회용 접근 코드(Access Code)를 검증**하는 기능을 담당합니다.
관리자가 제공한 코드를 입력하면 Supabase의 `access_links` 테이블에 사용자 정보가 연결되며, 검증을 마친 사용자만 `/map`으로 이동할 수 있습니다.

**중요:** 인증 상태 확인은 **미들웨어**가 처리하며, 이 페이지는 순수하게 **접근 코드 검증 및 DB 업데이트**만 담당합니다.

---

## 2. 위치

- **Path:** `/verify?uid={kakaoUserId}`
- **File:** `src/app/verify/page.tsx`
- **Utilities:** `src/lib/auth/verification.ts`
- **Type:** Client Component (Suspense로 감싸서 사용)

---

## 3. 주요 기능

### 3-1. 접근 코드 검증

- 사용자가 접근 코드를 입력하면 Supabase의 `access_links`에서 일치하는지 확인
- 코드가 유효하면 해당 레코드에 `kakao_user_id`를 연결
- **중복 사용 방지**: 이미 사용된 코드는 재사용 불가

### 3-2. 자동 인증 체크

- 페이지 첫 진입 시 즉시 검증 여부를 확인
- 이미 검증된 사용자라면 화면 표시 없이 곧바로 `/map`으로 리다이렉트
- **미들웨어**가 1차로 체크하지만, 클라이언트에서도 추가 확인

### 3-3. NextAuth 세션 관리

- 검증 성공 시 `updateSession()` 호출로 NextAuth 세션 갱신
- **수동 쿠키 생성 제거**: NextAuth가 자동으로 세션 쿠키 관리
- localStorage 사용 제거: 단일 인증 전략 (NextAuth 세션만 사용)

---

## 4. 리팩토링 전후 비교 (2025-11-25)

### Before: 수동 쿠키 관리

```typescript
// ❌ 문제점: 수동 쿠키 생성, 중복 로직, localStorage 혼용
const authData = {
  authenticated: true,
  timestamp: Date.now(),
  type: "kakao",
  kakaoUserId: kakaoUserId,
};

document.cookie = \`gsrc81-auth=\${JSON.stringify(authData)}; Max-Age=86400; path=/; SameSite=Lax\`;
localStorage.setItem("gsrc81-auth", JSON.stringify(authData));

// DB 검증 로직이 useEffect와 handleVerify에 중복
const { data: existingUser } = await supabase
  .from("access_links")
  .select("*")
  .eq("kakao_user_id", kakaoUserId)
  .single();
```

### After: NextAuth 세션 + 유틸리티 함수

```typescript
// ✅ 개선: NextAuth 세션 갱신, 유틸리티 함수, 중복 제거
import { useSession } from "next-auth/react";
import { verifyAccessCode, isUserVerified } from "@/lib/auth/verification";

const { update: updateSession } = useSession();

// 검증 여부 확인 (유틸리티 함수)
const verified = await isUserVerified(kakaoUserId);

// 접근 코드 검증 (유틸리티 함수)
const result = await verifyAccessCode(code, kakaoUserId);

// NextAuth 세션 갱신 (쿠키 자동 관리)
await updateSession();
router.push("/map");
router.refresh();
```

---

## 5. 개선 효과 (2025-11-25)

| 문제점                      | 개선 내용                    |
| --------------------------- | ---------------------------- |
| ❌ 중복된 검증 로직         | ✅ 유틸리티 함수로 통합      |
| ❌ 수동 쿠키 생성           | ✅ NextAuth 세션 자동 관리   |
| ❌ 쿠키 + localStorage 혼용 | ✅ NextAuth 세션만 사용      |
| ❌ UI 깜빡임                | ✅ checking 상태로 로딩 표시 |

---

## 6. 미들웨어와의 협업

| 역할               | 담당 컴포넌트                 |
| ------------------ | ----------------------------- |
| **인증 여부 판단** | 미들웨어 (1차), 페이지 (2차)  |
| **접근 코드 검증** | Verify 페이지                 |
| **DB 업데이트**    | Verify 페이지 (유틸리티 함수) |
| **세션 관리**      | NextAuth                      |
| **리다이렉트**     | Verify 페이지 (useRouter)     |

---

## 7. 관련 문서

- [02-login-page.md](02-login-page.md) - 로그인 페이지 및 인증 흐름
- [08-middleware.md](08-middleware.md) - 미들웨어 인증 로직
- [00-refactoring-summary.md](00-refactoring-summary.md) - 전체 리팩토링 히스토리

---

## 8. 요약

### 현재 상태 (2025-11-25)

`/verify` 페이지는:

- ✅ **유틸리티 함수 분리**: `verification.ts`로 재사용 가능
- ✅ **NextAuth 세션 통합**: 수동 쿠키 제거
- ✅ **중복 로직 제거**: 검증 로직 단일화
- ✅ **미들웨어 협업**: 역할 분담 명확화
- ✅ **UI/UX 개선**: 로딩 상태 명확한 표시

검증 페이지는 이제 **단일 책임 원칙**을 따르며, NextAuth 세션과 완벽하게 통합된 **깔끔한 구조**로 개선되었습니다!
