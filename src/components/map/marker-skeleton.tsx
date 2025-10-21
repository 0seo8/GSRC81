"use client";

import { useEffect, useState } from "react";
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
  const [skeletonMarkers, setSkeletonMarkers] = useState<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map || !isLoading || positions.length === 0) {
      // 로딩이 끝나면 스켈레톤 제거
      skeletonMarkers.forEach((marker) => marker.remove());
      setSkeletonMarkers([]);
      return;
    }

    // 기존 스켈레톤 제거
    skeletonMarkers.forEach((marker) => marker.remove());

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
        animation: skeleton-loading 1.5s infinite;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        position: absolute;
        transform: translate(-50%, -50%);
        opacity: 0.8;
      `;

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

      const marker = new mapboxgl.Marker({
        element: skeletonElement,
        anchor: "center",
      })
        .setLngLat([pos.lng, pos.lat])
        .addTo(map);

      return marker;
    });

    setSkeletonMarkers(newMarkers);

    // Cleanup
    return () => {
      newMarkers.forEach((marker) => marker.remove());
    };
  }, [map, isLoading, positions, skeletonMarkers]);

  return null;
}
