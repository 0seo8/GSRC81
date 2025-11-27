"use client";

import { useState, useEffect } from "react";
import { ProtectedAdminRoute } from "@/shared/components/common/protected-admin-route";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { GPXUploadForm } from "@/features/admin/components/GPX-upload-form";
import {
  CourseV2,
  getDistance,
  getDuration,
  UnifiedGPXData,
} from "@/types/unified";
import { toast } from "sonner";
import { GPXDataSchema } from "@/shared/lib/validation/gpx-schema";
import {
  getDifficultyLabel,
  getDifficultyColor,
  EMPTY_COURSE_MESSAGE,
} from "@/shared/lib/constants/course";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  CONFIRM_MESSAGES,
  LOADING_MESSAGES,
} from "@/shared/lib/constants/messages";

export default function CoursesManagePage() {
  const [courses, setCourses] = useState<CourseV2[]>([]);
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

      if (error) {
        console.error("❌ Admin: 코스 로딩 오류:", error);
        throw error;
      }

      setCourses(data || []);
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast.error(ERROR_MESSAGES.COURSE_LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (course: CourseV2) => {
    const confirmed = window.confirm(
      CONFIRM_MESSAGES.DELETE_COURSE(course.title),
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", course.id);

      if (error) throw error;

      toast.success(SUCCESS_MESSAGES.COURSE_DELETED);
      loadCourses();
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error(ERROR_MESSAGES.COURSE_DELETE_FAILED);
    }
  };

  const handleGPXSubmit = async (formData: FormData, gpxData: unknown) => {
    try {
      setSubmitting(true);

      // Zod로 GPX 데이터 검증
      const validatedGPX = GPXDataSchema.parse(gpxData);

      const { startPoint, coordinates, distance, duration, elevationGain } =
        validatedGPX;

      // 통계 계산
      const bounds = {
        minLat: Math.min(...coordinates.map((c) => c.lat)),
        maxLat: Math.max(...coordinates.map((c) => c.lat)),
        minLng: Math.min(...coordinates.map((c) => c.lng)),
        maxLng: Math.max(...coordinates.map((c) => c.lng)),
      };

      // vFinal 표준화된 GPX 데이터 구조
      const normalizedGpxData: UnifiedGPXData = {
        version: "1.1" as const,
        points: coordinates,
        bounds,
        stats: {
          totalDistance: distance,
          elevationGain: elevationGain || 0,
          estimatedDuration: duration,
        },
        metadata: {
          startPoint: {
            lat: startPoint.lat,
            lng: startPoint.lng,
          },
          endPoint: {
            lat: coordinates[coordinates.length - 1].lat,
            lng: coordinates[coordinates.length - 1].lng,
          },
        },
      };

      const courseData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        detail_description:
          (formData.get("detail_description") as string) || null,
        start_latitude: startPoint.lat,
        start_longitude: startPoint.lng,
        distance_km: distance,
        avg_time_min: duration,
        difficulty: formData.get("difficulty") as string,
        category_id: (formData.get("category_id") as string) || null,
        tags: JSON.parse((formData.get("tags") as string) || "[]"),
        cover_image_url: (formData.get("cover_image_url") as string) || null,
        elevation_gain: elevationGain || 0,
        sort_order: 0,
        gpx_data: normalizedGpxData,
        is_active: true,
      };

      const { error: courseError } = await supabase
        .from("courses")
        .insert([courseData]);

      if (courseError) {
        console.error("❌ Supabase insert error:", courseError);
        throw courseError;
      }

      toast.success(SUCCESS_MESSAGES.COURSE_CREATED);
      setIsGPXFormExpanded(false);
      loadCourses();
    } catch (error) {
      console.error("Failed to save course from GPX:", error);

      if (error instanceof Error) {
        toast.error(`${ERROR_MESSAGES.COURSE_CREATE_FAILED}: ${error.message}`);
      } else {
        toast.error(ERROR_MESSAGES.COURSE_CREATE_FAILED);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleGPXForm = () => {
    setIsGPXFormExpanded(!isGPXFormExpanded);
  };

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* GPX 코스 등록 섹션 - Responsive */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* 모바일: 접기/펼치기 버튼 */}
              <button
                onClick={toggleGPXForm}
                className="w-full p-4 md:p-6 flex items-center justify-between text-left hover:bg-gray-50 md:hover:bg-white rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2 text-gray-600" />
                  <span className="text-base md:text-lg font-semibold text-gray-900">
                    새 코스 등록
                  </span>
                </div>
                {/* 모바일에서만 아이콘 표시 */}
                <div className="md:hidden">
                  {isGPXFormExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* 폼 영역 - 데스크톱에서는 항상 표시, 모바일에서는 토글 */}
              <div
                className={`
                  px-4 pb-4 md:px-6 md:pb-6 border-t border-gray-100
                  ${isGPXFormExpanded ? "block" : "hidden md:block"}
                `}
              >
                <div className="pt-4">
                  <GPXUploadForm
                    onSubmit={handleGPXSubmit}
                    loading={submitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 코스 목록 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {LOADING_MESSAGES.LOADING_COURSES}
              </p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <EmptyState onAddCourse={() => setIsGPXFormExpanded(true)} />
          )}
        </main>
      </div>
    </ProtectedAdminRoute>
  );
}

// 코스 카드 컴포넌트
interface CourseCardProps {
  course: CourseV2;
  onDelete: (course: CourseV2) => Promise<void>;
}

function CourseCard({ course, onDelete }: CourseCardProps) {
  return (
    <Card className="shadow-xl border-0 py-6 gap-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{course.title}</CardTitle>
            <CardDescription>
              {course.gpx_data.metadata?.nearestStation &&
                `${course.gpx_data.metadata.nearestStation} 인근`}
            </CardDescription>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}
          >
            {getDifficultyLabel(course.difficulty)}
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
            <p className="font-medium">{getDistance(course).toFixed(2)}km</p>
          </div>
          <div>
            <span className="text-gray-500">소요시간</span>
            <p className="font-medium">{getDuration(course)}</p>
          </div>
        </div>

        <div className="text-xs text-gray-400 mb-4">
          등록일: {new Date(course.created_at).toLocaleDateString()}
        </div>

        <div className="flex space-x-2">
          <Link href={`/admin/courses/${course.id}/manage`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full">
              <Edit className="w-4 h-4 mr-1" />
              관리
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(course)}
            className="text-red-600 hover:text-red-700 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 빈 상태 컴포넌트
interface EmptyStateProps {
  onAddCourse: () => void;
}

function EmptyState({ onAddCourse }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {EMPTY_COURSE_MESSAGE.title}
      </h3>
      <p className="text-gray-600 mb-6">
        GPX 파일을 업로드하여 첫 번째 러닝 코스를 등록해보세요
      </p>
      <Button onClick={onAddCourse}>
        <Plus className="w-4 h-4 mr-2" />
        GPX로 첫 코스 등록하기
      </Button>
    </div>
  );
}
