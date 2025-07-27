"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  center = [126.9227, 37.6176], // 은평구 중심
  zoom = 13,
  style = 'mapbox://styles/mapbox/satellite-v9',
  className = 'w-full h-full',
  onMapLoad
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
      maxZoom: 18,
      minZoom: 10,
    });

    // 지도 로드 완료 시
    map.current.on('load', () => {
      setIsLoaded(true);
      if (onMapLoad && map.current) {
        onMapLoad(map.current);
      }
    });

    // 컨트롤 추가
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    // 위치 컨트롤 추가
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [accessToken]); // onMapLoad 제거하여 무한 루프 방지

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* 로딩 오버레이 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">지도 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 지도 스타일 토글 버튼 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md overflow-hidden">
        <button
          onClick={() => {
            if (map.current) {
              const currentStyle = map.current.getStyle().name;
              const newStyle = currentStyle?.includes('satellite') 
                ? 'mapbox://styles/mapbox/streets-v12'
                : 'mapbox://styles/mapbox/satellite-v9';
              map.current.setStyle(newStyle);
            }
          }}
          className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          위성/일반
        </button>
      </div>
    </div>
  );
}