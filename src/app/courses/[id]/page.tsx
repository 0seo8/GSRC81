"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { supabase } from "@/lib/supabase";

import { ChatBubbleList } from "@/components/chat/chat-bubble-list";
import { MapPin } from "lucide-react";

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

const TrailMap = dynamic(() => import("@/components/map/TrailMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] md:h-[80vh] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
        <p className="text-gray-600">지도를 불러오는 중...</p>
      </div>
    </div>
  ),
});

export default function CourseDetailPage() {
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(0);

  const courseId = params.id as string;

  useEffect(() => {
    if (courseId) {
      loadCourse();
      loadCommentCount();
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

  const loadCommentCount = async () => {
    try {
      const { count, error } = await supabase
        .from("course_comments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", courseId);

      if (error) throw error;
      setCommentCount(count || 0);
    } catch (error) {
      console.error("Failed to load comment count:", error);
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
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
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 메인 콘텐츠 */}
        <div className="max-w-2xl mx-auto">
          {/* 코스 지도 */}
          <div className="relative overflow-hidden">
            <TrailMap courseId={course.id} className="h-[70vh] md:h-[80vh]" />
          </div>

          {/* 코스 정보 */}
          <div className="w-full">
            <div className="bg-white rounded-t-2xl shadow-sm p-6">
              {/* 헤더 */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {course.title}
                </h1>
              </div>

              {/* 코스 통계 그리드 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* 거리 */}
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {course.distance_km}{" "}
                    <span className="text-lg font-normal text-gray-700">+</span>
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    +0.3k (12%)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">거리 (km)</div>
                </div>

                {/* 소요시간 */}
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.round((course.avg_time_min / 60) * 10) / 10}
                  </div>
                  <div className="text-sm text-gray-500">시간</div>
                  <div className="text-xs text-gray-500 mt-1">예상 시간</div>
                </div>

                {/* 코스 면적/범위 */}
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.round(course.distance_km * 100)} m²{" "}
                    <span className="text-lg font-normal text-gray-700">+</span>
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    +{Math.round(course.distance_km * 20)} m² (15%)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">코스 범위</div>
                </div>

                {/* 난이도 점수 */}
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {course.difficulty === "easy"
                      ? "8"
                      : course.difficulty === "medium"
                      ? "6"
                      : "4"}{" "}
                    점
                  </div>
                  <div className="text-sm text-gray-500">
                    {getDifficultyText(course.difficulty)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">난이도 점수</div>
                </div>
              </div>

              {/* 코스 설명 */}
              {course.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {course.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 크루원 메모 */}
          <div>
            <ChatBubbleList
              courseId={course.id}
              onCommentUpdate={loadCommentCount}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
