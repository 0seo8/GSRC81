# GSRC81 RLS (Row Level Security) 가이드

> **작성일**: 2025-12-17
> **기반**: artify-next-app 모범 사례

---

## 📋 목차

- [개요](#개요)
- [아키텍처](#아키텍처)
- [Supabase 클라이언트 사용법](#supabase-클라이언트-사용법)
- [RLS 정책 상태](#rls-정책-상태)
- [보안 모범 사례](#보안-모범-사례)
- [마이그레이션 가이드](#마이그레이션-가이드)

---

## 개요

GSRC81 프로젝트는 **NextAuth + Kakao OAuth**를 사용하여 인증하고, **Supabase**를 데이터베이스로 사용합니다. 이 문서는 artify-next-app의 모범 사례를 기반으로 개선된 RLS 설정을 설명합니다.

### 주요 개선 사항

1. ✅ **모든 테이블에 RLS 활성화** - 이전에는 일부 테이블만 보호됨
2. ✅ **명확한 클라이언트 분리** - 서버/공개/브라우저 클라이언트 구분
3. ✅ **공개 데이터 보호** - is_active, status 등으로 접근 제어
4. ✅ **서버 사이드 검증** - 민감한 작업은 서버에서만 처리

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                         │
│  - createBrowserSupabaseClient() 사용                       │
│  - ANON_KEY 사용, RLS 적용                                   │
│  - 공개 데이터만 조회 가능 (is_active=true 등)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server (Next.js)                         │
│  - Option A: createServerSupabaseClient() (SECRET_KEY)      │
│    → RLS 우회, 관리자 작업용                                 │
│  - Option B: createPublicSupabaseClient() (ANON_KEY)        │
│    → RLS 적용, 공개 데이터용                                 │
│  - NextAuth 세션으로 사용자 검증                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
│  - RLS 정책으로 데이터 접근 제어                             │
│  - 공개 데이터는 누구나 조회 가능                            │
│  - 쓰기/수정/삭제는 서버에서만 가능                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Supabase 클라이언트 사용법

### 1. `createServerSupabaseClient()` - 서버 전용 (RLS 우회)

**용도:**

- 관리자 작업
- 사용자별 데이터 검증 후 처리
- 크로스 유저 쿼리
- 백그라운드 작업

**사용 예시:**

```typescript
import { createServerSupabaseClient } from "@/shared/lib/supabase";

// 서버 컴포넌트 또는 API 라우트
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // RLS를 우회하여 데이터 조회/수정
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("access_links")
    .select("*")
    .eq("kakao_user_id", session.user.id);

  return Response.json(data);
}
```

### 2. `createPublicSupabaseClient()` - 공개 데이터 (RLS 적용)

**용도:**

- 서버 사이드 렌더링 (SSR)
- 공개 데이터 조회
- RLS 정책을 존중해야 하는 작업

**사용 예시:**

```typescript
import { createPublicSupabaseClient } from "@/shared/lib/supabase";

// 서버 컴포넌트
export default async function CoursesPage() {
  const supabase = createPublicSupabaseClient();

  // RLS 정책에 의해 is_active=true인 코스만 조회됨
  const { data: courses } = await supabase
    .from("courses")
    .select("*");

  return <div>{/* 코스 목록 렌더링 */}</div>;
}
```

### 3. `createBrowserSupabaseClient()` - 클라이언트 사이드 (RLS 적용)

**용도:**

- 클라이언트 컴포넌트
- 실시간 구독
- 공개 데이터 조회

**사용 예시:**

```typescript
"use client";

import { createBrowserSupabaseClient } from "@/shared/lib/supabase";
import { useEffect, useState } from "react";

export function CourseList() {
  const [courses, setCourses] = useState([]);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    // RLS 정책에 의해 is_active=true인 코스만 조회됨
    supabase
      .from("courses")
      .select("*")
      .then(({ data }) => setCourses(data || []));
  }, []);

  return <div>{/* 코스 목록 렌더링 */}</div>;
}
```

---

## RLS 정책 상태

### ✅ RLS 활성화된 테이블

모든 테이블에 RLS가 활성화되어 있습니다:

- `courses`
- `course_categories`
- `course_comments`
- `course_photos`
- `course_comment_photos`
- `course_location_notes`
- `app_settings`
- `access_links`
- `access_codes`
- `admin`
- `admin_action_logs`

### 📖 공개 데이터 정책 (누구나 조회 가능)

| 테이블                  | 조건                                                               | 설명                      |
| ----------------------- | ------------------------------------------------------------------ | ------------------------- |
| `course_categories`     | `is_active = true`                                                 | 활성화된 카테고리만       |
| `courses`               | `is_active = true`                                                 | 활성화된 코스만           |
| `course_comments`       | `is_deleted = false AND hidden_by_admin = false`                   | 삭제/숨김 처리 안된 댓글  |
| `course_photos`         | `true`                                                             | 모든 사진                 |
| `course_comment_photos` | `true`                                                             | 모든 댓글 사진            |
| `course_location_notes` | `is_active = true`                                                 | 활성화된 위치 노트        |
| `app_settings`          | `setting_key IN ('app_notice', 'maintenance_mode', 'app_version')` | 공개 설정만               |
| `access_codes`          | `is_active = true AND expires_at > now()`                          | 활성화되고 만료 안된 코드 |

### ✍️ 사용자 쓰기 정책

사용자별 쓰기 작업은 **서버 사이드에서 NextAuth 세션 확인 후** 처리합니다:

| 작업           | 처리 방법                                                |
| -------------- | -------------------------------------------------------- |
| 댓글 작성      | 서버에서 세션 확인 → `createServerSupabaseClient()` 사용 |
| 사진 업로드    | 서버에서 세션 확인 → `createServerSupabaseClient()` 사용 |
| 댓글/사진 삭제 | 서버에서 세션 확인 + kakao_user_id 일치 확인 → 삭제      |

**예시 코드:**

```typescript
// app/api/comments/route.ts
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { course_id, message } = await req.json();

  // 서버 클라이언트로 RLS 우회
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("course_comments")
    .insert({
      course_id,
      message,
      author_user_key: session.user.id, // 카카오 사용자 ID
      author_nickname: session.user.name,
      avatar_url: session.user.image,
    })
    .select()
    .single();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data);
}
```

### 🔒 관리자 전용 (서버 사이드만)

다음 작업은 **서버에서만** `createServerSupabaseClient()`를 사용하여 처리:

- 코스 생성/수정/삭제
- 카테고리 관리
- 위치 노트 관리
- 사용자 관리 (`access_links`)
- 앱 설정 관리
- 관리자 계정 관리 (`admin`)

---

## 보안 모범 사례

### ✅ 해야 할 것

1. **서버에서 세션 검증**

   ```typescript
   const session = await getServerSession(authOptions);
   if (!session) {
     return new Response("Unauthorized", { status: 401 });
   }
   ```

2. **관리자 권한 확인**

   ```typescript
   if (!session.user.isAdmin) {
     return new Response("Forbidden", { status: 403 });
   }
   ```

3. **사용자 소유권 확인**

   ```typescript
   // 댓글 삭제시 작성자 확인
   const { data: comment } = await supabase
     .from("course_comments")
     .select("author_user_key")
     .eq("id", commentId)
     .single();

   if (comment.author_user_key !== session.user.id) {
     return new Response("Forbidden", { status: 403 });
   }
   ```

4. **민감한 작업은 서버에서만**
   - 사용자 정보 조회
   - 관리자 작업
   - 데이터 수정/삭제

### ❌ 하지 말아야 할 것

1. **클라이언트에서 SECRET_KEY 사용**

   ```typescript
   // ❌ 절대 안됨!
   const supabase = createClient(url, SECRET_KEY);
   ```

2. **클라이언트에서 직접 데이터 수정**

   ```typescript
   // ❌ RLS 정책에 의해 차단됨
   await supabase.from("courses").insert({ ... });
   ```

3. **세션 검증 없이 서버 클라이언트 사용**
   ```typescript
   // ❌ 인증 확인 필수
   export async function POST(req: Request) {
     const supabase = createServerSupabaseClient();
     // 세션 확인 없이 데이터 조작 - 보안 위험!
   }
   ```

---

## 마이그레이션 가이드

### 기존 코드 업데이트

#### Before (기존)

```typescript
import { supabase, supabaseAdmin } from "@/shared/lib/supabase";

// 클라이언트에서 직접 사용
const { data } = await supabase.from("courses").select("*");

// 서버에서 관리자 클라이언트 사용
const { data } = await supabaseAdmin.from("courses").select("*");
```

#### After (개선)

```typescript
import {
  createBrowserSupabaseClient,
  createPublicSupabaseClient,
  createServerSupabaseClient,
} from "@/shared/lib/supabase";

// 클라이언트: 공개 데이터 조회
const supabase = createBrowserSupabaseClient();
const { data } = await supabase.from("courses").select("*");
// → RLS에 의해 is_active=true인 코스만 조회됨

// 서버: 공개 데이터 조회 (SSR)
const supabase = createPublicSupabaseClient();
const { data } = await supabase.from("courses").select("*");

// 서버: 관리자 작업 (RLS 우회)
const session = await getServerSession(authOptions);
if (session?.user?.isAdmin) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("courses").select("*");
}
```

### 환경 변수 추가

`.env.local`에 다음 변수 확인:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... # 선택사항
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # 서버 전용 (필수)
```

> **참고**:
>
> - `PUBLISHABLE_KEY`가 없으면 자동으로 `ANON_KEY`를 사용합니다.
> - `SERVICE_ROLE_KEY`는 Supabase의 표준 환경 변수 이름입니다.

---

## 문제 해결

### Q: 클라이언트에서 데이터를 조회할 수 없어요

A: RLS 정책을 확인하세요. 예를 들어, `is_active=false`인 코스는 공개 정책에서 제외됩니다.

### Q: 서버에서 데이터를 수정할 수 없어요

A: `createServerSupabaseClient()`를 사용하고 있는지 확인하세요. `createPublicSupabaseClient()`는 RLS가 적용됩니다.

### Q: NextAuth 세션이 없을 때는?

A: 공개 API는 세션 없이도 작동하지만, 사용자별 작업(댓글, 사진 등)은 세션이 필수입니다.

---

## 참고 자료

- [Supabase RLS 공식 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [NextAuth 공식 문서](https://next-auth.js.org/)
- artify-next-app 프로젝트의 `supabase-rls-clerk-guidelines.md`

---

**마지막 업데이트**: 2025-12-17
**마이그레이션 파일**: `supabase/migrations/20251217_improve_rls_policies.sql`
