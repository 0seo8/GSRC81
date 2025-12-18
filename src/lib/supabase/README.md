# Supabase 데이터 접근 레이어

Next.js 15 + Supabase를 위한 타입 안전한 데이터 접근 아키텍처입니다.

## 📁 구조

```
src/lib/supabase/
├── server.ts              # Server Components용 클라이언트
├── client.ts              # Client Components용 클라이언트
├── repositories/          # Repository 패턴 (데이터 접근 로직)
│   ├── courseRepository.ts
│   ├── commentRepository.ts
│   ├── categoryRepository.ts
│   └── index.ts
└── README.md

src/shared/types/
└── database.types.ts      # Supabase 자동 생성 타입

src/app/actions/           # Server Actions (mutations)
└── comments.ts
```

---

## 🎯 언제 무엇을 사용하나?

| 컴포넌트 타입        | 클라이언트                   | Repository | React Query | Server Actions |
| -------------------- | ---------------------------- | ---------- | ----------- | -------------- |
| **Server Component** | `createClient()` (server.ts) | ✅         | ❌          | ❌ (직접 호출) |
| **Client Component** | `createClient()` (client.ts) | ✅         | ✅ (선택적) | ✅             |
| **Server Action**    | `createClient()` (server.ts) | ✅         | ❌          | N/A            |
| **Route Handler**    | `createClient()` (server.ts) | ✅         | ❌          | ❌             |

---

## 📖 사용 예시

### 1. Server Component (정적 데이터)

```typescript
// app/courses/page.tsx
import { createClient } from '@/lib/supabase/server';
import { courseRepository } from '@/lib/supabase/repositories';

export default async function CoursesPage() {
  const supabase = await createClient();
  const repo = courseRepository(supabase);

  // ✅ 서버에서 직접 데이터 페칭
  const courses = await repo.getActiveCourses();

  return (
    <div>
      <h1>코스 목록</h1>
      <CourseList courses={courses} />
    </div>
  );
}
```

**장점**:

- SEO 최적화 (HTML에 데이터 포함)
- 초기 로딩 속도 빠름
- Next.js 자동 캐싱
- React Query 불필요

---

### 2. Client Component (인터랙티브 데이터)

```typescript
// components/InteractiveMap.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { courseRepository, type CourseWithCategory } from '@/lib/supabase/repositories';

export function InteractiveMap() {
  const [courses, setCourses] = useState<CourseWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const supabase = createClient();
      const repo = courseRepository(supabase);

      try {
        const data = await repo.getCoursesForMap();
        setCourses(data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) return <div>Loading...</div>;

  return <MapRenderer courses={courses} />;
}
```

---

### 3. Server + Client 조합 (최적 패턴)

```typescript
// app/courses/[id]/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server';
import { courseRepository } from '@/lib/supabase/repositories';
import { CourseDetailClient } from './CourseDetailClient';

export default async function CoursePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const repo = courseRepository(supabase);

  // ✅ 초기 데이터는 서버에서
  const course = await repo.getCourseById(params.id);

  // 클라이언트 컴포넌트에 props로 전달
  return <CourseDetailClient initialCourse={course} />;
}
```

```typescript
// app/courses/[id]/CourseDetailClient.tsx (Client Component)
'use client';

import { useState } from 'react';
import type { CourseWithDetails } from '@/lib/supabase/repositories';
import { createCommentAction } from '@/app/actions/comments';

export function CourseDetailClient({ initialCourse }: { initialCourse: CourseWithDetails }) {
  const [course] = useState(initialCourse);

  const handleCommentSubmit = async (formData: FormData) => {
    // ✅ Server Action 직접 호출
    const result = await createCommentAction(formData);

    if (result.error) {
      alert(result.error);
    } else {
      alert('댓글이 작성되었습니다!');
      // Next.js가 자동으로 페이지 리프레시 (revalidatePath 덕분)
    }
  };

  return (
    <div>
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      <form action={handleCommentSubmit}>
        <input type="hidden" name="courseId" value={course.id} />
        <textarea name="message" required />
        <button type="submit">댓글 작성</button>
      </form>

      <CommentList comments={course.course_comments} />
    </div>
  );
}
```

---

### 4. Server Actions (데이터 변경)

```typescript
// Client Component에서 사용
'use client';

import { createCommentAction, likeCommentAction } from '@/app/actions/comments';

export function CommentForm({ courseId }: { courseId: string }) {
  const handleSubmit = async (formData: FormData) => {
    const result = await createCommentAction(formData);

    if (result.error) {
      console.error(result.error);
    }
  };

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="courseId" value={courseId} />
      <input name="authorNickname" required />
      <textarea name="message" required />
      <button type="submit">작성</button>
    </form>
  );
}

export function LikeButton({ commentId, courseId }: { commentId: string; courseId: string }) {
  const handleLike = async () => {
    await likeCommentAction(commentId, courseId);
  };

  return <button onClick={handleLike}>👍 좋아요</button>;
}
```

---

### 5. Realtime 구독 (Client Component)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Comment } from '@/lib/supabase/repositories';

export function RealtimeComments({ courseId }: { courseId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const supabase = createClient();

    // ✅ Realtime 구독
    const channel = supabase
      .channel(`course-${courseId}-comments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_comments',
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          console.log('Comment changed:', payload);
          // 댓글 목록 업데이트 로직
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [courseId]);

  return <CommentList comments={comments} />;
}
```

---

## 🔧 타입 자동 생성

Supabase 스키마가 변경되면 타입을 재생성하세요:

```bash
# MCP Supabase를 통해 자동 생성
npx supabase gen types typescript --project-id <프로젝트ID> > src/shared/types/database.types.ts
```

---

## 🚀 마이그레이션 가이드

### 기존 코드에서 새 패턴으로 전환

#### Before (기존 courses-data.ts)

```typescript
// ❌ 중복된 데이터 레이어
import { supabase } from "@/shared/lib/supabase";

export async function fetchCourses() {
  const { data } = await supabase.from("courses").select("*");
  return data;
}
```

#### After (새 Repository 패턴)

```typescript
// ✅ 타입 안전한 Repository
import { createClient } from "@/lib/supabase/server";
import { courseRepository } from "@/lib/supabase/repositories";

const supabase = await createClient();
const courses = await courseRepository(supabase).getActiveCourses();
```

---

## 📊 성능 최적화

### 1. Server Components 우선 사용

- 초기 로딩 속도 향상
- SEO 최적화
- 서버 캐싱 활용

### 2. Client Components는 필요시에만

- 인터랙티브 UI
- 실시간 업데이트
- 클라이언트 상태 관리

### 3. Server Actions로 Mutations 처리

- 자동 캐시 무효화 (`revalidatePath`)
- 타입 안전성
- 보안 향상 (서버 사이드 실행)

---

## 🔒 보안 고려사항

### Server Components

- ✅ RLS 정책 자동 적용
- ✅ 세션 쿠키 자동 관리
- ✅ 서버 사이드 실행 보장

### Client Components

- ⚠️ 클라이언트에 노출됨
- ⚠️ RLS 정책 필수
- ⚠️ 민감한 데이터 제외

### Service Role Key

- ❌ 절대 클라이언트에 노출 금지
- ✅ Server Actions에서만 사용
- ✅ `createAdminClient()` 사용

---

## 📝 추가 리소스

- [Next.js 15 문서](https://nextjs.org/docs)
- [Supabase SSR 가이드](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Server Actions 문서](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
