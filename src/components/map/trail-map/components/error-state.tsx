import { Card, CardContent } from "@/components/ui/card";
import { Mountain } from "lucide-react";

interface ErrorStateProps {
  className?: string;
  error?: string;
}

export const ErrorState = ({ className = "", error }: ErrorStateProps) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="text-center">
          <Mountain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            지도를 로드할 수 없습니다
          </h3>
          <p className="text-gray-500">
            {error || "코스 데이터를 찾을 수 없습니다."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};