"use client";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { MapPin, Clock, TrendingUp, X, MessageCircle } from "lucide-react";
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

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
              {course.title}
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              {course.description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 md:p-2"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>

        {/* Difficulty Badge */}
        <div className="flex items-center justify-between">
          <span
            className={`px-3 py-1 md:px-4 md:py-2 rounded-full text-sm md:text-base font-medium ${getDifficultyColor(
              course.difficulty
            )}`}
          >
            {getDifficultyText(course.difficulty)}
          </span>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 md:p-6">
            <div className="flex items-center space-x-2 mb-2 md:mb-3">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
              <span className="text-sm md:text-base text-gray-600">거리</span>
            </div>
            <p className="text-lg md:text-xl font-semibold text-gray-900">
              {course.distance_km}km
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 md:p-6">
            <div className="flex items-center space-x-2 mb-2 md:mb-3">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              <span className="text-sm md:text-base text-gray-600">
                소요시간
              </span>
            </div>
            <p className="text-lg md:text-xl font-semibold text-gray-900">
              {course.avg_time_min}분
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 md:p-6">
            <div className="flex items-center space-x-2 mb-2 md:mb-3">
              <img
                src="/character-running-3.svg"
                alt="댓글"
                className="w-4 h-4 md:w-5 md:h-5 object-contain"
              />
              <span className="text-sm md:text-base text-gray-600">댓글</span>
            </div>
            <p className="text-lg md:text-xl font-semibold text-gray-900">
              {course.comment_count || 0}개
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4">
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3"
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
