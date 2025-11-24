import { getCourses, getCourseCategories } from "@/lib/courses-data";
import { OptimizedMapClient } from "@/components/map/optimized-map-client";
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
 * - 불필요한 wrapper 없이 직접 클라이언트 컴포넌트 사용
 */
export default async function MapPage() {
  // 카테고리와 전체 코스를 병렬로 로드
  const [categories, courses] = await Promise.all([
    getCourseCategories(),
    getCourses(),
  ]);

  return <OptimizedMapClient courses={courses} categories={categories} />;
}
