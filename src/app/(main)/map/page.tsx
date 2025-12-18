import { createClient } from "@/lib/supabase/server";
import {
  courseRepository,
  categoryRepository,
} from "@/lib/supabase/repositories";
import { OptimizedMapClient } from "@/features/map/components/optimized-map-client";
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
 * Map 페이지 (서버 컴포넌트)
 * - loading.tsx가 자동으로 Suspense 경계 제공
 * - error.tsx가 자동으로 Error Boundary 제공
 * - ISR을 통한 데이터 캐싱 및 재검증
 * - Repository 패턴으로 타입 안전한 데이터 접근
 */
export default async function MapPage() {
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
