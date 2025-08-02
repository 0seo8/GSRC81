"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";

import { MapboxMap } from "@/components/map/MapboxMap";
import { CourseMarker } from "@/components/map/CourseMarker";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (error) {
      setError("코스 데이터를 불러올 수 없습니다.");
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapLoad = useCallback((mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);

    // 지도 클릭 시 drawer 닫기 (마커가 아닌 경우에만)
    mapInstance.on("click", () => {
      setSelectedCourse(null);
      setSelectedCourses([]);
    });
  }, []);

  // 코스들의 좌표 범위에 맞춰 지도 범위 설정
  const fitMapToCourses = useCallback(() => {
    if (!map || courses.length === 0) return;

    // 모든 코스의 좌표를 수집
    const coordinates: [number, number][] = courses.map((course) => [
      course.start_longitude,
      course.start_latitude,
    ]);

    if (coordinates.length === 0) return;

    // 좌표들의 경계 계산
    const lngs = coordinates.map((coord) => coord[0]);
    const lats = coordinates.map((coord) => coord[1]);

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // 여백을 위한 패딩 추가 (약 10% 여유공간)
    const lngPadding = (maxLng - minLng) * 0.1;
    const latPadding = (maxLat - minLat) * 0.1;

    // bounds 설정
    const bounds: [[number, number], [number, number]] = [
      [minLng - lngPadding, minLat - latPadding], // southwest
      [maxLng + lngPadding, maxLat + latPadding], // northeast
    ];

    // 단일 지점인 경우 적절한 줌 레벨로 설정
    if (coordinates.length === 1) {
      map.flyTo({
        center: coordinates[0],
        zoom: 14,
        duration: 1000,
      });
    } else {
      // 여러 지점인 경우 bounds에 맞춰 설정
      map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15,
        duration: 1000,
      });
    }
  }, [map, courses]);

  // 코스 데이터가 로드되고 지도가 준비되면 범위 조정
  useEffect(() => {
    if (map && courses.length > 0 && !loading) {
      fitMapToCourses();
    }
  }, [map, courses, loading, fitMapToCourses]);

  const handleCourseClick = useCallback((course: Course) => {
    setSelectedCourse(course);
    setSelectedCourses([]); // 개별 선택 시 리스트 초기화
  }, []);

  const handleClusterClick = useCallback((courses: Course[]) => {
    setSelectedCourses(courses);
    setSelectedCourse(null); // 클러스터 선택 시 개별 선택 초기화
  }, []);

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
        {/* 메인 콘텐츠 */}
        <div className="flex-1 relative overflow-hidden">
          {/* 지도 */}
          <MapboxMap
            accessToken={mapboxToken}
            center={[127.5, 36.5]} // 한국 중앙 좌표
            zoom={8} // 더 넓은 범위로 시작
            onMapLoad={handleMapLoad}
            className="w-full h-full"
            style="mapbox://styles/mapbox/light-v11" // 회색톤 라이트 지도 + 한국어 지원
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

          {/* 로딩 상태 */}
          {loading && (
            <div className="absolute top-20 left-4 bg-white rounded-lg shadow-md p-3 z-10">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm text-gray-600">코스 로딩 중...</span>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="absolute top-20 left-4 bg-gray-50 border border-gray-200 rounded-lg max-w-sm z-10">
              <p className="text-sm text-gray-700">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCourses}
                className="mt-2 text-gray-600 hover:text-gray-700"
              >
                다시 시도
              </Button>
            </div>
          )}

          {/* Course Cards Drawer - Full Height Drawer */}
          <AnimatePresence>
            {(selectedCourses.length > 0 || selectedCourse) && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
                className="absolute inset-0 bg-white z-30 flex flex-col"
              >
                {/* Drawer Header */}
                <div className="px-4 pt-4 pb-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">코스</h2>
                    <button
                      onClick={() => {
                        setSelectedCourses([]);
                        setSelectedCourse(null);
                      }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <span className="text-gray-500 text-lg transform rotate-90">
                        {">"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Stacked Cards Container */}
                <div className="flex-1 px-4 relative">
                  {(() => {
                    const coursesToRender =
                      selectedCourses.length > 0
                        ? selectedCourses
                        : selectedCourse
                        ? [selectedCourse]
                        : [];
                    return coursesToRender.map((course, index) => {
                      const cardColors = [
                        "bg-gray-900", // 첫 번째 카드 - 진한 회색
                        "bg-gray-700", // 두 번째 카드 - 회색
                        "bg-gray-600", // 세 번째 카드 - 중간 회색
                        "bg-gray-500", // 네 번째 카드 - 밝은 회색
                        "bg-gray-400", // 다섯 번째 카드 - 더 밝은 회색
                        "bg-gray-300", // 여섯 번째 카드 - 아주 밝은 회색
                      ];

                      const cardColor = cardColors[index % cardColors.length];

                      // 텍스트 색상: 밝은 카드에는 검정 텍스트, 어두운 카드에는 흰 텍스트
                      const textColor =
                        index % cardColors.length >= 3
                          ? "text-gray-900"
                          : "text-white";
                      const textOpacity =
                        index % cardColors.length >= 3
                          ? "opacity-60"
                          : "opacity-70";

                      // 스택 효과: expense 앱처럼 큰 숫자가 아래 깔리고 작은 숫자가 위에 쌓임
                      const baseZIndex = index + 1; // 기본 zIndex
                      const isHovered = hoveredCardId === course.id;
                      const zIndex = isHovered
                        ? coursesToRender.length + 10
                        : baseZIndex; // hover된 카드는 가장 위로
                      const topOffset = index * 90; // 90px씩 아래로 이동 (카드 높이 140px의 약 65%만 겹침)
                      const leftOffset = 0; // 좌우 정렬

                      return (
                        <div
                          key={course.id}
                          className={`absolute ${cardColor} rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg ${
                            isHovered ? "shadow-2xl" : ""
                          }`}
                          style={{
                            zIndex: zIndex,
                            top: topOffset,
                            left: leftOffset,
                            right: leftOffset,
                            height: "140px",
                          }}
                          onMouseEnter={() => setHoveredCardId(course.id)}
                          onMouseLeave={() => setHoveredCardId(null)}
                          onClick={() => {
                            router.push(`/courses/${course.id}`);
                            setSelectedCourses([]);
                            setSelectedCourse(null);
                          }}
                        >
                          <div className="flex items-center justify-between h-full">
                            {/* Left: Course Info */}
                            <div className="flex flex-col justify-center">
                              {/* Course Title */}
                              <h3
                                className={`${textColor} text-xl font-bold mb-2`}
                              >
                                {course.title}
                              </h3>

                              {/* Course Details */}
                              <div className="flex items-center space-x-4">
                                <span
                                  className={`${textColor} ${textOpacity} text-sm`}
                                >
                                  {course.distance_km}km
                                </span>
                                <span
                                  className={`${textColor} ${textOpacity} text-sm`}
                                >
                                  {course.avg_time_min}분
                                </span>
                                <span
                                  className={`${textColor} ${textOpacity} text-sm`}
                                >
                                  {course.difficulty === "easy"
                                    ? "쉬움"
                                    : course.difficulty === "medium"
                                    ? "보통"
                                    : "어려움"}
                                </span>
                              </div>
                            </div>

                            {/* Right: Distance (Large) */}
                            <div className={`${textColor} text-right`}>
                              <span className="text-2xl font-bold">
                                {course.distance_km}km
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
