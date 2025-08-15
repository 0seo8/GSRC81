"use client";

import { useState, useEffect } from "react";
import { ProtectedAdminRoute } from "@/components/protected-admin-route";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { GPXUploadForm } from "@/components/admin/GPX-upload-form";

interface Course {
  id: string;
  title: string;
  description: string;
  start_latitude: number;
  start_longitude: number;
  distance_km: number;
  avg_time_min: number;
  difficulty: "easy" | "medium" | "hard";
  nearest_station: string;
  is_active: boolean;
  created_at: string;
}

export default function CoursesManagePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isGPXFormExpanded, setIsGPXFormExpanded] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`"${course.title}" 코스를 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", course.id);

      if (error) throw error;
      alert("코스가 삭제되었습니다.");
      loadCourses();
    } catch (error) {
      console.error("Failed to delete course:", error);
      alert("코스 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleGPXSubmit = async (formData: FormData, gpxData: unknown) => {
    try {
      setSubmitting(true);

      // GPX 데이터에서 코스 정보 추출
      const gpx = gpxData as Record<string, unknown>;
      const startPoint = gpx.startPoint as Record<string, number>;

      const courseData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        start_latitude: startPoint.lat,
        start_longitude: startPoint.lng,
        distance_km: gpx.distance as number,
        avg_time_min: gpx.duration as number,
        difficulty: formData.get("difficulty") as string,
        nearest_station: formData.get("nearest_station") as string,
        gpx_coordinates: JSON.stringify(gpx.coordinates), // GPX 좌표 저장
        elevation_gain: (gpx.elevationGain as number) || 0, // 고도 상승 저장
        is_active: true,
      };

      const { error } = await supabase.from("courses").insert([courseData]);

      if (error) throw error;

      alert("GPX 파일로부터 코스가 성공적으로 등록되었습니다!");
      setIsGPXFormExpanded(false);
      loadCourses();
    } catch (error) {
      console.error("Failed to save course from GPX:", error);
      alert("코스 등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleGPXForm = () => {
    setIsGPXFormExpanded(!isGPXFormExpanded);
  };

  const difficultyLabels = {
    easy: "쉬움",
    medium: "보통",
    hard: "어려움",
  };

  const difficultyColors = {
    easy: "bg-gray-100 text-gray-800",
    medium: "bg-gray-200 text-gray-800",
    hard: "bg-gray-300 text-gray-800",
  };

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 모바일용 GPX 코스 등록 섹션 (아코디언) */}
          <div className="mb-6 block md:hidden">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={toggleGPXForm}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-base font-semibold text-gray-900">
                    새 코스 등록
                  </span>
                </div>
                {isGPXFormExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {isGPXFormExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4">
                    <GPXUploadForm
                      onSubmit={handleGPXSubmit}
                      loading={submitting}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 데스크톱용 GPX 코스 등록 섹션 */}
          <div className="mb-8 hidden md:block">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-gray-600" />새 코스 등록
              </h2>
              <GPXUploadForm onSubmit={handleGPXSubmit} loading={submitting} />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">코스를 불러오는 중...</p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {course.nearest_station &&
                            `${course.nearest_station} 인근`}
                        </CardDescription>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          difficultyColors[course.difficulty]
                        }`}
                      >
                        {difficultyLabels[course.difficulty]}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.description || "설명이 없습니다."}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">거리</span>
                        <p className="font-medium">{course.distance_km}km</p>
                      </div>
                      <div>
                        <span className="text-gray-500">소요시간</span>
                        <p className="font-medium">
                          {course.avg_time_min
                            ? `${course.avg_time_min}분`
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 mb-4">
                      등록일: {new Date(course.created_at).toLocaleDateString()}
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/courses/${course.id}/manage`}
                        className="flex-1"
                      >
                        <Button size="sm" variant="outline" className="w-full">
                          <Edit className="w-4 h-4 mr-1" />
                          관리
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(course)}
                        className="text-gray-600 hover:text-gray-700 hover:border-gray-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                등록된 코스가 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                GPX 파일을 업로드하여 첫 번째 러닝 코스를 등록해보세요
              </p>
              <Button onClick={() => setIsGPXFormExpanded(true)}>
                <Plus className="w-4 h-4 mr-2" />
                GPX로 첫 코스 등록하기
              </Button>
            </div>
          )}
        </main>
      </div>
    </ProtectedAdminRoute>
  );
}
