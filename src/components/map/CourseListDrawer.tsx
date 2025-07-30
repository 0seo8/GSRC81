"use client";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { X, MapPin, Clock, TrendingUp } from "lucide-react";
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

interface CourseListDrawerProps {
  courses: Course[];
  isOpen: boolean;
  onClose: () => void;
}

export function CourseListDrawer({
  courses,
  isOpen,
  onClose,
}: CourseListDrawerProps) {
  const router = useRouter();

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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              이 지역의 코스들
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              {courses.length}개의 코스가 있습니다
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

        {/* Course List */}
        <div className="space-y-3 md:space-y-4 max-h-96 md:max-h-[70vh] overflow-y-auto">
          {courses.map((course) => (
            <div
              key={course.id}
              className="border border-gray-200 rounded-lg p-4 md:p-6 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
              onClick={() => {
                router.push(`/courses/${course.id}`);
                onClose();
              }}
            >
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <h3 className="font-semibold text-gray-900 text-base md:text-lg flex-1 mr-3">
                  {course.title}
                </h3>
                <span
                  className={`px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-medium flex-shrink-0 ${getDifficultyColor(
                    course.difficulty
                  )}`}
                >
                  {getDifficultyText(course.difficulty)}
                </span>
              </div>

              <p
                className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 leading-relaxed overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {course.description}
              </p>

              <div className="grid grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-orange-500 flex-shrink-0" />
                  <span className="text-gray-600 truncate">
                    {course.distance_km}km
                  </span>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600 truncate">
                    {course.avg_time_min}분
                  </span>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2">
                  <img
                    src="/character-running-3.svg"
                    alt="댓글"
                    className="w-3 h-3 md:w-4 md:h-4 object-contain flex-shrink-0"
                  />
                  <span className="text-gray-600 truncate">
                    {course.comment_count || 0}개
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            코스를 선택하면 상세 정보를 확인할 수 있습니다
          </p>
        </div>
      </div>
    </Drawer>
  );
}
