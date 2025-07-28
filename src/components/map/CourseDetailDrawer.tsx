"use client";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { MapPin, Clock, TrendingUp, Train, X } from "lucide-react";
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

          <div className="bg-gray-50 rounded-lg p-4 md:p-6 md:col-span-1 col-span-2">
            <div className="flex items-center space-x-2 mb-2 md:mb-3">
              <Train className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              <span className="text-sm md:text-base text-gray-600">
                가까운 역
              </span>
            </div>
            <p className="text-lg md:text-xl font-semibold text-gray-900">
              {course.nearest_station}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 md:space-y-0 md:space-x-3 pt-4 md:flex md:flex-row">
          <Button
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white font-medium py-3"
            onClick={() => {
              router.push(`/courses/${course.id}`);
              onClose();
            }}
          >
            코스 자세히 보기
          </Button>

          <Button
            variant="outline"
            className="w-full md:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => {
              // TODO: 지도에서 코스 경로 표시
              console.log("Show course route on map:", course.id);
            }}
          >
            지도에서 경로 보기
          </Button>

          <Button
            variant="ghost"
            className="w-full md:w-auto text-gray-500 hover:text-gray-700"
            onClick={() => {
              // TODO: 코스 즐겨찾기 기능
              console.log("Toggle favorite:", course.id);
            }}
          >
            즐겨찾기에 추가
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
