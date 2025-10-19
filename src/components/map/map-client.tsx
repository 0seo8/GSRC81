"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { MapboxMap } from "./mapbox-map";
import { CourseMarker } from "./course-marker";
import { CategoryFullScreen } from "./category-full-screen";
import { MapTokenError } from "./map-token-error";
import { MapEmptyState } from "./map-empty-state";
import { useMapState } from "@/hooks/use-map-state";
import { useMapBounds } from "@/hooks/use-map-bounds";
import { type CourseWithComments } from "@/lib/courses-data";

interface MapClientProps {
  courses: CourseWithComments[];
}

export function MapClient({ courses }: MapClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clickedCourseCategory, setClickedCourseCategory] = useState<
    string | null
  >(null);

  const {
    map,
    optimisticCourses,
    handleMapLoad,
    handleCourseClick: originalHandleCourseClick,
    handleClusterClick: originalHandleClusterClick,
    handleCloseDrawer,
  } = useMapState(courses); // 모든 코스를 지도에 표시

  useMapBounds(map, optimisticCourses);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  // 새로운 클릭 핸들러들
  const handleCourseClick = (course: CourseWithComments) => {
    setClickedCourseCategory(course.category_key || "jingwan");
    originalHandleCourseClick(course);
  };

  const handleClusterClick = (coursesInCluster: CourseWithComments[]) => {
    // 클러스터의 첫 번째 코스 카테고리를 사용
    const firstCourse = coursesInCluster[0];
    setClickedCourseCategory(firstCourse.category_key || "jingwan");
    originalHandleClusterClick(coursesInCluster);
  };

  const handleCourseCardClick = (courseId: string) => {
    // React 19의 startTransition을 사용하여 네비게이션을 낮은 우선순위로 처리
    startTransition(() => {
      router.push(`/courses/${courseId}`);
      handleCloseCategoryView();
    });
  };

  const handleCloseCategoryView = () => {
    setClickedCourseCategory(null);
    handleCloseDrawer();
  };

  // Mapbox 토큰이 없는 경우
  if (!mapboxToken) {
    return <MapTokenError />;
  }

  // 코스가 없는 경우
  if (optimisticCourses.length === 0) {
    return (
      <MapEmptyState mapboxToken={mapboxToken} onMapLoad={handleMapLoad} />
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        {/* PDF 기반 헤더 */}
        <div className="absolute top-4 left-4 right-4 z-30">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-black">GSRC81 MAPS</h1>
            <div className="flex items-center space-x-4">
              <span className="text-black text-sm">MENU</span>
              <button className="p-2 bg-white rounded-full shadow-lg">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 10L12 15L17 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 지도 */}
        <MapboxMap
          accessToken={mapboxToken}
          center={[127.5, 36.5]}
          zoom={10.5} // 줌 범위 10-12.85 내에서 시작
          onMapLoad={handleMapLoad}
          className="w-full h-full"
          style="mapbox://styles/mapbox/light-v11"
        />

        {/* 코스 마커 */}
        {map && (
          <CourseMarker
            map={map}
            courses={optimisticCourses}
            onCourseClick={handleCourseClick}
            onClusterClick={handleClusterClick}
          />
        )}

        {/* 로딩 인디케이터 (transition 중일 때) */}
        {isPending && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-2 z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
              <span className="text-xs text-gray-600">업데이트 중...</span>
            </div>
          </div>
        )}

        {/* 카테고리 풀스크린 */}
        <CategoryFullScreen
          isOpen={clickedCourseCategory !== null}
          onClose={handleCloseCategoryView}
          courses={courses}
          initialCategory={clickedCourseCategory || "jingwan"}
          onCourseClick={handleCourseCardClick}
        />
      </div>
    </div>
  );
}
