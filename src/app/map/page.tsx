"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
            style="mapbox://styles/mapbox/light-v11" // 라이트 지도로 변경
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
            <div className="absolute top-20 left-4 bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-sm z-10">
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

          {/* Course Cards Stack */}
          {selectedCourses.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 z-20">
              {/* Stacked Cards */}
              <div className="relative h-80">
                {selectedCourses.map((course, index) => {
                  const cardColors = [
                    "bg-stone-500", // 갈색
                    "bg-emerald-500", // 초록
                    "bg-yellow-400", // 노랑
                    "bg-red-500", // 빨강
                    "bg-gray-400", // 회색
                    "bg-orange-500", // 주황
                  ];
                  const cardColor = cardColors[index % cardColors.length];

                  // 스택 효과: 위에서 아래로 쌓임, 아래 카드는 상단만 보임
                  const zIndex = selectedCourses.length - index;
                  const offsetY = index * 50; // 50px씩 아래로 (각 카드 상단이 보이도록)
                  const offsetX = 0; // X축 offset 없음 (중앙 정렬)
                  const scale = 1; // 크기는 동일하게

                  return (
                    <div
                      key={course.id}
                      className={`absolute inset-x-0 ${cardColor} rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 shadow-xl`}
                      style={{
                        zIndex: zIndex,
                        top: offsetY,
                        left: offsetX,
                        right: offsetX,
                        transform: `scale(${scale})`,
                        animationDelay: `${index * 150}ms`,
                      }}
                      onClick={() => {
                        router.push(`/courses/${course.id}`);
                        setSelectedCourses([]);
                      }}
                    >
                      {/* Profile Circle */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {course.title.charAt(0)}
                          </span>
                        </div>
                        <div className="text-white opacity-70">
                          <span className="text-lg font-bold">
                            {course.avg_time_min}분
                          </span>
                        </div>
                      </div>

                      {/* Course Info */}
                      <div className="text-white">
                        <h3 className="font-bold text-xl leading-tight mb-1">
                          {course.title}
                        </h3>
                        <p className="text-white opacity-80 text-sm mb-2 line-clamp-1">
                          {course.description}
                        </p>
                        <div className="text-white opacity-70 text-xs">
                          {course.distance_km}km •{" "}
                          {course.difficulty === "easy"
                            ? "쉬움"
                            : course.difficulty === "medium"
                            ? "보통"
                            : "어려움"}
                        </div>
                      </div>

                      {/* Star */}
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 text-white opacity-70">★</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Close Button */}
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setSelectedCourses([])}
                  className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white px-8 py-3 rounded-full backdrop-blur-sm"
                >
                  닫기
                </Button>
              </div>
            </div>
          )}

          {/* Single Course Card */}
          {selectedCourse && (
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className="bg-gray-200 rounded-2xl p-6 shadow-lg animate-in slide-in-from-bottom-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {selectedCourse.title}
                </h2>
                <p className="text-gray-600 mb-4">
                  {selectedCourse.description}
                </p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <p className="text-xl font-bold text-gray-800">
                      {selectedCourse.distance_km}km
                    </p>
                    <p className="text-xs text-gray-500">거리</p>
                  </div>
                  <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <p className="text-xl font-bold text-gray-800">
                      {selectedCourse.avg_time_min}분
                    </p>
                    <p className="text-xs text-gray-500">시간</p>
                  </div>
                  <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <p className="text-xl font-bold text-gray-800">
                      {selectedCourse.comment_count || 0}개
                    </p>
                    <p className="text-xs text-gray-500">댓글</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      router.push(`/courses/${selectedCourse.id}`);
                      setSelectedCourse(null);
                    }}
                    className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-3"
                  >
                    자세히 보기
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCourse(null)}
                    className="px-6 py-3"
                  >
                    닫기
                  </Button>
                </div>
              </div>
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
