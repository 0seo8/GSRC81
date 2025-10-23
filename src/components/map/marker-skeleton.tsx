"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface MarkerSkeletonProps {
  map: mapboxgl.Map;
  positions: Array<{
    lat: number;
    lng: number;
  }>;
  isLoading: boolean;
}

export function MarkerSkeleton({
  map,
  positions,
  isLoading,
}: MarkerSkeletonProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    // 기존 마커들 정리
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // 로딩 상태가 아니거나 조건이 맞지 않으면 early return
    if (!map || !isLoading || positions.length === 0) {
      return;
    }

    // CSS 애니메이션 추가 (한 번만)
    if (!document.querySelector("#skeleton-animation-style")) {
      const style = document.createElement("style");
      style.id = "skeleton-animation-style";
      style.textContent = `
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
        
        .marker-skeleton {
          animation: skeleton-loading 1.5s infinite, skeleton-pulse 2s infinite;
        }
      `;
      document.head.appendChild(style);
    }

    // 새로운 스켈레톤 마커 생성
    const newMarkers = positions.map((pos) => {
      const skeletonElement = document.createElement("div");
      skeletonElement.className = "marker-skeleton";

      // 스켈레톤 스타일
      skeletonElement.style.cssText = `
        width: 40px;
        height: 40px;
        background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
        background-size: 200% 100%;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        position: absolute;
        transform: translate(-50%, -50%);
        opacity: 0.8;
      `;

      const marker = new mapboxgl.Marker({
        element: skeletonElement,
        anchor: "center",
      })
        .setLngLat([pos.lng, pos.lat])
        .addTo(map);

      return marker;
    });

    markersRef.current = newMarkers;

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [map, isLoading, positions]);

  // 컴포넌트 언마운트시 정리
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove());
    };
  }, []);

  return null;
}
