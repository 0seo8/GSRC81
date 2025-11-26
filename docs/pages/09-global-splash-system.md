# 전역 스플래시 시스템 (Global Splash System)

## 1. 개요

모든 앱 진입점에서 일관된 브랜드 인트로 애니메이션을 제공하는 전역 스플래시 시스템.
디즈니+ 스타일의 "앱 실행 시 브랜드 로고" 경험을 구현.

---

## 2. 기획 의도

### 요구사항

- 링크 공유를 통한 진입이 많은 앱 특성 고려
- 어떤 경로로 진입하든 일관된 브랜드 경험 제공
- 로그인 여부와 무관하게 스플래시 표시
- 디즈니+ 앱처럼 "앱을 켤 때마다" 브랜드 인트로

### 기존 문제점

- 스플래시가 `/login` 페이지에만 존재
- 이미 로그인된 사용자는 바로 `/map`으로 이동 (스플래시 건너뜀)
- 링크로 `/map` 직접 접근 시 애니메이션 없음
- 일관성 없는 사용자 경험

---

## 3. 구현 위치

### 파일 구조

```
src/
├── components/
│   ├── global-splash.tsx          ← ✅ 전역 스플래시 컴포넌트 (새로 생성)
│   ├── splash-screen.tsx          ← 기존 애니메이션 컴포넌트 (재사용)
│   └── providers.tsx              ← GlobalSplash 추가
└── app/
    ├── layout.tsx                 ← Providers 포함 (변경 없음)
    └── login/page.tsx             ← 중복 스플래시 제거
```

---

## 4. 핵심 컴포넌트: `GlobalSplash`

### 코드 구조

```typescript
// src/components/global-splash.tsx
"use client";

import { useEffect, useState } from "react";
import { SplashScreen } from "@/components/splash-screen";

const SPLASH_KEY = "gsrc81_splash_shown";

export function GlobalSplash({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // sessionStorage: 브라우저 탭이 열려있는 동안만 유효
    const hasSeenSplash = sessionStorage.getItem(SPLASH_KEY);

    if (hasSeenSplash === "true") {
      setShowSplash(false);
    }

    setIsChecking(false);
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_KEY, "true");
    setShowSplash(false);
  };

  // 체크 중: 로딩 표시
  if (isChecking) {
    return <LoadingSpinner />;
  }

  // 스플래시 표시
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // 앱 콘텐츠
  return <>{children}</>;
}
```

### 동작 원리

1. **초기화 단계**
   - `isChecking = true`: sessionStorage 확인 중
   - 로딩 스피너 표시 (깜빡임 방지)

2. **스플래시 여부 결정**
   - sessionStorage에 `gsrc81_splash_shown` 확인
   - 없으면 → `showSplash = true`
   - 있으면 → `showSplash = false`

3. **스플래시 완료 후**
   - sessionStorage에 표시 기록
   - `showSplash = false`
   - 앱 콘텐츠 렌더링

---

## 5. Provider 통합

### Providers 구조

```typescript
// src/components/providers.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <GlobalSplash>          {/* ← ✅ 전역 스플래시 추가 */}
          <AdminProvider>
            {children}
          </AdminProvider>
        </GlobalSplash>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
```

### 레이어 순서 중요

```
RootLayout
  └─ Providers
      ├─ SafeAreaProvider
      ├─ SessionProvider
      ├─ GlobalSplash          ← 여기서 스플래시 처리
      │   └─ AdminProvider
      │       └─ children      ← 모든 페이지
```

**왜 이 위치?**

- SessionProvider 내부: `useSession` 사용 가능
- children 외부: 모든 페이지에 영향
- 최상위 레벨: 모든 진입점 커버

---

## 6. 시나리오별 동작

### 📱 사용자 진입 시나리오

| 시나리오               | 스플래시  | sessionStorage | 설명                  |
| ---------------------- | --------- | -------------- | --------------------- |
| **1️⃣ 앱 최초 실행**    | ✅ 표시   | 비어있음       | 브랜드 인트로 표시    |
| **2️⃣ 페이지 이동**     | ❌ 건너뜀 | "true" 존재    | 이미 이 세션에서 봤음 |
| **3️⃣ 뒤로가기**        | ❌ 건너뜀 | "true" 유지    | 세션 유지됨           |
| **4️⃣ 새로고침 (F5)**   | ❌ 건너뜀 | "true" 유지    | sessionStorage 유지   |
| **5️⃣ 링크 공유 접근**  | ✅ 표시   | 새 세션        | 처음 진입하는 사용자  |
| **6️⃣ 탭 닫고 재진입**  | ✅ 표시   | 초기화됨       | sessionStorage 사라짐 |
| **7️⃣ 브라우저 재시작** | ✅ 표시   | 초기화됨       | 새 세션 시작          |

