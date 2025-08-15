"use client";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Clock, TrendingUp, X, MessageCircle } from "lucide-react";
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

interface CourseDetailDrawerProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CourseDetailDrawer({
  course,
  isOpen,
  onClose,
}: CourseDetailDrawerProps) {
  const router = useRouter();

  if (!course) return null;

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

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {course.title}
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed font-medium">
              {course.description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Difficulty Badge */}
        <div className="flex items-center justify-start">
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${getDifficultyColor(
              course.difficulty
            )} border`}
          >
            {getDifficultyText(course.difficulty)}
          </span>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 md:p-5">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                거리
              </span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {course.distance_km}km
            </p>
          </div>

          <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 md:p-5">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                시간
              </span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {course.avg_time_min}분
            </p>
          </div>

          <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 md:p-5">
            <div className="flex items-center space-x-2 mb-2">
              <MessageCircle className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                댓글
              </span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {course.comment_count || 0}개
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6">
          <Button
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 rounded-xl shadow-sm transition-all duration-200"
            onClick={() => {
              router.push(`/courses/${course.id}`);
              onClose();
            }}
          >
            코스 자세히 보기
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
