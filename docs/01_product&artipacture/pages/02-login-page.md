# Login Page (`/login`)

## 1. 개요

`/login` 페이지는 **카카오 로그인**과 **사용자 검증(verification)** 기능을 포함한 인증 진입점입니다.
NextAuth 기반 세션 관리와 미들웨어 기반 리다이렉트가 결합되어 있으며, 클라이언트 컴포넌트로 구성되어 있습니다.

**중요:** 스플래시 애니메이션은 이 페이지가 아닌 **GlobalSplash 컴포넌트**에서 전역적으로 처리됩니다.

---

## 2. 위치

- **Path:** `/login`
- **File:** `src/app/login/page.tsx`
- **Type:** Client Component
- **Config:** `src/lib/config/login-constants.ts`

---

## 3. 주요 기능

### 3-1. 스플래시 애니메이션 (전역 처리)

- **위치:** `GlobalSplash` 컴포넌트 (Providers 레벨)
- **동작:** 모든 앱 진입 시 sessionStorage 기반으로 표시
- **상세:** [09-global-splash-system.md](09-global-splash-system.md) 참조

### 3-2. 카카오 로그인 연동

- NextAuth의 Kakao Provider 사용
- 한 번의 클릭으로 OAuth 로그인 가능
- 로그인 성공 후 NextAuth가 자동으로 세션 생성
- **미들웨어**가 인증 여부와 검증 상태를 체크하여 자동 리다이렉트

### 3-3. 인증 및 검증 흐름

1. NextAuth 세션 상태 확인
2. 사용자가 로그인된 상태인지 체크
3. **미들웨어**가 Supabase `access_links` 테이블에서 "검증됨(verified)" 여부 확인
4. 조건에 따른 이동 (**미들웨어가 처리**)
   - **로그인 + 검증됨** → `/map`
   - **로그인 + 미검증** → `/verify`
   - **미로그인** → `/login` 페이지 표시

---

## 4. 상태 관리

```typescript
const { data: session, status } = useSession();
const router = useRouter();

const isLoading = status === "loading";
const isAuthenticated = !!session;
```

### 개선 이력

**Before (2025-11-24 이전):**

```typescript
// ❌ 불필요한 AuthContext 래퍼 사용
const { kakaoUserId, kakaoNickname } = useAuth();
```

**After (2025-11-24):**

```typescript
// ✅ NextAuth useSession 직접 사용
const { data: session, status } = useSession();
```

**Latest (2025-11-25):**

```typescript
// ✅ useRouter로 Next.js 표준 네비게이션 사용
import { useRouter } from "next/navigation";
router.push(LOGIN_CONFIG.ROUTES.LOGIN);
router.refresh(); // 미들웨어 트리거
```

---

## 5. 사용자 흐름

```mermaid
graph TD
    A[앱 진입] --> B[GlobalSplash 체크]
    B --> C[스플래시 표시 여부 결정]
    C --> D[/login 접근]
    D --> E{미들웨어 체크}
    E -->|로그인 안됨| F[로그인 폼 표시]
    E -->|로그인됨 + 검증됨| G[/map 리다이렉트]
    E -->|로그인됨 + 미검증| H[/verify 리다이렉트]
    F --> I[카카오 로그인 클릭]
    I --> J[Kakao OAuth]
    J --> K[로그인 성공]
    K --> E
```

---

## 6. 컴포넌트 구조

### 파일 구조

```
src/
├── app/
│   └── login/
│       └── page.tsx              ← 로그인 페이지 (클라이언트 컴포넌트)
├── lib/
│   └── config/
│       └── login-constants.ts    ← ✅ 설정 파일 분리 (2025-11-25)
├── components/
│   ├── global-splash.tsx         ← 전역 스플래시 (Providers에서 사용)
│   └── ui/
│       └── figma-button.tsx      ← 커스텀 버튼
└── middleware.ts                 ← 인증/검증 로직 처리
```

### 사용 컴포넌트

- **`useSession`** — NextAuth 세션 훅
- **`useRouter`** — Next.js 네비게이션 훅
- **`signIn`** — NextAuth 로그인 함수
- **`FigmaButton`** — 커스텀 버튼 컴포넌트
- **`LOGIN_CONFIG`** — 설정 파일 (상수 관리)

---

## 7. 최근 리팩토링 내역

### 2025-11-25 (최신)

#### ✅ 완료된 개선

##### 1) 설정 파일 분리

- **Before:** 페이지 내부에 CONSTANTS 객체
- **After:** `lib/config/login-constants.ts`로 분리
- **효과:**
  - 재사용 가능한 설정 관리
  - 페이지 코드 간소화
  - 타입 안전성 향상 (`as const` 사용)

**파일 구조:**

