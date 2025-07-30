"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppHeader } from "@/components/common/AppHeader";
import { MapboxMap } from "@/components/map/MapboxMap";
import { CourseMarker } from "@/components/map/CourseMarker";
import { MapCaptureHelper } from "@/components/map/MapCaptureHelper";
import { CourseDetailDrawer } from "@/components/map/CourseDetailDrawer";
import { CourseListDrawer } from "@/components/map/CourseListDrawer";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface Course {
  id: string;
  title: string;
  description: string;
  start_latitude: number;
  start_longitude: number;
  distance_km: number;
  difficulty: "easy" | "medium" | "hard";
  avg_time_min: number;
  nearest_station: string;
  is_active: boolean;
  created_at: string;
  comment_count?: number;
}

export default function MapPage() {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCaptureHelper, setShowCaptureHelper] = useState(true);
  const [preventMapClick, setPreventMapClick] = useState(false);

  // Mapbox 토큰 (환경변수에서 가져오기)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  // 코스 데이터 로드
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // 코스와 댓글 수를 함께 조회
      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          *,
          course_comments(count)
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // 댓글 수를 포함한 코스 데이터 변환
      const coursesWithCommentCount =
        data?.map((course) => ({
          ...course,
          comment_count: course.course_comments?.[0]?.count || 0,
        })) || [];

      setCourses(coursesWithCommentCount);
    } catch (err) {
      setError("코스 데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapLoad = (mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);

    // 지도 클릭 시 drawer 닫기 (마커가 아닌 경우에만)
    mapInstance.on("click", (e) => {
      setSelectedCourse(null);
      setSelectedCourses([]);
    });
  };

  const handleCourseClick = useCallback((course: Course) => {
    // 지도 클릭 방지 플래그 설정
    setPreventMapClick(true);

    setSelectedCourse(course);
    setSelectedCourses([]); // 개별 선택 시 리스트 초기화

    // 짧은 지연 후 플래그 해제
    setTimeout(() => {
      setPreventMapClick(false);
    }, 100);
  }, []);

  const handleClusterClick = useCallback((courses: Course[]) => {
    // 지도 클릭 방지 플래그 설정
    setPreventMapClick(true);

    setSelectedCourses(courses);
    setSelectedCourse(null); // 클러스터 선택 시 개별 선택 초기화

    // 짧은 지연 후 플래그 해제
    setTimeout(() => {
      setPreventMapClick(false);
    }, 100);
  }, []);

  const handleLogout = () => {
    logout();
  };

  if (!mapboxToken) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              지도 설정 오류
            </h2>
            <p className="text-gray-600">
              Mapbox 액세스 토큰이 설정되지 않았습니다.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              환경변수를 확인해주세요.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <AppHeader
          showCaptureButton={true}
          showCaptureHelper={showCaptureHelper}
          onToggleCapture={() => setShowCaptureHelper(!showCaptureHelper)}
        />

        {/* 메인 콘텐츠 */}
        <div className="flex-1 relative overflow-hidden">
          {/* 지도 */}
          <MapboxMap
            accessToken={mapboxToken}
            center={[126.9185, 37.6361]} // 코스들이 있는 위치로 조정
            zoom={14}
            onMapLoad={handleMapLoad}
            className="w-full h-full"
            style="mapbox://styles/mapbox/streets-v12" // 일반 지도로 변경
          />

          {/* 코스 마커 */}
          {map && courses.length > 0 && (
            <CourseMarker
              map={map}
              courses={courses}
              onCourseClick={handleCourseClick}
              onClusterClick={handleClusterClick}
            />
          )}

          {/* 디자이너용 캡처 도구 */}
          {map && showCaptureHelper && (
            <MapCaptureHelper
              map={map}
              onClose={() => setShowCaptureHelper(false)}
            />
          )}

          {/* 로딩 상태 */}
          {loading && (
            <div className="absolute top-20 left-4 bg-white rounded-lg shadow-md p-3 z-10">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                <span className="text-sm text-gray-600">코스 로딩 중...</span>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="absolute top-20 left-4 bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm z-10">
              <p className="text-sm text-red-700">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCourses}
                className="mt-2 text-red-600 hover:text-red-700"
              >
                다시 시도
              </Button>
            </div>
          )}

          {/* Drawer Components */}
          <CourseDetailDrawer
            course={selectedCourse}
            isOpen={!!selectedCourse}
            onClose={() => setSelectedCourse(null)}
          />

          <CourseListDrawer
            courses={selectedCourses}
            isOpen={selectedCourses.length > 0}
            onClose={() => setSelectedCourses([])}
          />

          {/* 빈 상태 */}
          {!loading && courses.length === 0 && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  아직 등록된 코스가 없습니다
                </h3>
                <p className="text-gray-600">
                  관리자가 코스를 등록하면 여기에 표시됩니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
