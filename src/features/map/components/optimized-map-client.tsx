"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "lucide-react";

import { MapboxMap } from "./mapbox-map";
import { CourseMarker } from "./course-marker";
import { CategoryFullScreen } from "./category-full-screen";
import { MapTokenError } from "./map-token-error";
import { AppHeader } from "@/shared/components/layout/app-header";
import { MenuButton } from "@/shared/components/layout/menu-button";
import { useMapState } from "@/features/map/hooks/use-map-state";
import { useMapBounds } from "@/features/map/hooks/use-map-bounds";
import { useGeolocation } from "@/shared/hooks/use-geolocation";
import { type CourseCategory } from "@/shared/lib/courses-data";
import { type CourseWithCategory } from "@/lib/supabase/repositories/courseRepository";
import { addAllCategory } from "@/shared/lib/category-utils";
import {
  MAPBOX_TOKEN,
  EUNPYEONG_CENTER,
  DEFAULT_ZOOM,
  MAPBOX_STYLE,
} from "@/core/config/map";

interface OptimizedMapClientProps {
  courses: CourseWithCategory[];
  categories: CourseCategory[];
}

/**
 * 지도 클라이언트 컴포넌트
 *
 * React 권장 패턴 적용:
 * - 훅 호출 순서 일관성 유지 (조건부 return은 훅 이후)
 * - 환경변수를 모듈 레벨로 분리
 * - 유틸리티 함수 분리 (addAllCategory)
 * - 커스텀 훅으로 관심사 분리 (useGeolocation)
 * - 상수 파일 분리 (map-constants.ts)
 */
