# GSRC81 Frontend Design Patterns
> Next.js 15 + React 19 + Supabase 프론트엔드 디자인 패턴 가이드

**Version**: 1.0.0
**Last Updated**: 2026-01-11

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [컴포넌트 패턴](#2-컴포넌트-패턴)
3. [상태 관리 패턴](#3-상태-관리-패턴)
4. [데이터 페칭 패턴](#4-데이터-페칭-패턴)
5. [스타일링 패턴](#5-스타일링-패턴)
6. [코드 구조화 패턴](#6-코드-구조화-패턴)
7. [성능 최적화 패턴](#7-성능-최적화-패턴)
8. [모바일 지원 패턴](#8-모바일-지원-패턴)

---

## 1. 아키텍처 개요

### 1.1 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 15.x |
| UI Library | React | 19.x |
| Backend | Supabase | - |
| Styling | Tailwind CSS | 4.x |
| Animation | Framer Motion | - |
| Map | Mapbox GL JS | 3.14 |
| Auth | NextAuth.js | 5.x |

### 1.2 폴더 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # 메인 라우트 그룹
│   ├── admin/             # 관리자 라우트
│   ├── api/               # API 라우트
│   └── actions/           # Server Actions
│
├── features/              # 기능별 모듈 (Feature-Based)
│   ├── map/              # 지도 기능
│   ├── courses/          # 코스 기능
│   ├── comments/         # 댓글 기능
│   ├── admin/            # 관리자 기능
│   └── auth/             # 인증 기능
│
├── shared/               # 공유 리소스
│   ├── components/       # 공통 컴포넌트
│   │   ├── ui/          # 기본 UI 컴포넌트 (Atomic)
│   │   ├── common/      # 공통 패턴 컴포넌트
│   │   └── layout/      # 레이아웃 컴포넌트
│   ├── hooks/           # 공통 훅
│   ├── lib/             # 유틸리티
│   └── types/           # 공통 타입
│
├── lib/                  # 데이터 레이어
│   └── supabase/
│       ├── repositories/ # Repository 패턴
│       ├── client.ts
│       └── server.ts
│
├── core/                 # 핵심 설정
│   ├── config/          # 상수 및 설정
│   └── validation/      # 유효성 검사
│
└── providers/           # Context Providers
```

### 1.3 레이어드 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ App Router  │  │  Features   │  │ Shared Components│ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                    Business Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Hooks     │  │   Context   │  │ Server Actions  │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                      Data Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Repositories│  │  Supabase   │  │   API Routes    │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 컴포넌트 패턴

### 2.1 Feature-Based 구조

각 기능은 독립적인 모듈로 구성됩니다.

```
src/features/map/
├── components/           # 기능 전용 컴포넌트
│   ├── mapbox-map.tsx
│   ├── course-marker.tsx
│   └── trail-map/       # 복잡한 컴포넌트는 하위 폴더
│       ├── components/
│       ├── hooks/
│       └── constants.ts
├── hooks/               # 기능 전용 훅
│   ├── use-map-state.ts
│   └── use-map-bounds.ts
└── index.ts             # Barrel export
```

**사용 예시**:
```typescript
// 단일 import로 기능 모듈 사용
import { MapboxMap, CourseMarker, useMapState } from "@/features/map";
```

### 2.2 Compound Components 패턴

관련 컴포넌트를 논리적으로 그룹화합니다.

```typescript
// src/shared/components/ui/card.tsx

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("bg-card text-card-foreground...", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("...", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("...", className)}
      {...props}
    />
  );
}

// Named exports로 compound component 제공
export { Card, CardHeader, CardContent, CardFooter, CardTitle };
```

**사용 예시**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
  </CardHeader>
  <CardContent>
    내용
  </CardContent>
</Card>
```

### 2.3 data-slot 속성 패턴

CSS 선택자와 컴포넌트 구조를 분리합니다.

```typescript
// 컴포넌트에 data-slot 속성 추가
<div data-slot="card-header" className="...">

// CSS에서 data-slot으로 선택
[data-slot="card-header"] {
  /* 스타일 */
}

// 부모에서 자식 스타일링
.card:has([data-slot="card-action"]) [data-slot="card-header"] {
  grid-template-columns: 1fr auto;
}
```

**장점**:
- 리팩토링 시 스타일 영향 최소화
- 시맨틱한 컴포넌트 구조
- 테스트 셀렉터로 활용 가능

### 2.4 Server Component vs Client Component

```typescript
// Server Component (기본값)
// src/app/(main)/courses/[id]/page.tsx
export default async function CourseDetailPage({ params }) {
  const course = await courseRepository.getCourseById(params.id);

  return (
    <div>
      <h1>{course.title}</h1>
      {/* Client Component는 필요한 곳에만 */}
      <InteractiveMap course={course} />
    </div>
  );
}

// Client Component
// src/features/map/components/interactive-map.tsx
"use client";

import { useState } from "react";

export function InteractiveMap({ course }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  // 인터랙션 로직...
}
```

**가이드라인**:
| Server Component | Client Component |
|-----------------|------------------|
| 데이터 페칭 | 이벤트 핸들러 |
| 정적 콘텐츠 | useState, useEffect |
| SEO 중요 콘텐츠 | 브라우저 API 사용 |
| 민감한 로직 | 실시간 상호작용 |

---

## 3. 상태 관리 패턴

### 3.1 Context API + Custom Hooks

```typescript
// src/features/admin/context/AdminContext.tsx
"use client";

interface AdminContextType {
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  error: string | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adminLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await loginAdmin(username, password);
      if (result.success) {
        setIsAdminAuthenticated(true);
        return true;
      }
      setError(result.error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminContext.Provider value={{ isAdminAuthenticated, isLoading, adminLogin, adminLogout, error }}>
      {children}
    </AdminContext.Provider>
  );
}

// Custom hook으로 Context 소비
export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
```

### 3.2 Provider 구성

```typescript
// src/shared/components/common/providers.tsx
"use client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>           {/* 디바이스 Safe Area */}
      <SessionProvider>           {/* NextAuth 세션 */}
        <SessionRefresher />      {/* 세션 자동 갱신 */}
        <GlobalSplash>            {/* 스플래시 화면 */}
          <AdminProvider>         {/* 관리자 인증 */}
            {children}
            <Toaster />           {/* 토스트 알림 */}
          </AdminProvider>
        </GlobalSplash>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
```

### 3.3 Custom Hooks 패턴

```typescript
// src/features/map/hooks/use-map-state.ts
"use client";

import { useState, useCallback, useOptimistic } from "react";

export function useMapState(courses: CourseWithCategory[]) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithCategory | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<CourseWithCategory[]>([]);

  // React 19 useOptimistic
  const [optimisticCourses, addOptimisticCourse] = useOptimistic(
    courses,
    (state, newCourse: CourseWithCategory) => [...state, newCourse],
  );

  // useCallback으로 메모이제이션
  const handleMapLoad = useCallback((mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);
  }, []);

  const handleCourseClick = useCallback((course: CourseWithCategory) => {
    setSelectedCourse(course);
    setSelectedCourses([]);
  }, []);

  const handleClusterClick = useCallback((courses: CourseWithCategory[]) => {
    setSelectedCourses(courses);
    setSelectedCourse(null);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedCourse(null);
    setSelectedCourses([]);
  }, []);

  return {
    map,
    optimisticCourses,
    selectedCourse,
    selectedCourses,
    handleMapLoad,
    handleCourseClick,
    handleClusterClick,
    handleCloseDrawer,
  };
}
```

### 3.4 Debounce Hook 패턴

```typescript
// src/features/map/hooks/use-map-bounds.ts

function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay],
  );
}
```

---

## 4. 데이터 페칭 패턴

### 4.1 Repository 패턴

```typescript
// src/lib/supabase/repositories/courseRepository.ts

export function courseRepository(supabase: SupabaseClient<Database>) {
  return {
    async getActiveCourses(): Promise<CourseWithCategory[]> {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          course_categories (id, key, name, description, cover_image_url, sort_order)
        `)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as CourseWithCategory[];
    },

    async getCourseById(courseId: string): Promise<CourseWithDetails> {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          course_categories (*),
          course_comments (*, course_comment_photos (*)),
          course_photos (*)
        `)
        .eq("id", courseId)
        .single();

      if (error) throw error;
      return data as CourseWithDetails;
    },

    async searchCourses(query: string): Promise<CourseWithCategory[]> {
      const { data, error } = await supabase
        .from("courses")
        .select(`*, course_categories (*)`)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq("is_active", true);

      if (error) throw error;
      return data as CourseWithCategory[];
    },
  };
}
```

**사용 예시**:
```typescript
// Server Component에서
const supabase = await createClient();
const courses = await courseRepository(supabase).getActiveCourses();

// Server Action에서
const supabase = await createClient();
const course = await courseRepository(supabase).getCourseById(id);
```

### 4.2 Server Actions 패턴

```typescript
// src/app/actions/comments.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createCommentAction(formData: FormData) {
  try {
    const courseId = formData.get("courseId") as string;
    const message = formData.get("message") as string;

    // 유효성 검사
    if (!courseId || !message) {
      return { error: "필수 필드가 누락되었습니다", data: null };
    }

    const supabase = await createClient();
    const repo = commentRepository(supabase);

    const comment = await repo.createComment({
      course_id: courseId,
      message,
    });

    // 캐시 무효화
    revalidatePath(`/courses/${courseId}`);

    return { data: comment, error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "오류가 발생했습니다",
      data: null,
    };
  }
}
```

### 4.3 ISR (Incremental Static Regeneration)

```typescript
// src/app/(main)/courses/[id]/page.tsx

// 빌드 시 정적 경로 생성
export async function generateStaticParams() {
  const supabase = createAdminClient();
  const courses = await courseRepository(supabase).getActiveCourses();
  return courses.map((course) => ({ id: course.id }));
}

// 1시간마다 재검증
export const revalidate = 3600;

// 동적 메타데이터
export async function generateMetadata({ params }): Promise<Metadata> {
  const course = await courseRepository(supabase).getCourseById(params.id);
  return {
    title: `${course.title} | GSRC81`,
    description: course.description,
  };
}
```

### 4.4 Real-time 구독 패턴

```typescript
// src/features/courses/hooks/use-courses-v2.ts
"use client";

export function useCoursesV2() {
  const [courses, setCourses] = useState<CourseV2[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 데이터 로드
    fetchCourses();

    // 실시간 구독
    const subscription = supabase
      .channel("courses-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courses" },
        (payload) => {
          setCourses((prev) => {
            // INSERT, UPDATE, DELETE 처리
            // ...
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { courses, loading, refetch: fetchCourses };
}
```

---

## 5. 스타일링 패턴

### 5.1 Design Tokens

```css
/* src/app/globals.css */
@theme inline {
  /* 색상 팔레트 */
  --color-lola-50: #faf8fa;
  --color-lola-100: #f5f2f5;
  --color-lola-500: #9d8b9d;
  --color-lola-900: #5a4f5a;

  /* 시맨틱 색상 */
  --color-bg-base: #ebe7e4;
  --color-bg-primary: var(--color-lola-50);
  --color-bg-secondary: var(--color-lola-100);

  /* 카테고리 색상 */
  --color-track-primary: #d04836;
  --color-road-primary: #fcfc60;
  --color-trail-primary: #78a893;

  /* 폰트 */
  --font-poppins: var(--font-poppins);
  --font-noto-sans: "Noto Sans", sans-serif;

  /* 간격 */
  --spacing-map-height: 24.5625rem;
}
```

### 5.2 CVA (Class Variance Authority)

```typescript
// src/shared/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // 기본 스타일
  "inline-flex items-center justify-center rounded-md font-medium transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

### 5.3 cn() 유틸리티

```typescript
// src/shared/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**사용 예시**:
```tsx
<div className={cn(
  "base-styles",
  isActive && "active-styles",
  className
)} />
```

### 5.4 반응형 디자인

```css
/* 컨테이너 쿼리 */
@container/card-header (min-width: 300px) {
  [data-slot="card-header"] {
    grid-template-columns: 1fr auto;
  }
}

/* iOS Safe Area */
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

---

## 6. 코드 구조화 패턴

### 6.1 Barrel Exports

```typescript
// src/features/courses/index.ts
export * from "./components";
export * from "./hooks";

// src/features/courses/components/index.ts
export { CourseStats } from "./course-stats";
export { CourseGallery } from "./course-gallery";
export { CourseCommentsList } from "./course-comments-list";

// src/lib/supabase/repositories/index.ts
export * from "./courseRepository";
export * from "./commentRepository";
export * from "./categoryRepository";
```

**사용**:
```typescript
// Before
import { CourseStats } from "@/features/courses/components/course-stats";
import { useCoursesV2 } from "@/features/courses/hooks/use-courses-v2";

// After
import { CourseStats, useCoursesV2 } from "@/features/courses";
```

### 6.2 타입 구조화

```typescript
// src/shared/types/database.types.ts (자동 생성)
export type Database = {
  public: {
    Tables: {
      courses: { Row: Course; Insert: CourseInsert; Update: CourseUpdate };
      // ...
    };
  };
};

// src/lib/supabase/repositories/courseRepository.ts (커스텀 타입)
export type CourseWithCategory = Course & {
  course_categories: CourseCategory | null;
};

export type CourseWithDetails = CourseWithCategory & {
  course_comments: CommentWithPhotos[];
  course_photos: CoursePhoto[];
};
```

### 6.3 설정 중앙화

```typescript
// src/core/config/map.ts
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
export const EUNPYEONG_CENTER: [number, number] = [126.9285, 37.6176];
export const DEFAULT_ZOOM = 11.5;
export const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_BRAND_STYLE;

// src/core/config/category-designs.ts
export const CATEGORY_DESIGNS = {
  jingwan: {
    backgroundColor: "#F5F2F5",
    markerColor: "#D04836",
    cardColors: ["#FFE4E1", "#FFF0ED", "#FFF5F3"],
  },
  // ...
} as const;

export function getCategoryDesign(key: string) {
  return CATEGORY_DESIGNS[key] ?? CATEGORY_DESIGNS.default;
}
```

---

## 7. 성능 최적화 패턴

### 7.1 메모이제이션

```typescript
// useMemo - 계산 결과 캐싱
const displayCourses = useMemo(() => {
  if (currentCategory === "all") return courses;
  return courses.filter(c => c.category?.key === currentCategory);
}, [courses, currentCategory]);

// useCallback - 함수 참조 안정화
const handleCourseClick = useCallback((course: Course) => {
  setSelectedCourse(course);
}, []);

// React.memo - 컴포넌트 리렌더링 방지
export const CourseMarker = memo(CourseMarkerComponent);
```

### 7.2 GPU 가속 힌트

```typescript
// Framer Motion 애니메이션 최적화
<motion.div
  style={{
    willChange: "transform, opacity",
    backfaceVisibility: "hidden",
    transform: "translate3d(0, 0, 0)",
  }}
/>
```

### 7.3 지연 로딩

```typescript
// 동적 import
const TrailMap = dynamic(
  () => import("@/features/map/components/trail-map"),
  { loading: () => <MapSkeleton /> }
);

// Suspense 경계
<Suspense fallback={<MapSkeleton />}>
  <MapData />
</Suspense>
```

### 7.4 이미지 최적화

```typescript
import Image from "next/image";

<Image
  src={course.cover_image_url}
  alt={course.title}
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

---

## 8. 모바일 지원 패턴

### 8.1 Safe Area 지원

```typescript
// src/providers/safe-area-provider.tsx
"use client";

export function SafeAreaProvider({ children }) {
  const { isIOS, safeAreaInsets } = useDeviceDetection();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--safe-area-inset-top", `${safeAreaInsets.top}px`);
    root.style.setProperty("--safe-area-inset-bottom", `${safeAreaInsets.bottom}px`);

    if (isIOS) {
      document.body.classList.add("is-ios");
    }
  }, [isIOS, safeAreaInsets]);

  return (
    <SafeAreaContext.Provider value={{ isIOS, safeAreaInsets }}>
      {children}
    </SafeAreaContext.Provider>
  );
}
```

### 8.2 디바이스 감지

```typescript
// src/shared/hooks/use-device-detection.ts
export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    hasNotch: false,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);

    // Safe Area 감지 로직...

    setDeviceInfo({ isIOS, isAndroid, ... });
  }, []);

  return deviceInfo;
}
```

### 8.3 터치 제스처

```typescript
// 바텀시트 드래그
const handleTouchStart = (e: React.TouchEvent) => {
  touchStartY.current = e.touches[0].clientY;
};

const handleTouchEnd = (e: React.TouchEvent) => {
  const deltaY = e.changedTouches[0].clientY - touchStartY.current;
  const velocity = deltaY / (Date.now() - startTime);

  if (velocity > VELOCITY_THRESHOLD) {
    snapToPrev();
  } else if (velocity < -VELOCITY_THRESHOLD) {
    snapToNext();
  }
};
```

---

## 부록: 패턴 요약표

| 카테고리 | 패턴 | 적용 위치 |
|---------|------|----------|
| 컴포넌트 | Feature-Based | `src/features/` |
| 컴포넌트 | Compound Components | `src/shared/components/ui/` |
| 컴포넌트 | Server/Client 분리 | `app/`, `features/` |
| 상태관리 | Context + Hooks | `providers/`, `features/*/context/` |
| 상태관리 | useOptimistic | `features/*/hooks/` |
| 데이터 | Repository 패턴 | `lib/supabase/repositories/` |
| 데이터 | Server Actions | `app/actions/` |
| 데이터 | ISR | `app/(main)/*/page.tsx` |
| 스타일 | CVA Variants | `shared/components/ui/` |
| 스타일 | Design Tokens | `app/globals.css` |
| 코드구조 | Barrel Exports | `*/index.ts` |
| 성능 | 메모이제이션 | 전역 |
| 모바일 | Safe Area | `providers/safe-area-provider.tsx` |

---

**Document End**
