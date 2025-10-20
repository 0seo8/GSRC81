"use client";

import { useTransition, useState, useEffect } from "react";
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

interface MapClientProps {
  courses: CourseWithComments[];
  categories: CourseCategory[];
}

export function MapClient({ courses, categories }: MapClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clickedCourseCategory, setClickedCourseCategory] = useState<
    string | null
  >(null);
  const [allCourses, setAllCourses] = useState<CourseWithComments[]>(courses);
  const [currentMapCategory, setCurrentMapCategory] =
    useState<string>("jingwan");

  // 카테고리가 변경될 때 모든 코스 로드
  useEffect(() => {
    const loadAllCourses = async () => {
      try {
        const allCategories = ["jingwan", "track", "trail", "road"];
        const allCoursesPromises = allCategories.map((category) =>
          getCourses(category),
        );
        const allCoursesResults = await Promise.all(allCoursesPromises);
        const flatCourses = allCoursesResults.flat();
        setAllCourses(flatCourses);
      } catch (error) {
        console.error("Failed to load all courses:", error);
      }
    };

    loadAllCourses();
  }, []);

  // 지도에 표시할 코스를 현재 카테고리로 필터링
  const mapCourses = allCourses.filter(
    (course) => (course.category_key || "jingwan") === currentMapCategory,
  );

  const {
    map,
    optimisticCourses,
    handleMapLoad,
    handleCourseClick: originalHandleCourseClick,
    handleClusterClick: originalHandleClusterClick,
    handleCloseDrawer,
  } = useMapState(mapCourses); // 현재 카테고리 코스만 지도에 표시

  useMapBounds(map, optimisticCourses);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  // 새로운 클릭 핸들러들
  const handleCourseClick = (course: CourseWithComments) => {
    const categoryKey = course.category_key || "jingwan";
    setClickedCourseCategory(categoryKey);
    setCurrentMapCategory(categoryKey); // 지도의 마커도 해당 카테고리로 필터링
    originalHandleCourseClick(course);
  };

  const handleClusterClick = (coursesInCluster: CourseWithComments[]) => {
    // 클러스터의 첫 번째 코스 카테고리를 사용
    const firstCourse = coursesInCluster[0];
    const categoryKey = firstCourse.category_key || "jingwan";
    setClickedCourseCategory(categoryKey);
    setCurrentMapCategory(categoryKey); // 지도의 마커도 해당 카테고리로 필터링
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
    setCurrentMapCategory("jingwan"); // 기본 카테고리로 복원
    handleCloseDrawer();
  };

  // 카테고리 변경 시 지도 마커 업데이트
  const handleCategoryChange = (categoryKey: string) => {
    setCurrentMapCategory(categoryKey);
  };

  // 현재 위치로 이동
  const handleCurrentLocation = () => {
    if (!map) return;

    if (navigator.geolocation) {
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
        },
      );
    }
  };

  // Mapbox 토큰이 없는 경우
  if (!mapboxToken) {
    return <MapTokenError />;
  }

  // 초기 로드 시에만 빈 상태를 보여줌 (카테고리 전환 중에는 지도 유지)
  if (optimisticCourses.length === 0 && allCourses.length === 0) {
    return (
      <MapEmptyState mapboxToken={mapboxToken} onMapLoad={handleMapLoad} />
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <div
        className="flex-1 relative overflow-hidden"
        style={{ paddingTop: "4rem" }}
      >
        {/* 헤더 공간 확보 */}

        {/* 지도 */}
        <MapboxMap
          accessToken={mapboxToken}
          center={[126.9285, 37.6176]} // 은평구 중심 좌표로 고정
          zoom={11.5} // 줌 범위 10-12.85 내에서 시작
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

        {/* PDF 스타일 현재 위치 버튼 - 화살표 모양, 사각형 */}
        <button
          onClick={handleCurrentLocation}
          className="absolute top-20 right-4 z-20 bg-white rounded-lg p-3 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="현재 위치로 이동"
        >
          <Navigation className="w-5 h-5 text-black" />
        </button>

        {/* 빈 카테고리일 때 중심 안내 */}
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
          courses={allCourses}
          categories={categories}
          initialCategory={clickedCourseCategory || "jingwan"}
          onCourseClick={handleCourseCardClick}
          onCategoryChange={handleCategoryChange}
        />
      </div>
    </div>
  );
}
