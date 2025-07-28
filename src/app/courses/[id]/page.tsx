"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Clock,
  TrendingUp,
  Train,
  Heart,
  Share2,
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: course?.title,
        text: course?.description,
        url: window.location.href,
      });
    } else {
      // 폴백: 클립보드에 복사
      navigator.clipboard.writeText(window.location.href);
      alert("링크가 클립보드에 복사되었습니다!");
    }
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
                  코스 상세
                </h1>
                <p className="text-xs text-gray-500">GSRC81 Maps</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-gray-600 hover:text-blue-600"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* 코스 제목 및 난이도 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {course.title}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                  course.difficulty
                )}`}
              >
                {getDifficultyText(course.difficulty)}
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* 코스 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-600">거리</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {course.distance_km}km
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">소요시간</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {course.avg_time_min}분
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Train className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">가까운 역</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {course.nearest_station}
              </p>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <Button
              onClick={handleShowOnMap}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3"
            >
              <MapPin className="w-4 h-4 mr-2" />
              지도에서 보기
            </Button>

            <Button
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Heart className="w-4 h-4 mr-2" />
              즐겨찾기에 추가
            </Button>
          </div>

          {/* 추가 정보 */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              코스 정보
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>시작 위치</span>
                <span>
                  [{course.start_latitude.toFixed(4)},{" "}
                  {course.start_longitude.toFixed(4)}]
                </span>
              </div>
              <div className="flex justify-between">
                <span>등록일</span>
                <span>
                  {new Date(course.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
