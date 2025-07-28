"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

interface MapboxMapProps {
  accessToken: string;
  center?: [number, number];
  zoom?: number;
  style?: string;
  className?: string;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

export function MapboxMap({
  accessToken,
  center = [126.9784, 37.5665], // 서울 중심
  zoom = 10, // 서울 전체가 보이도록 줌 레벨 조정
  style = "mapbox://styles/mapbox/streets-v12", // 일반 지도를 기본으로
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

    // 컨테이너 크기 확인
    const containerWidth = mapContainer.current.clientWidth;
    const containerHeight = mapContainer.current.clientHeight;
    console.log("MapboxMap - initializing with size:", containerWidth, "x", containerHeight);

    // 지도 생성
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
      pitch: 0,
      bearing: 0,
      antialias: true,
      maxZoom: 16, // 최대 줌 제한 (너무 확대되지 않게)
      minZoom: 10, // 최소 줌 제한 (서울 전체가 보이는 정도)
      preserveDrawingBuffer: true, // 캔버스 캡처를 위해 필요
    });

    // 지도 로드 완료 시
    map.current.on("load", () => {
      console.log("MapboxMap - map loaded successfully");
      console.log(
        "MapboxMap - map container size:",
        mapContainer.current?.clientWidth,
        "x",
        mapContainer.current?.clientHeight
      );
      
      // 지도 크기 재조정 (약간의 지연을 두고)
      setTimeout(() => {
        if (map.current) {
          map.current.resize();
          console.log("MapboxMap - resized after load");
        }
      }, 100);
      
      setIsLoaded(true);
      if (onMapLoad && map.current) {
        console.log("MapboxMap - calling onMapLoad");
        onMapLoad(map.current);
      }
    });

    // 지도 렌더링 완료 시 (필요시에만 로그)
    // map.current.on('render', () => {
    //   console.log('MapboxMap - map rendered');
    // });

    // 오류 처리
    map.current.on("error", (e) => {
      console.error("MapboxMap - error:", e);
    });

    // 컨트롤 추가
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    // 위치 컨트롤 추가
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right"
    );

    // 윈도우 크기 변경 시 지도 크기 조정
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // 필요한 의존성 추가

  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      <div
        ref={mapContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          background: "#f3f4f6", // 임시 배경색으로 컨테이너 확인
        }}
      />

      {/* 로딩 오버레이 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">지도 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 지도 스타일 선택 버튼 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col">
          <button
            onClick={() => map.current?.setStyle("mapbox://styles/mapbox/streets-v12")}
            className="px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            일반
          </button>
          <button
            onClick={() => map.current?.setStyle("mapbox://styles/mapbox/satellite-v9")}
            className="px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            위성
          </button>
          <button
            onClick={() => map.current?.setStyle("mapbox://styles/mapbox/outdoors-v12")}
            className="px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            아웃도어
          </button>
          <button
            onClick={() => map.current?.setStyle("mapbox://styles/mapbox/light-v11")}
            className="px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            라이트
          </button>
          <button
            onClick={() => map.current?.setStyle("mapbox://styles/mapbox/dark-v11")}
            className="px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            다크
          </button>
        </div>
      </div>
    </div>
  );
}
