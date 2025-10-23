import { Suspense } from "react";
import { MapSkeleton } from "@/components/map/map-skeleton";
import { MapError } from "@/components/map/map-error";
import { ErrorBoundary } from "@/components/error-boundary";
import { getCourses, getCourseCategories } from "@/lib/courses-data";
import { MapClientWrapper } from "@/components/map/map-client-wrapper";

export default async function MapPage() {
  try {
    // 카테고리와 초기 코스를 병렬로 로드 (진관동러닝만)
    const [categories, courses] = await Promise.all([
      getCourseCategories(),
      getCourses("jingwan"),
    ]);

    return (
      <ErrorBoundary fallback={<MapError />}>
        <Suspense fallback={<MapSkeleton />}>
          <MapClientWrapper courses={courses} categories={categories} />
        </Suspense>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Failed to load map data:", error);
    return <MapError />;
  }
}
