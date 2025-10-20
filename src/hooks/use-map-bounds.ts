"use client";

import { useCallback, useEffect } from "react";
import { type CourseWithComments } from "@/lib/courses-data";

export function useMapBounds(
  map: mapboxgl.Map | null,
  courses: CourseWithComments[],
) {
  // 코스들의 좌표 범위에 맞춰 지도 범위 설정
  const fitMapToCourses = useCallback(() => {
    if (!map) return;

    // 코스가 없을 때는 기본 위치(은평구)로 이동
    if (courses.length === 0) {
      map.flyTo({
        center: [126.9285, 37.6176], // 은평구 중심 좌표
        zoom: 11.5,
        duration: 1000,
      });
      return;
    }

    const coordinates: [number, number][] = courses.map((course) => [
      course.start_longitude,
      course.start_latitude,
    ]);

    if (coordinates.length === 0) return;

    // 좌표들의 경계 계산
    const lngs = coordinates.map((coord) => coord[0]);
    const lats = coordinates.map((coord) => coord[1]);

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // 코스 외각 기준으로 적절한 여백 추가 (전체 범위의 15%)
    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;
    const lngPadding = Math.max(lngRange * 0.15, 0.01); // 최소 패딩 보장
    const latPadding = Math.max(latRange * 0.15, 0.01);

    const bounds: [[number, number], [number, number]] = [
      [minLng - lngPadding, minLat - latPadding],
      [maxLng + lngPadding, maxLat + latPadding],
    ];

    // 단일 지점인 경우
    if (coordinates.length === 1) {
      map.flyTo({
        center: coordinates[0],
        zoom: 11.5, // 줌 범위 10-12.85 내에서 적절한 레벨
        duration: 1000,
      });
    } else {
      // 여러 지점인 경우 - 줌 범위 제한 적용
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 12.5, // 사용자 요구사항에 따른 최대 줌 제한
        duration: 1000,
      });
    }
  }, [map, courses]);

  // 지도가 로드되면 코스 데이터에 따라 범위 조정 (빈 카테고리 포함)
  useEffect(() => {
    if (map) {
      fitMapToCourses();
    }
  }, [map, courses, fitMapToCourses]);

  return { fitMapToCourses };
}
