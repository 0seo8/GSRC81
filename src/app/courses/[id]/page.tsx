"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppHeader } from "@/components/common/AppHeader";
import { supabase } from "@/lib/supabase";
import { CourseDetailMap } from "@/components/map/CourseDetailMap";
import { ChatBubbleList } from "@/components/chat/chat-bubble-list";
import { Clock, MapPin, MessageSquare, Mountain } from "lucide-react";

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

  if (loading) {
    return (
      <ProtectedRoute>
        <AppHeader />
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
        <AppHeader />
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
        {/* 헤더 */}
        <AppHeader />

        {/* 메인 콘텐츠 */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* 코스 통계 */}

          {/* 코스 지도 */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <CourseDetailMap
                courseId={course.id}
                showCompactHeader={true}
                className="h-[450px] md:h-[600px]"
              />
            </div>
          </div>

          {/* 크루원 메모 (말풍선) */}
          <div className="mb-6">
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