---

## 7. 플로우 차트

### 전체 진입 플로우

```
User → 앱 진입 (어떤 URL이든)
  ↓
RootLayout 렌더링
  ↓
Providers 실행
  ↓
GlobalSplash 체크
  ├─ sessionStorage 확인
  │   ├─ "gsrc81_splash_shown" 없음 → 스플래시 표시
  │   └─ "gsrc81_splash_shown" = "true" → 스플래시 건너뛰기
  ↓
[스플래시 표시된 경우]
  ├─ SplashScreen 애니메이션 (약 2-3초)
  ├─ 애니메이션 완료 콜백
  ├─ sessionStorage.setItem("gsrc81_splash_shown", "true")
  └─ 앱 콘텐츠로 전환
  ↓
앱 콘텐츠 렌더링
  ├─ 미들웨어 체크 (인증, 리다이렉트)
  └─ 최종 페이지 표시
```

---

## 8. sessionStorage vs localStorage

### sessionStorage 선택 이유

| 특성          | sessionStorage     | localStorage         |
| ------------- | ------------------ | -------------------- |
| **지속성**    | 탭이 열려있는 동안 | 브라우저 닫아도 유지 |
| **용도**      | 세션 단위 데이터   | 영구 저장            |
| **탭 독립성** | 탭마다 별도        | 모든 탭 공유         |
| **삭제 시점** | 탭 닫을 때         | 명시적 삭제 시       |

### 디즈니+ 경험을 위한 선택

```typescript
// ✅ sessionStorage 사용 (현재)
// - 탭 닫고 다시 열면 스플래시 표시
// - "앱 실행" 느낌 제공
sessionStorage.setItem(SPLASH_KEY, "true");

// ❌ localStorage 사용 (대안)
// - 한 번 보면 계속 안 뜸
// - 브랜드 경험 약화
localStorage.setItem(SPLASH_KEY, "true");
```

---

## 9. 로그인 페이지 변경사항

### Before: 로컬 스플래시

```typescript
// ❌ 기존: /login 페이지에만 스플래시
export default function LoginPage() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return <LoginForm />;
}
```

**문제:**

- `/login`에만 스플래시
- 다른 페이지 진입 시 없음
- 이미 로그인된 사용자는 못 봄

### After: 전역 스플래시

```typescript
// ✅ 변경: 스플래시 로직 제거
export default function LoginPage() {
  // 스플래시는 GlobalSplash가 처리
  return <LoginForm />;
}
```

**개선:**

- 모든 페이지에서 스플래시
- 중복 코드 제거
- 일관된 경험

---

## 10. 커스터마이징 옵션

### 옵션 1: 하루에 한 번만 표시

```typescript
const ONE_DAY = 24 * 60 * 60 * 1000;

useEffect(() => {
  const lastShown = localStorage.getItem(SPLASH_KEY);
  const now = Date.now();

  if (lastShown && now - parseInt(lastShown, 10) < ONE_DAY) {
    setShowSplash(false);
  }
}, []);

const handleSplashComplete = () => {
  localStorage.setItem(SPLASH_KEY, Date.now().toString());
  setShowSplash(false);
};
```

### 옵션 2: PWA 설치 여부에 따라

```typescript
useEffect(() => {
  const isPWA = window.matchMedia("(display-mode: standalone)").matches;

  if (isPWA) {
    // PWA: 앱 실행할 때마다
    setShowSplash(true);
  } else {
    // 웹: 세션당 한 번
    const hasSeenSplash = sessionStorage.getItem(SPLASH_KEY);
    setShowSplash(!hasSeenSplash);
  }
}, []);
```

### 옵션 3: 첫 방문에만 (영구)

```typescript
useEffect(() => {
  const hasEverSeen = localStorage.getItem("splash_first_time");

  if (hasEverSeen) {
    setShowSplash(false);
  }
}, []);

const handleSplashComplete = () => {
  localStorage.setItem("splash_first_time", "true");
  setShowSplash(false);
};
```

---

