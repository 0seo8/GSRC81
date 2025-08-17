import { Route, Timer, Mountain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrailData } from "../types";
import { formatTime } from "../utils";
import { FLIGHT_CONFIG } from "../constants";

interface CourseInfoProps {
  trailData: TrailData;
  savedProgress: number;
}

export const CourseInfo = ({ trailData, savedProgress }: CourseInfoProps) => {
  return (
    <Card className="mt-4 py-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {trailData.course.title}
          </CardTitle>

          {/* 속도 설정 및 진행률 표시 (개발용) */}
          <div className="text-xs text-gray-500 text-right">
            <div>속도: {FLIGHT_CONFIG.BASE_DURATION_PER_POINT}ms/pt</div>
            {savedProgress > 0 && (
              <div>저장됨: {(savedProgress * 100).toFixed(0)}%</div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 첫 번째 줄: 거리, 시간 */}
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="flex items-center gap-3">
            <Route className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-800 text-base">
                {trailData.stats.totalDistance.toFixed(1)} km
              </div>
              <div className="text-sm text-gray-500">거리</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Timer className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-semibold text-gray-800 text-base">
                {formatTime(trailData.stats.estimatedTime)}
              </div>
              <div className="text-sm text-gray-500">예상 시간</div>
            </div>
          </div>
        </div>

        {/* 두 번째 줄: 고도, 난이도 */}
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="flex items-center gap-3">
            <Mountain className="w-5 h-5 text-orange-600" />
            <div>
              <div className="font-semibold text-gray-800 text-base">
                +{trailData.stats.elevationGain.toFixed(0)}m
              </div>
              <div className="text-sm text-gray-500">고도 상승</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full ${
                trailData.course.difficulty === "easy"
                  ? "bg-green-500"
                  : trailData.course.difficulty === "medium"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
            <div>
              <div className="font-semibold text-gray-800 text-base capitalize">
                {trailData.stats.difficulty}
              </div>
              <div className="text-sm text-gray-500">난이도</div>
            </div>
          </div>
        </div>

        {/* 코스 설명 */}
        {trailData.course.description && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-gray-700 text-sm leading-relaxed">
              {trailData.course.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
