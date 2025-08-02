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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-gray-100 text-gray-800";
      case "medium":
        return "bg-gray-200 text-gray-800";
      case "hard":
        return "bg-gray-300 text-gray-800";
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
          <div className="relative mb-8 overflow-hidden">
            <TrailMap courseId={course.id} className="h-[70vh] md:h-[80vh]" />
          </div>

          {/* 코스 정보 */}
          <div className="w-full">
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {course.title}
              </h2>

              {/* 코스 통계 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 거리 */}
                <div className="border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {course.distance_km}km
                  </div>
                  <div className="text-sm text-gray-600">거리</div>
                </div>

                {/* 소요시간 */}
                <div className="border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {course.avg_time_min}분
                  </div>
                  <div className="text-sm text-gray-600">소요시간</div>
                </div>

                {/* 고도 (임시) */}
                <div className="border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">-</div>
                  <div className="text-sm text-gray-600">고도</div>
                </div>

                {/* 난이도 */}
                <div className="border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {getDifficultyText(course.difficulty)}
                  </div>
                  <div className="text-sm text-gray-600">난이도</div>
                </div>
              </div>

              {/* 코스 설명 */}
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
