"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface GraphicOverlayProps {
  map: mapboxgl.Map | null;
  graphicImageUrl?: string; // 디자이너가 제작한 그래픽 이미지 URL
  opacity?: number;
}

export function GraphicOverlay({
  map,
  graphicImageUrl = "/images/seoul-graphic-map.png", // 기본 이미지 경로
  opacity = 0.8,
}: GraphicOverlayProps) {
  const [overlayStyle, setOverlayStyle] = useState({
    transform: "translate(0px, 0px) scale(1)",
    opacity: opacity,
  });

  useEffect(() => {
    if (!map) return;

    const updateOverlay = () => {
      // 지도의 현재 변환 상태 가져오기
      const zoom = map.getZoom();
      const center = map.getCenter();
      const bearing = map.getBearing();

      // 기준점 (은평구 중심) 대비 계산
      const baseZoom = 12;
      const baseCenter = { lng: 126.9227, lat: 37.6176 };

      // 줌 스케일 계산
      const scale = Math.pow(2, zoom - baseZoom);

      // 중심점 이동 계산 (픽셀 단위)
      const lngDiff = center.lng - baseCenter.lng;
      const latDiff = center.lat - baseCenter.lat;

      // 픽셀 좌표로 변환 (대략적인 변환)
      const pixelX =
        (lngDiff * 111320 * Math.cos((center.lat * Math.PI) / 180)) /
        (156543.03392 / Math.pow(2, zoom));
      const pixelY = (-latDiff * 111320) / (156543.03392 / Math.pow(2, zoom));

      setOverlayStyle({
        transform: `translate(${pixelX}px, ${pixelY}px) scale(${scale}) rotate(${bearing}deg)`,
        opacity: opacity,
      });
    };

    // 초기 설정
    updateOverlay();

    // 지도 변경 시 오버레이 동기화
    map.on("move", updateOverlay);
    map.on("zoom", updateOverlay);
    map.on("rotate", updateOverlay);
    map.on("pitch", updateOverlay);

    return () => {
      map.off("move", updateOverlay);
      map.off("zoom", updateOverlay);
      map.off("rotate", updateOverlay);
      map.off("pitch", updateOverlay);
    };
  }, [map, opacity]);

  if (!map) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{ overflow: "hidden" }}
    >
      <Image
        src={graphicImageUrl}
        alt="Graphic Map Overlay"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          ...overlayStyle,
          transformOrigin: "center center",
          transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
          maxWidth: "none",
          width: "800px", // 기본 크기 (디자이너 이미지에 맞춰 조정)
          height: "auto",
        }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
