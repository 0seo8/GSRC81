"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "lucide-react";

import { MapboxMap } from "./mapbox-map";
import { CourseMarker } from "./course-marker";
import { CategoryFullScreen } from "./category-full-screen";
import { MapTokenError } from "./map-token-error";
import { MapEmptyState } from "./map-empty-state";
import { useMapState } from "@/hooks/use-map-state";
import { useMapBounds } from "@/hooks/use-map-bounds";
import {
  type CourseWithComments,
  type CourseCategory,
  getCourses,
} from "@/lib/courses-data";

interface OptimizedMapClientProps {
  courses: CourseWithComments[];
  categories: CourseCategory[];
}

export function OptimizedMapClient({ 
  courses, 
  categories 
}: OptimizedMapClientProps) {
  const router = useRouter();
  const [allCourses, setAllCourses] = useState<CourseWithComments[]>(courses);
  const [currentCategory, setCurrentCategory] = useState<string>("jingwan");
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  // 현재 카테고리의 코스만 필터링 (memoized)
  const displayCourses = useMemo(() => 
    allCourses.filter(course => 
      (course.category_key || "jingwan") === currentCategory
    ), [allCourses, currentCategory]
  );

  const {
    map,
    optimisticCourses,
    handleMapLoad,
    handleCourseClick: mapHandleCourseClick,
    handleClusterClick: mapHandleClusterClick,
    handleCloseDrawer,
  } = useMapState(displayCourses);

  useMapBounds(map, optimisticCourses);

  // 카테고리별 코스 동적 로딩
  const loadCoursesByCategory = useCallback(async (categoryKey: string) => {
    const existingCourses = allCourses.filter(course => 
      (course.category_key || "jingwan") === categoryKey
    );
    
    if (existingCourses.length === 0) {
      try {
        const newCourses = await getCourses(categoryKey);
        setAllCourses(prev => [...prev, ...newCourses]);
      } catch (error) {
        console.error(`Failed to load ${categoryKey} courses:`, error);
      }
    }
  }, [allCourses]);

  // 마커 클릭 핸들러
  const handleCourseClick = useCallback(async (course: CourseWithComments) => {
    const categoryKey = course.category_key || "jingwan";
    await loadCoursesByCategory(categoryKey);
    setCurrentCategory(categoryKey);
    setIsFullscreenOpen(true);
    mapHandleCourseClick(course);
  }, [loadCoursesByCategory, mapHandleCourseClick]);

  const handleClusterClick = useCallback(async (coursesInCluster: CourseWithComments[]) => {
    const categoryKey = coursesInCluster[0]?.category_key || "jingwan";
    await loadCoursesByCategory(categoryKey);
    setCurrentCategory(categoryKey);
    setIsFullscreenOpen(true);
    mapHandleClusterClick(coursesInCluster);
  }, [loadCoursesByCategory, mapHandleClusterClick]);

  // 카드 클릭으로 코스 상세 페이지 이동
  const handleCourseDetailNavigation = useCallback((courseId: string) => {
    router.push(`/courses/${courseId}`);
    setIsFullscreenOpen(false);
    handleCloseDrawer();
  }, [router, handleCloseDrawer]);

  // 카테고리 변경
  const handleCategoryChange = useCallback(async (categoryKey: string) => {
    await loadCoursesByCategory(categoryKey);
    setCurrentCategory(categoryKey);
  }, [loadCoursesByCategory]);

  // 현재 위치로 이동
  const handleCurrentLocation = useCallback(() => {
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo({
          center: [longitude, latitude],
          zoom: 12,
          duration: 1000,
        });
      },
      (error) => {
        console.error("위치 정보를 가져올 수 없습니다:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [map]);

  // 풀스크린 닫기
  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreenOpen(false);
    setCurrentCategory("jingwan");
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  if (!mapboxToken) {
    return <MapTokenError />;
  }

  if (displayCourses.length === 0 && allCourses.length === 0) {
    return (
      <MapEmptyState mapboxToken={mapboxToken} onMapLoad={handleMapLoad} />
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <div className="flex-1 relative overflow-hidden" style={{ paddingTop: "4rem" }}>
        {/* 지도 */}
        <MapboxMap
          accessToken={mapboxToken}
          center={[126.9285, 37.6176]}
          zoom={11.5}
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

        {/* 현재 위치 버튼 */}
        <button
          onClick={handleCurrentLocation}
          className="absolute top-20 right-4 z-20 bg-white rounded-lg p-3 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="현재 위치로 이동"
        >
          <Navigation className="w-5 h-5 text-black" />
        </button>

        {/* 빈 카테고리 안내 */}
        {map && optimisticCourses.length === 0 && allCourses.length > 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-white rounded-full p-4 shadow-lg border border-gray-200">
              <div className="text-center">
                <div className="text-2xl mb-2">🏃‍♂️</div>
                <p className="text-sm text-gray-600 whitespace-nowrap">
                  이 지역에 코스가 없습니다
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  다른 카테고리를 확인해보세요
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 카테고리 풀스크린 */}
        <CategoryFullScreen
          isOpen={isFullscreenOpen}
          onClose={handleCloseFullscreen}
          courses={allCourses}
          categories={categories}
          initialCategory={currentCategory}
          onCourseClick={handleCourseDetailNavigation}
          onCategoryChange={handleCategoryChange}
        />
      </div>
    </div>
  );
}