export function OptimizedMapClient({
  courses,
  categories,
}: OptimizedMapClientProps) {
  const router = useRouter();

  // 현재 선택된 카테고리
  const [currentCategory, setCurrentCategory] = useState<string>("all");
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  // 위치 버튼 토글 상태 (false: 초기위치, true: 현재위치)
  const [isAtCurrentLocation, setIsAtCurrentLocation] = useState(false);
  // 바텀시트 스냅 포인트 상태 (마커 오프셋 계산용)
  const [bottomSheetSnapPoint, setBottomSheetSnapPoint] = useState<"closed" | "medium" | "full">("closed");

  // 전체 카테고리 추가 (메모이제이션)
  const allCategories = useMemo(() => addAllCategory(categories), [categories]);

  // 현재 카테고리의 코스만 필터링
  const displayCourses = useMemo(() => {
    if (currentCategory === "all") {
      return courses;
    }
    return courses.filter(
      (course) =>
        (course.course_categories?.key || "jingwan") === currentCategory,
    );
  }, [courses, currentCategory]);

  // 지도 상태 관리
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

  // 지도 bounds 자동 조정
  useMapBounds(map, optimisticCourses);

  // 현재 위치 가져오기 (커스텀 훅)
  const { getCurrentLocation } = useGeolocation({
    map,
    onError: (error) => {
      console.error("위치 정보를 가져올 수 없습니다:", error);
      // TODO: 사용자에게 토스트/알림으로 에러 표시
    },
    onSuccess: () => {
      setIsAtCurrentLocation(true);
    },
  });

  // 위치 버튼 토글: 현재 위치 ↔ 초기 위치(은평구 중심)
  const handleLocationToggle = useCallback(() => {
    if (!map) return;

    if (isAtCurrentLocation) {
      // 초기 위치로 복귀
      map.flyTo({
        center: EUNPYEONG_CENTER,
        zoom: DEFAULT_ZOOM,
        duration: 2000,
      });
      setIsAtCurrentLocation(false);
    } else {
      // 현재 위치로 이동
      getCurrentLocation();
    }
  }, [map, isAtCurrentLocation, getCurrentLocation]);

  // 바텀시트 열릴 때 스냅 포인트 medium으로 설정
  useEffect(() => {
    if (isFullscreenOpen) {
      setBottomSheetSnapPoint("medium");
    } else {
      setBottomSheetSnapPoint("closed");
    }
  }, [isFullscreenOpen]);

  // 마커 클릭: 선택된 코스만 바텀시트에 표시
  const handleCourseClick = useCallback(
    (course: CourseWithCategory) => {
      mapHandleCourseClick(course);
      setIsFullscreenOpen(true);
    },
    [mapHandleCourseClick],
  );

  // 클러스터 클릭: 클러스터 내 코스들만 바텀시트에 표시
  const handleClusterClick = useCallback(
    (coursesInCluster: CourseWithCategory[]) => {
      mapHandleClusterClick(coursesInCluster);
      setIsFullscreenOpen(true);
    },
    [mapHandleClusterClick],
  );

  // 바텀시트 스냅 포인트 변경 핸들러
  const handleSnapPointChange = useCallback((snapPoint: "closed" | "medium" | "full") => {
    setBottomSheetSnapPoint(snapPoint);
  }, []);

  // 코스 상세 페이지 이동
  const handleCourseDetailNavigation = useCallback(
    (courseId: string) => {
      router.push(`/courses/${courseId}`);
      setIsFullscreenOpen(false);
      handleCloseDrawer();
    },
    [router, handleCloseDrawer],
  );

  // 카테고리 변경 (드롭다운에서 호출)
  const handleCategoryChange = useCallback(
    (categoryKey: string) => {
      setCurrentCategory(categoryKey);
      // 카테고리 변경 시 바텀시트 닫기
      setIsFullscreenOpen(false);
      handleCloseDrawer();
    },
    [handleCloseDrawer],
  );

  // 메뉴 열림 시 바텀시트 닫기
  const handleMenuOpen = useCallback(() => {
    setIsFullscreenOpen(false);
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  // 바텀시트 닫기
  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreenOpen(false);
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  // Mapbox 토큰 없으면 에러 표시 (훅 호출 이후)
  if (!MAPBOX_TOKEN) {
    return <MapTokenError />;
  }

  return (
    <div className="h-screen bg-transparent flex flex-col overflow-hidden">
      {/* AppHeader with MenuButton (map page only) */}
      <AppHeader
        background="transparent"
        rightElement={
          <MenuButton
            categories={allCategories}
            selectedCategory={currentCategory}
            onCategorySelect={handleCategoryChange}
            onMenuOpen={handleMenuOpen}
          />
        }
      />

      <div className="flex-1 relative overflow-hidden">
        {/* 지도 */}
        <MapboxMap
          accessToken={MAPBOX_TOKEN}
          center={EUNPYEONG_CENTER}
          zoom={DEFAULT_ZOOM}
          onMapLoad={handleMapLoad}
          className="w-full h-full"
          style={MAPBOX_STYLE}
        />

        {/* 코스 마커 */}
        {map && (
          <CourseMarker
            map={map}
            courses={optimisticCourses}
            currentCategory={currentCategory}
            snapPoint={bottomSheetSnapPoint}
            onCourseClick={handleCourseClick}
            onClusterClick={handleClusterClick}
          />
        )}

        {/* 현재 위치 버튼 - 30x30 */}
        <button
          onClick={handleLocationToggle}
          className="absolute top-16 right-4 z-20 w-[30px] h-[30px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label={
            isAtCurrentLocation ? "초기 위치로 이동" : "현재 위치로 이동"
          }
        >
          <Navigation
            className={`w-4 h-4 transition-colors ${
              isAtCurrentLocation
                ? "text-blue-500 fill-blue-500"
                : "text-gray-600 dark:text-gray-300"
            }`}
          />
        </button>

        {/* 카테고리 바텀시트 */}
        <CategoryFullScreen
          isOpen={isFullscreenOpen}
          onClose={handleCloseFullscreen}
          courses={courses}
          categories={allCategories}
          initialCategory={currentCategory}
          onCourseClick={handleCourseDetailNavigation}
          onSnapPointChange={handleSnapPointChange}
          selectedCourse={selectedCourse}
          selectedCourses={selectedCourses}
        />
      </div>
    </div>
  );
}