```typescript
// src/lib/config/login-constants.ts
export const LOGIN_CONFIG = {
  LOGO: { WIDTH: 296, HEIGHT: 187, SRC: "/logo.png", ALT: "..." },
  SPACING: { LOGO_BOTTOM: "mb-12", ... },
  COLORS: { BACKGROUND: "bg-gray-100", ... },
  TEXT: { TITLE: "GSRC81 MAPS", ... },
  ROUTES: { LOGIN: "/login", MAP: "/map", VERIFY: "/verify" }
} as const;
```

##### 2) Next.js Router 사용

- **Before:** `window.location.href = "/login"`
- **After:** `router.push(LOGIN_CONFIG.ROUTES.LOGIN); router.refresh();`
- **효과:**
  - Next.js 표준 네비게이션 패턴
  - 클라이언트 사이드 라우팅 활용
  - 미들웨어 트리거를 위한 명시적 refresh

##### 3) 로컬 스플래시 로직 제거

- **Before:** 페이지별 스플래시 상태 관리
- **After:** GlobalSplash가 전역 처리
- **효과:**
  - 중복 코드 제거
  - 일관된 브랜드 경험
  - 유지보수성 향상

---

### 2025-11-24 (이전)

#### ✅ 완료된 개선

##### 1) AuthContext 제거

- **Before:** `useAuth()` 내부에서 `useSession()`을 다시 감싼 구조
- **After:** `useSession()`을 직접 사용
- **효과:**
  - 코드 단순화
  - 불필요한 컨텍스트 제거
  - 타입 안정성 향상

##### 2) 서버 사이드 인증 로직

- **Before:** 페이지 내부에서 Supabase 검증 체크
- **After:** 미들웨어에서 통합 처리
- **효과:**
  - 클라이언트 로직 감소
  - 중복 API 호출 제거
  - 보안 강화

---

## 8. 코드 예시

### 현재 구현 (2025-11-25)

```typescript
"use client";

import React, { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FigmaButton } from "@/components/ui/figma-button";
import { LOGIN_CONFIG } from "@/lib/config/login-constants";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = !!session;

  const handleKakaoLogin = async () => {
    const result = await signIn("kakao", { redirect: false });
    if (result?.ok) {
      // 로그인 성공 → 미들웨어가 자동으로 /map 또는 /verify로 리다이렉트
      router.push(LOGIN_CONFIG.ROUTES.LOGIN);
      router.refresh();
    }
  };

  // 이미 로그인된 상태로 이 페이지에 접근한 경우 (미들웨어 우회된 경우)
  // 미들웨어를 트리거하여 적절한 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(LOGIN_CONFIG.ROUTES.LOGIN);
      router.refresh();
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">{LOGIN_CONFIG.TEXT.LOADING}</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${LOGIN_CONFIG.COLORS.BACKGROUND} flex flex-col`}>
      {/* 로그인 UI */}
    </div>
  );
}
```

---

## 9. 미들웨어와의 상호작용

### 인증 흐름 (src/middleware.ts)

```typescript
// /login 접근 시 미들웨어 로직
if (pathname === "/login") {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token) {
    const extendedToken = token as ExtendedJWT;
    const isVerified = extendedToken.isVerified === true;
    const kakaoId = extendedToken.kakaoId;

    if (isVerified) {
      // 인증 완료 → /map으로
      return NextResponse.redirect(new URL("/map", req.url));
    } else {
      // 미인증 → /verify로
      return NextResponse.redirect(new URL(`/verify?uid=${kakaoId}`, req.url));
    }
  }
  // 로그인 안 됨 → /login 페이지 표시
}
```

### 역할 분담

| 컴포넌트         | 역할                            |
| ---------------- | ------------------------------- |
| **LoginPage**    | UI 렌더링, 카카오 로그인 트리거 |
| **Middleware**   | 인증 상태 체크, 자동 리다이렉트 |
| **GlobalSplash** | 브랜드 스플래시 표시 (전역)     |
| **NextAuth**     | 세션 관리, OAuth 처리           |

---

## 10. 설정 파일 (LOGIN_CONFIG)

### 구조

```typescript
export const LOGIN_CONFIG = {
  LOGO: {
    WIDTH: number,
    HEIGHT: number,
    SRC: string,
    ALT: string,
  },
  SPACING: {
    LOGO_BOTTOM: string,
    BRAND_BOTTOM: string,
    TERMS_TOP: string,
    SAFE_AREA: string,
  },
  COLORS: {
    BACKGROUND: string,
    TEXT_SECONDARY: string,
    TEXT_PRIMARY: string,
  },
  TEXT: {
    TITLE: string,
    LOGIN_BUTTON: string,
    TERMS_KO: string,
    TERMS_EN: string,
    LOADING: string,
  },
  ROUTES: {
    LOGIN: string,
    MAP: string,
    VERIFY: string,
  },
} as const;
```

### 사용 예시

```typescript
// 이미지
<Image
  src={LOGIN_CONFIG.LOGO.SRC}
  width={LOGIN_CONFIG.LOGO.WIDTH}
  height={LOGIN_CONFIG.LOGO.HEIGHT}
