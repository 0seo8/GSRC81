import { MapPin } from "lucide-react";

export function MapTokenError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          지도 설정 오류
        </h2>
        <p className="text-gray-600">
          Mapbox 액세스 토큰이 설정되지 않았습니다.
        </p>
        <p className="text-sm text-gray-500 mt-2">환경변수를 확인해주세요.</p>
      </div>
    </div>
  );
}