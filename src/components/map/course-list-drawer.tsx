"use client";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { X } from "lucide-react";
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
      <div>
        {/* Close Button - Minimal */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Course Cards - Clean Stack */}
        <div className="space-y-3 max-h-[80vh] overflow-y-auto">
          {courses.map((course, index) => {
            // 카드 색상을 순환적으로 적용
            const cardColors = [
              "bg-gray-200", // 연한 회색
              "bg-gray-300", // 중간 회색
              "bg-gray-400", // 진한 회색
              "bg-stone-300", // 스톤 회색
              "bg-slate-300", // 슬레이트 회색
            ];
            const cardColor = cardColors[index % cardColors.length];

            return (
              <div
                key={course.id}
                className={`${cardColor} rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]`}
                onClick={() => {
                  router.push(`/courses/${course.id}`);
                  onClose();
                }}
              >
                {/* Course Title */}
                <h3 className="font-bold text-gray-900 text-xl leading-tight mb-3">
                  {course.title}
                </h3>

                {/* Quick Stats */}
                <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                  <span>{course.distance_km}km</span>
                  <span>{course.avg_time_min}분</span>
                  <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded-full">
                    {getDifficultyText(course.difficulty)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Drawer>
  );
}
