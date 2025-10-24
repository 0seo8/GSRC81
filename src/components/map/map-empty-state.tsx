import { MapPin } from "lucide-react";
import { MapboxMap } from "./mapbox-map";

interface MapEmptyStateProps {
  mapboxToken: string;
  onMapLoad: (map: mapboxgl.Map) => void;
}

export function MapEmptyState({ mapboxToken, onMapLoad }: MapEmptyStateProps) {
  return (
    <div className="h-screen bg-lola-50 flex flex-col overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        <MapboxMap
          accessToken={mapboxToken}
          center={[127.5, 36.5]}
          zoom={10.5} // 줌 범위 10-12.85 내에서 시작
          onMapLoad={onMapLoad}
          className="w-full h-full"
          style="mapbox://styles/mapbox/light-v11"
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              아직 등록된 코스가 없습니다
            </h3>
            <p className="text-gray-600">
              관리자가 코스를 등록하면 여기에 표시됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
