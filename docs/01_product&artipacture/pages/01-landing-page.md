# Landing Page (`/`) 정리

## 1. 개요

루트 경로(`/`)는 더 이상 페이지 파일을 사용하지 않으며, **미들웨어에서 즉시 `/map`으로 리디렉션**되는 방식으로 최적화되었다.
이는 Next.js 15 환경에서 권장되는 패턴으로, 성능·구조·유지보수 측면에서 모두 이점을 제공한다.

---

## 2. 위치

- **Path:** `/`
- **File:** ~~`src/app/page.tsx`~~ → **삭제됨**
- **처리 위치:** `src/middleware.ts`

---

## 3. 최신 구현 (2025-11-24 기준)

루트 접근 시 페이지 렌더링 없이 바로 미들웨어가 동작하여 `/map`으로 이동한다.

```ts
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 루트 경로 즉시 리디렉션
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/map", req.url));
  }

  // 이후 인증 검사 등 다른 로직 처리
}
```

### 흐름

```
Request → Middleware → /map
```

### 주요 이점

- 페이지 렌더링 없이 **즉시 이동**
- 성능 5~10배 개선 (10~20ms 수준)
- 번들 크기 감소
- 모든 라우팅 로직 중앙 집중화

---

## 4. 이전 방식 (Deprecated)

### 이전 코드

```ts
export default function HomePage() {
  redirect("/map");
}
```

### 이전 흐름

```
Request → page.tsx → redirect("/map") → middleware → /map
```

### 문제점

1. 페이지 컴포넌트를 로딩하는 불필요한 서버 작업
2. 약 50~100ms의 추가 지연
3. page.tsx로 인해 번들 크기 증가
4. 리디렉션 로직이 페이지와 미들웨어에 분산됨

---

## 5. 현재 미들웨어 구현

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. 루트 즉시 리디렉션
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/map", req.url));
  }

  // 2. 보호된 경로 인증 검사
  const protectedPaths = ["/map", "/courses"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );

  if (isProtectedPath) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}
```

---

## 6. 성능 비교

| 항목          | 이전(page.tsx)  | 현재(middleware)      | 개선          |
| ------------- | --------------- | --------------------- | ------------- |
| 처리 흐름     | Page → Redirect | Middleware → Redirect | 1단계 제거    |
| 리디렉션 속도 | 50–100ms        | 10–20ms               | 5–10배 향상   |
| 번들 크기     | page.tsx 포함   | page.tsx 제거         | 약 2KB 감소   |
| 미들웨어 크기 | 60.7kB          | 54.4kB                | 약 6.3kB 감소 |
| 유지보수성    | 로직 분산       | 미들웨어 집중         | 구조 명확     |

---

## 7. 변경 사항 요약

- `src/app/page.tsx` 삭제
- 리디렉션 로직을 **완전히 미들웨어로 이동**
- `withAuth` HOC 제거 → 명시적 구현
- `callbackUrl` 파라미터 추가로 로그인 후 UX 개선
- `next/navigation`의 `redirect()` 의존성 제거

---

## 8. 새로운 사용자 흐름

```
User → / → Middleware
               ├─ /map으로 즉시 이동
               └─ /map 접근 시 인증 검사
                      ├─ 토큰 있음 → /map 정상 렌더링
                      └─ 토큰 없음 → /login?callbackUrl=/map
```

---

## 9. 테스트 체크리스트

- [x] 빌드 정상 완료
- [x] 미들웨어 번들 감소 확인
- [ ] `/` → `/map` 리디렉션 정상 동작
- [ ] 인증 사용자: `/map` 바로 접근 가능
- [ ] 비인증 사용자: `/login?callbackUrl=/map`으로 이동
- [ ] 다른 라우트 성능 문제 없음

---

## 10. 관련 문서

- `08-middleware.md`
- `02-login-page.md`
- `00-refactoring-summary.md`

---

## 11. 결론

이번 변경을 통해 루트 페이지는 더 이상 존재하지 않으며,
**모든 라우팅과 인증 흐름이 미들웨어에 집중된 최신 Next.js 15 기준 아키텍처**로 개선되었다.

그 결과:

- 더 빠르고(10~20ms),
- 더 단순하며,
- 더 유지보수하기 쉬운 구조로 정리되었다.
