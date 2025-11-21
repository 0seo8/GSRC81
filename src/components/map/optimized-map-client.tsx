"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "lucide-react";

import { MapboxMap } from "./mapbox-map";
import { CourseMarker } from "./course-marker";
import { CategoryFullScreen } from "./category-full-screen";
import { MapTokenError } from "./map-token-error";
import { MapEmptyState } from "./map-empty-state";
import Image from "next/image";
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
  categories,
}: OptimizedMapClientProps) {
  // 전체 카테고리 추가
  const allCategories = [
    {
      id: "all",
      key: "all",
      name: "전체",
      description: "모든 코스",
      sort_order: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    ...categories,
  ];
  const router = useRouter();
  const [allCourses, setAllCourses] = useState<CourseWithComments[]>(courses);
  const [currentCategory, setCurrentCategory] = useState<string>("all"); // 전체로 시작
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  // 현재 카테고리의 코스만 필터링 (memoized)
  const displayCourses = useMemo(() => {
    if (currentCategory === "all") {
      return allCourses; // 전체 노출
    }
    return allCourses.filter(
      (course) => (course.category_key || "jingwan") === currentCategory
    );
  }, [allCourses, currentCategory]);

  const {
    map,
    optimisticCourses,
    selectedCourse,
    selectedCourses,
    handleMapLoad,
    handleCourseClick: mapHandleCourseClick,
    handleClusterClick: mapHandleClusterClick,
    handleCloseDrawer,
  } = useMapState(displayCourses);

  useMapBounds(map, optimisticCourses);

  // 카테고리별 코스 동적 로딩
  const loadCoursesByCategory = useCallback(
    async (categoryKey: string) => {
      // "all" 카테고리는 이미 로드된 전체 코스 사용
      if (categoryKey === "all") {
        return; // 전체 코스는 이미 allCourses에 있음
      }

      const existingCourses = allCourses.filter(
        (course) => (course.category_key || "jingwan") === categoryKey
      );

      if (existingCourses.length === 0) {
        try {
          const newCourses = await getCourses(categoryKey);
          setAllCourses((prev) => [...prev, ...newCourses]);
        } catch (error) {
          console.error(`Failed to load ${categoryKey} courses:`, error);
        }
      }
    },
    [allCourses]
  );

  // 마커 클릭 핸들러
  const handleCourseClick = useCallback(
    async (course: CourseWithComments) => {
      if (currentCategory === "all") {
        // 전체 모드에서는 카테고리 전환하지 않음
        setIsFullscreenOpen(true);
        mapHandleCourseClick(course);
      } else {
        // 특정 카테고리 모드에서는 기존 동작
        const categoryKey = course.category_key || "jingwan";
        await loadCoursesByCategory(categoryKey);
        setCurrentCategory(categoryKey);
        setIsFullscreenOpen(true);
        mapHandleCourseClick(course);
      }
    },
    [currentCategory, loadCoursesByCategory, mapHandleCourseClick]
  );

  const handleClusterClick = useCallback(
    async (coursesInCluster: CourseWithComments[]) => {
      if (currentCategory === "all") {
        // 전체 모드에서는 카테고리 전환하지 않음
        setIsFullscreenOpen(true);
        mapHandleClusterClick(coursesInCluster);
      } else {
        // 특정 카테고리 모드에서는 기존 동작
        const categoryKey = coursesInCluster[0]?.category_key || "jingwan";
        await loadCoursesByCategory(categoryKey);
        setCurrentCategory(categoryKey);
        setIsFullscreenOpen(true);
        mapHandleClusterClick(coursesInCluster);
      }
    },
    [currentCategory, loadCoursesByCategory, mapHandleClusterClick]
  );

  // 카드 클릭으로 코스 상세 페이지 이동
  const handleCourseDetailNavigation = useCallback(
    (courseId: string) => {
      router.push(`/courses/${courseId}`);
      setIsFullscreenOpen(false);
      handleCloseDrawer();
    },
    [router, handleCloseDrawer]
  );

  // 카테고리 변경
  const handleCategoryChange = useCallback(
    async (categoryKey: string) => {
      await loadCoursesByCategory(categoryKey);
      setCurrentCategory(categoryKey);
    },
    [loadCoursesByCategory]
  );

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
    setCurrentCategory("all"); // 전체로 닫기
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  if (!mapboxToken) {
    return <MapTokenError />;
  }

  return (
    <div className="h-screen bg-transparent flex flex-col overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
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
            currentCategory={currentCategory}
            onCourseClick={handleCourseClick}
            onClusterClick={handleClusterClick}
          />
        )}

        {/* 현재 위치 버튼 */}
        <button
          onClick={handleCurrentLocation}
          className="absolute top-16 right-4 z-20 bg-white rounded-lg  shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="현재 위치로 이동"
        >
          <Image
            src="/flaticon_icon.png"
            alt="현재 위치"
            width={30}
            height={30}
          />
        </button>

        {/* 카테고리 풀스크린 */}
        <CategoryFullScreen
          isOpen={isFullscreenOpen}
          onClose={handleCloseFullscreen}
          courses={allCourses}
          categories={allCategories}
          initialCategory={currentCategory}
          onCourseClick={handleCourseDetailNavigation}
          onCategoryChange={handleCategoryChange}
          selectedCourse={selectedCourse}
          selectedCourses={selectedCourses}
        />
      </div>
    </div>
  );
}