## 11. 성능 최적화

### 깜빡임 방지

```typescript
const [isChecking, setIsChecking] = useState(true);

// 체크 중에는 로딩 표시
if (isChecking) {
  return <LoadingSpinner />;
}
```

**이유:**

- sessionStorage 체크하는 동안 빈 화면 방지
- 부드러운 전환 제공
- 사용자 경험 개선

### 애니메이션 최적화

```typescript
// SplashScreen 컴포넌트에서
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* 스플래시 콘텐츠 */}
</motion.div>
```

---

## 12. 미들웨어와의 상호작용

### 진입 순서

```
1. Request → Middleware
   ├─ 인증 체크
   ├─ 리다이렉트 처리
   └─ 페이지 렌더링 허용

2. Page Render → GlobalSplash
   ├─ sessionStorage 체크
   ├─ 스플래시 표시 여부 결정
   └─ 콘텐츠 렌더링

3. 최종 페이지 표시
```

### 예시: 링크 공유로 `/map` 접근

```
User → https://app.com/map?course=123
  ↓
Middleware 체크
  ├─ 인증 토큰 없음
  └─ Redirect to /login?callbackUrl=/map?course=123
  ↓
/login 페이지 렌더링
  ↓
GlobalSplash 체크
  ├─ 새 세션 (sessionStorage 비어있음)
  └─ ✅ 스플래시 표시
  ↓
스플래시 애니메이션 완료
  ↓
로그인 폼 표시
  ↓
사용자 로그인 후
  ↓
callbackUrl로 리다이렉트 (/map?course=123)
```

---

## 13. 테스트 시나리오

### 테스트 체크리스트

- [ ] **최초 진입**: 스플래시 표시됨
- [ ] **페이지 이동**: 스플래시 건너뛰기
- [ ] **뒤로가기**: 스플래시 건너뛰기
- [ ] **새로고침**: 스플래시 건너뛰기
- [ ] **링크 공유 접근**: 스플래시 표시됨
- [ ] **탭 닫고 재진입**: 스플래시 표시됨
- [ ] **브라우저 재시작**: 스플래시 표시됨
- [ ] **시크릿 모드**: 매번 스플래시 표시
- [ ] **여러 탭 동시 오픈**: 각 탭 독립적으로 스플래시

### 디버깅

```typescript
// 강제로 스플래시 초기화 (개발용)
sessionStorage.removeItem("gsrc81_splash_shown");
location.reload();

// 스플래시 건너뛰기 (테스트용)
sessionStorage.setItem("gsrc81_splash_shown", "true");
location.reload();
```

---

## 14. 변경 이력

### 2025-11-24 (최신)

#### ✅ 구현 완료

1. **GlobalSplash 컴포넌트 생성**
   - sessionStorage 기반 세션 관리
   - 깜빡임 방지 로딩 상태
   - 전역 Provider 통합

2. **로그인 페이지 리팩토링**
   - 중복 스플래시 로직 제거
   - GlobalSplash에 위임
   - 코드 단순화

3. **Providers 구조 변경**
   - GlobalSplash 레이어 추가
   - 올바른 Provider 순서 확보

#### 📊 개선 효과

- ✅ 모든 진입점에서 일관된 브랜드 경험
- ✅ 디즈니+ 스타일 구현
- ✅ 중복 코드 제거
- ✅ 유지보수성 향상

---

## 15. 관련 문서

- [02-login-page.md](./02-login-page.md) - 로그인 페이지 (스플래시 제거됨)
- [08-middleware.md](./08-middleware.md) - 미들웨어와 상호작용
- [00-refactoring-summary.md](./00-refactoring-summary.md) - 전체 리팩토링 히스토리

---

## 16. 결론

### 달성한 목표

✅ **기획 의도 구현**

- 링크 공유로 진입해도 브랜드 인트로
- 로그인 여부 무관하게 일관된 경험
- 디즈니+ 스타일 "앱 실행" 느낌

✅ **기술적 개선**

- 전역 시스템으로 중복 제거
- sessionStorage로 세션 관리
- Provider 레이어로 깔끔한 구조

✅ **사용자 경험**

- 첫 진입: 브랜드 애니메이션
- 앱 내 이동: 방해 없이 부드러움
- 탭 재진입: 다시 브랜드 경험

이제 어떤 경로로 진입하든 **일관된 GSRC81 브랜드 경험**을 제공합니다!
