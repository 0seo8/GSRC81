"use client";

import { useEffect, useRef, useState, memo } from "react";
import mapboxgl from "mapbox-gl";

interface MapboxMapProps {
  accessToken: string;
  center?: [number, number];
  zoom?: number;
  style?: string;
  className?: string;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

const MapboxMapComponent = function MapboxMap({
  accessToken,
  center = [126.9784, 37.5665], // 서울 중심
  zoom = 10, // 서울 전체가 보이도록 줌 레벨 조정
  style = "mapbox://styles/mapbox/light-v11", // 라이트 지도를 기본으로
  className = "w-full h-full",
  onMapLoad,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Mapbox 액세스 토큰 설정
    mapboxgl.accessToken = accessToken;

    // 지도 생성
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
      pitch: 0,
      bearing: 0,
      antialias: true,
      maxZoom: 12.85, // 사용자 요구사항에 따른 최대 줌 제한
      minZoom: 10, // 사용자 요구사항에 따른 최소 줌 제한
      preserveDrawingBuffer: true, // 캔버스 캡처를 위해 필요
    });

    // 지도 로드 완료 시
    map.current.on("load", () => {
      // 지도 배경색 설정
      if (map.current) {
        map.current.setPaintProperty('background', 'background-color', '#D9D7D4');
      }
      
      // 지도 크기 재조정 (약간의 지연을 두고)
      setTimeout(() => {
        if (map.current) {
          map.current.resize();
        }
      }, 100);

      // 한국어 라벨 설정 - 더 확실한 방법으로 시도
      if (map.current) {
        const mapInstance = map.current;

        const setKoreanLabels = () => {
          // 현재 지도 스타일의 모든 레이어 확인
          const style = mapInstance.getStyle();
          if (!style || !style.layers) return;

          style.layers.forEach((layer: mapboxgl.Layer) => {
            if (layer.layout && "text-field" in layer.layout) {
              try {
                const currentTextField = layer.layout["text-field"];

                // 더 넓은 범위로 체크 - 문자열이거나 배열 형태의 텍스트 필드
                let shouldUpdate = false;

                if (typeof currentTextField === "string") {
                  // 문자열 형태의 텍스트 필드
                  if (
                    currentTextField.includes("{name}") ||
                    currentTextField.includes("name")
                  ) {
                    shouldUpdate = true;
                  }
                } else if (Array.isArray(currentTextField)) {
                  // 배열 형태의 텍스트 필드에서 name 관련 필드 찾기
                  const textFieldStr = JSON.stringify(currentTextField);
                  if (
                    textFieldStr.includes("name") &&
                    !textFieldStr.includes("name:ko") &&
                    !textFieldStr.includes("name_ko")
                  ) {
                    shouldUpdate = true;
                  }
                }

                if (shouldUpdate) {
                  mapInstance.setLayoutProperty(layer.id, "text-field", [
                    "coalesce",
                    ["get", "name:ko"],
                    ["get", "name_ko"],
                    ["get", "name_kr"],
                    ["get", "name"],
                  ]);
                }
              } catch {}
            }
          });
        };

        // 초기 로드 후 한 번만 시도
        setTimeout(() => {
          setKoreanLabels();
        }, 1000);

        // 스타일 변경 시에도 다시 적용 (이미 충분함)
        mapInstance.on("styledata", () => {
          setTimeout(setKoreanLabels, 500);
        });
      }

      setIsLoaded(true);
      if (onMapLoad && map.current) {
        onMapLoad(map.current);
      }
    });

    // 오류 처리
    map.current.on("error", (e) => {
      console.error("MapboxMap - error:", e);
    });

    // 기본 위치 컨트롤 제거 - 커스텀 버튼으로 대체

    // 윈도우 크기 변경 시 지도 크기 조정
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]); // 지도는 한 번만 생성하면 됨

  return (
    <div
      className={`relative ${className}`}
      style={{ width: "100%", height: "100%" }}
    >
      <div
        ref={mapContainer}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          background: "#D9D7D4", // 지도 배경색과 동일하게 설정
        }}
      />

      {/* 로딩 오버레이 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#D9D7D4' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">지도 로딩 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// React.memo로 불필요한 re-render 방지
export const MapboxMap = memo(MapboxMapComponent);
