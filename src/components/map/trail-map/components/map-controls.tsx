import { Button } from "@/components/ui/button";
import {
  Square,
  Eye,
  Navigation,
  MapPin,
} from "lucide-react";
import { LocationButtonState } from "../types";

interface MapControlsProps {
  isAnimating: boolean;
  isFullRouteView: boolean;
  savedProgress: number;
  locationButtonState: LocationButtonState;
  onAnimationToggle: () => void;
  onLocationRouteToggle: () => void;
}

export const MapControls = ({
  isAnimating,
  isFullRouteView,
  savedProgress,
  locationButtonState,
  onAnimationToggle,
  onLocationRouteToggle,
}: MapControlsProps) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
      <Button
        variant="outline"
        size="sm"
        onClick={onAnimationToggle}
        className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
        title={
          isAnimating
            ? "비행 중단하고 전체보기"
            : isFullRouteView
              ? savedProgress > 0
                ? `경로 추적 재시작 (${(savedProgress * 100).toFixed(0)}%부터)`
                : "경로 추적 비행"
              : "전체보기"
        }
      >
        {isAnimating ? (
          <Square className="w-4 h-4" />
        ) : isFullRouteView ? (
          <Navigation className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onLocationRouteToggle}
        disabled={isAnimating && locationButtonState === "location"}
        className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
        title={
          isAnimating && locationButtonState === "location"
            ? "애니메이션 중에는 위치 찾기 불가"
            : locationButtonState === "location"
              ? "내 위치 찾기"
              : "경로 보기"
        }
      >
        {locationButtonState === "location" ? (
          <MapPin className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};