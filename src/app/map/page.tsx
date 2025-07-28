"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MapboxMap } from "@/components/map/MapboxMap";
import { CourseMarker } from "@/components/map/CourseMarker";
import { MapCaptureHelper } from "@/components/map/MapCaptureHelper";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Menu, LogOut } from "lucide-react";
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
}

export default function MapPage() {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  // Mapbox 토큰 (환경변수에서 가져오기)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  // 코스 데이터 로드
  useEffect(() => {
    loadCourses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log(
        "📊 Map page - loadCourses called, got:",
        data?.length,
        "courses"
      );
      setCourses(data || []);
    } catch (err) {
      console.error("Failed to load courses:", err);
      setError("코스 데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapLoad = (mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);
  };

  const handleCourseClick = useCallback(
    (course: Course) => {
      console.log("👆 handleCourseClick called for:", course.title);
      setSelectedCourse(course);
      // 지도 이동 기능 제거
    },
    []
  );

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
        <header className="bg-white shadow-sm z-10 relative">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  GSRC81 Maps
                </h1>
                <p className="text-xs text-gray-500">구파발 러너 매퍼</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {courses.length}개 코스
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

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
            />
          )}

          {/* 디자이너용 캡처 도구 */}
          {map && <MapCaptureHelper map={map} />}

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

          {/* 코스 상세 정보 패널 */}
          {selectedCourse && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm mx-auto">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedCourse.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedCourse.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCourse(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">거리</span>
                  <p className="font-medium">{selectedCourse.distance_km}km</p>
                </div>
                <div>
                  <span className="text-gray-500">소요시간</span>
                  <p className="font-medium">{selectedCourse.avg_time_min}분</p>
                </div>
                <div>
                  <span className="text-gray-500">난이도</span>
                  <p className="font-medium capitalize">
                    {selectedCourse.difficulty}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">가까운 역</span>
                  <p className="font-medium">
                    {selectedCourse.nearest_station}
                  </p>
                </div>
              </div>

              <Button
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
                onClick={() => {
                  // TODO: 코스 상세 페이지로 이동
                  console.log("Navigate to course detail:", selectedCourse.id);
                }}
              >
                자세히 보기
              </Button>
            </div>
          )}

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
