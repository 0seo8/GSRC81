"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { MapboxMap } from "./mapbox-map";
import { CourseMarker } from "./course-marker";
import { CourseDrawer } from "./course-drawer";
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

  const {
    map,
    selectedCourse,
    selectedCourses,
    optimisticCourses,
    handleMapLoad,
    handleCourseClick,
    handleClusterClick,
    handleCloseDrawer,
  } = useMapState(courses);

  useMapBounds(map, optimisticCourses);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  const handleCourseCardClick = (courseId: string) => {
    // React 19의 startTransition을 사용하여 네비게이션을 낮은 우선순위로 처리
    startTransition(() => {
      router.push(`/courses/${courseId}`);
      handleCloseDrawer();
    });
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

        {/* 코스 카드 드로어 */}
        <CourseDrawer
          selectedCourses={selectedCourses}
          selectedCourse={selectedCourse}
          onClose={handleCloseDrawer}
          onCourseClick={handleCourseCardClick}
        />
      </div>
    </div>
  );
}