/>

// 스타일
<div className={LOGIN_CONFIG.COLORS.BACKGROUND}>

// 텍스트
<h1>{LOGIN_CONFIG.TEXT.TITLE}</h1>

// 라우트
router.push(LOGIN_CONFIG.ROUTES.MAP);
```

---

## 11. 의존성

- **NextAuth.js**: `useSession`, `signIn`
- **Next.js**: `useRouter` (next/navigation)
- **LOGIN_CONFIG**: 설정 파일
- **Next.js Image**: 이미지 최적화
- **FigmaButton**: 커스텀 버튼 컴포넌트

---

## 12. 스타일링

- Tailwind CSS 기반
- LOGIN_CONFIG 기반 색상/레이아웃 설정
- 모바일 중심의 반응형 구성
- 세이프 에어리어 고려 (`h-8` bottom spacing)

---

## 13. 성능 고려사항

### 개선된 부분

1. ✅ **스플래시 최적화**: GlobalSplash로 중복 제거
2. ✅ **라우팅 최적화**: Next.js router 사용으로 클라이언트 라우팅 활용
3. ✅ **불필요한 API 호출 제거**: 미들웨어에서 통합 처리
4. ✅ **이미지 최적화**: `priority` 속성으로 LCP 개선

### 현재 상태

- 메인 로고 이미지 priority 설정 완료
- 세션 상태 변경 시 리렌더 최소화
- 설정 파일 분리로 번들 크기 최적화

---

## 14. 보안

- ✅ 민감 정보 직접 노출 없음
- ✅ Kakao OAuth 프로세스는 NextAuth가 안전하게 처리
- ✅ 쿠키 기반 세션으로 안정적 인증 유지
- ✅ 미들웨어 기반 서버 사이드 인증 체크
- ✅ 클라이언트에서 인증 로직 최소화

---

## 15. 테스트 체크리스트

### 기능 테스트

- [ ] 카카오 로그인 버튼 클릭 시 OAuth 플로우 정상 동작
- [ ] 로그인 성공 후 검증된 사용자는 /map으로 이동
- [ ] 로그인 성공 후 미검증 사용자는 /verify로 이동
- [ ] 이미 로그인된 상태로 /login 접근 시 자동 리다이렉트
- [ ] GlobalSplash가 첫 진입 시 표시됨

### 성능 테스트

- [ ] 로고 이미지 priority 로딩 확인
- [ ] Next.js router 사용으로 부드러운 네비게이션
- [ ] 불필요한 리렌더 없음

### 보안 테스트

- [ ] 미들웨어가 인증되지 않은 접근 차단
- [ ] 세션 쿠키 보안 설정 확인

---

## 16. 관련 문서

- [08-middleware.md](08-middleware.md) - 미들웨어 인증 로직
- [09-global-splash-system.md](09-global-splash-system.md) - 전역 스플래시 시스템
- [00-refactoring-summary.md](00-refactoring-summary.md) - 전체 리팩토링 히스토리

---

## 17. 전체 요약

### 현재 상태 (2025-11-25)

`/login` 페이지는:

- ✅ **설정 파일 분리**: `LOGIN_CONFIG`로 재사용 가능한 구조
- ✅ **Next.js Router 사용**: 표준 네비게이션 패턴
- ✅ **전역 스플래시**: GlobalSplash로 일관된 브랜드 경험
- ✅ **미들웨어 통합**: 서버 사이드 인증 로직
- ✅ **AuthContext 제거**: NextAuth useSession 직접 사용

### 개선 효과

| 항목            | Before          | After            | 개선             |
| --------------- | --------------- | ---------------- | ---------------- |
| **상수 관리**   | 페이지 내부     | 별도 config 파일 | ✅ 재사용성 향상 |
| **네비게이션**  | window.location | useRouter        | ✅ Next.js 표준  |
| **스플래시**    | 페이지별 로직   | 전역 처리        | ✅ 중복 제거     |
| **인증 체크**   | 클라이언트      | 미들웨어         | ✅ 보안 강화     |
| **코드 복잡도** | 높음            | 낮음             | ✅ 유지보수 용이 |

로그인 페이지는 이제 **최소한의 UI 로직만 담당**하고, 나머지는 미들웨어와 전역 컴포넌트가 처리하는 **깔끔한 구조**로 개선되었습니다!
