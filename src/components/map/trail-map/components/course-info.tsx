import { Route, Timer, Mountain } from "lucide-react";
import { TrailData } from "../types";
import { formatTime } from "../utils";
import { FLIGHT_CONFIG } from "../constants";

interface CourseInfoProps {
  trailData: TrailData;
  savedProgress: number;
}

export const CourseInfo = ({ trailData, savedProgress }: CourseInfoProps) => {
  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-t">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            {trailData.course.title}
          </h3>

          {/* 속도 설정 및 진행률 표시 (개발용) */}
          <div className="text-xs text-gray-500 text-right">
            <div>속도: {FLIGHT_CONFIG.BASE_DURATION_PER_POINT}ms/pt</div>
            {savedProgress > 0 && (
              <div>저장됨: {(savedProgress * 100).toFixed(0)}%</div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-800">
                {trailData.stats.totalDistance.toFixed(1)} km
              </div>
              <div className="text-xs text-gray-500">거리</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-green-600" />
            <div>
              <div className="font-semibold text-gray-800">
                {formatTime(trailData.stats.estimatedTime)}
              </div>
              <div className="text-xs text-gray-500">예상 시간</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-orange-600" />
            <div>
              <div className="font-semibold text-gray-800">
                +{trailData.stats.elevationGain.toFixed(0)}m
              </div>
              <div className="text-xs text-gray-500">고도 상승</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${
                trailData.course.difficulty === "easy"
                  ? "bg-green-500"
                  : trailData.course.difficulty === "medium"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
            <div>
              <div className="font-semibold text-gray-800 capitalize">
                {trailData.stats.difficulty}
              </div>
              <div className="text-xs text-gray-500">난이도</div>
            </div>
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
    </div>
  );
};