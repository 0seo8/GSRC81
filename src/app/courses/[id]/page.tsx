"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { CourseDetailMap } from "@/components/map/CourseDetailMap";
import {
  ArrowLeft,
  Clock,
  MapPin,
  MessageSquare,
  Mountain,
} from "lucide-react";

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

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const courseId = params.id as string;

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .eq("is_active", true)
        .single();

      if (error) throw error;

      setCourse(data);
    } catch (err) {
      console.error("Failed to load course:", err);
      setError("코스를 찾을 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "쉬움";
      case "medium":
        return "보통";
      case "hard":
        return "어려움";
      default:
        return difficulty;
    }
  };

  const handleBackToMap = () => {
    router.push("/map");
  };

  const handleShowOnMap = () => {
    router.push(`/map?course=${courseId}`);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">코스 정보를 불러오는 중...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !course) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              코스를 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={handleBackToMap}
              className="bg-orange-500 hover:bg-orange-600"
            >
              지도로 돌아가기
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToMap}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {course.title}
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* 코스 통계 */}
          <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100 shadow-sm mb-4">
            {/* 헤더 섹션 */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-3 mb-3 ">
                <p className="text-base md:text-lg text-gray-600">
                  {course.description}
                </p>
                <span
                  className={`px-3 rounded-full text-sm font-medium whitespace-nowrap ${getDifficultyColor(
                    course.difficulty
                  )}`}
                >
                  {getDifficultyText(course.difficulty)}
                </span>
              </div>
            </div>

            {/* 통계 섹션 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-xs md:text-sm text-gray-600 font-medium">
                    거리
                  </span>
                </div>
                <p className="text-lg md:text-xl font-bold text-gray-900">
                  {course.distance_km}km
                </p>
              </div>

              <div className="text-center p-3 md:p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-xs md:text-sm text-gray-600 font-medium">
                    시간
                  </span>
                </div>
                <p className="text-lg md:text-xl font-bold text-gray-900">
                  {course.avg_time_min}분
                </p>
              </div>

              <div className="text-center p-3 md:p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mountain className="w-4 h-4 text-orange-600" />
                  <span className="text-xs md:text-sm text-gray-600 font-medium">
                    고도
                  </span>
                </div>
                <p className="text-lg md:text-xl font-bold text-gray-900">
                  107m
                </p>
              </div>

              <div className="text-center p-3 md:p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <span className="text-xs md:text-sm text-gray-600 font-medium">
                    메모
                  </span>
                </div>
                <p className="text-lg md:text-xl font-bold text-gray-900">
                  0개
                </p>
              </div>
            </div>
          </div>

          {/* 코스 지도 */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <CourseDetailMap
                courseId={course.id}
                className="h-[450px] md:h-[600px]"
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
