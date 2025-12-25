import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  courseRepository,
  categoryRepository,
} from "@/lib/supabase/repositories";
import { OptimizedMapClient } from "@/features/map/components/optimized-map-client";
import { MapSkeleton } from "@/features/map/components/map-skeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "지도 | GSRC81 MAPS",
  description: "서울 은평구의 러닝 코스를 탐색하고 공유하세요",
  openGraph: {
    title: "지도 | GSRC81 MAPS",
    description: "서울 은평구의 러닝 코스를 탐색하고 공유하세요",
    type: "website",
  },
};

// ISR: 1시간마다 데이터 재검증
export const revalidate = 3600;

/**
 * Map Data Fetcher (서버 컴포넌트)
 * 데이터 패칭을 별도 컴포넌트로 분리하여 Streaming SSR 최적화
 */
async function MapData() {
  const supabase = await createClient();
  const courseRepo = courseRepository(supabase);
  const categoryRepo = categoryRepository(supabase);

  // 카테고리와 전체 코스를 병렬로 로드
  const [categories, courses] = await Promise.all([
    categoryRepo.getActiveCategories(),
    courseRepo.getActiveCourses(),
  ]);

  return <OptimizedMapClient courses={courses} categories={categories} />;
}

/**
 * Map 페이지 (서버 컴포넌트)
 *
 * Next.js 15 + React 19 최적화:
 * - Suspense를 사용한 Streaming SSR
 * - 데이터 로딩 중에도 즉시 Shell UI 렌더링
 * - loading.tsx가 자동으로 Suspense fallback 제공
 * - error.tsx가 자동으로 Error Boundary 제공
 * - ISR을 통한 데이터 캐싱 및 재검증
 * - Repository 패턴으로 타입 안전한 데이터 접근
 *
 * 성능 개선:
 * - TTFB (Time To First Byte) 최소화
 * - Streaming으로 점진적 렌더링
 * - 사용자가 빈 화면을 보지 않음
 */
export default function MapPage() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapData />
    </Suspense>
  );
}
