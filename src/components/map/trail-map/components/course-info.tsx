import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrailData } from "../types";
import { formatTime } from "../utils";
import { FLIGHT_CONFIG } from "../constants";

interface CourseInfoProps {
  trailData: TrailData;
  savedProgress: number;
}

export const CourseInfo = ({ trailData, savedProgress }: CourseInfoProps) => {
  // 난이도 한글 변환
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
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
    <Card className="mt-4">
      <CardContent className="p-6">
        {/* 코스 제목과 작성자 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {trailData.course.title}
          </h2>
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-1" />
            <span>BY GSRC81</span>
          </div>
        </div>

        {/* 거리/시간/고도/난이도 4컬럼 */}
        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">거리</div>
            <div className="text-lg font-semibold text-gray-900">
              {trailData.stats.totalDistance.toFixed(0)}km
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">시간</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatTime(trailData.stats.estimatedTime)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">고도</div>
            <div className="text-lg font-semibold text-gray-900">
              {trailData.stats.elevationGain.toFixed(0)}m
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">난이도</div>
            <div className="text-lg font-semibold text-gray-900">
              {getDifficultyText(trailData.stats.difficulty)}
            </div>
          </div>
        </div>

        {/* 코스 설명 */}
        <div className="mb-6">
          {trailData.course.description ? (
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed text-base">
                {trailData.course.description}
              </p>

              {/* 추가 안내 정보 (PDF 디자인 기반) */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 leading-relaxed">
                  러닝 전 다양한 준비운동을 배우고, 나에게 맞는 조를 선택해서
                  뛰어봐요! 모두 정기런에서 만나요!
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                이 코스에 대한 상세 정보가 곧 업데이트됩니다.
              </p>
            </div>
          )}
        </div>

        {/* 개발용 정보 (개발 환경에서만 표시) */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-gray-400 border-t pt-4">
            <div>속도: {FLIGHT_CONFIG.FLIGHT_SPEED_KMH}km/h</div>
            {savedProgress > 0 && (
              <div>저장된 진행률: {(savedProgress * 100).toFixed(0)}%</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
