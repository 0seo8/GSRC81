"use client";

import { useCallback, useEffect, useRef } from "react";
import { type CourseWithCategory } from "@/lib/supabase/repositories/courseRepository";
import {
  EUNPYEONG_CENTER,
  DEFAULT_ZOOM,
  FLY_TO_DURATION,
  FIT_BOUNDS_CONFIG,
} from "@/core/config/map";

/**
 * 디바운스된 함수 호출
 * 빠른 카테고리 전환 시 마지막 변경에만 반응하도록 함
 */
function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // 콜백 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 클린업
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay],
  );
}

export function useMapBounds(
  map: mapboxgl.Map | null,
  courses: CourseWithCategory[],
) {
  // 코스들의 좌표 범위에 맞춰 지도 범위 설정
  const fitMapToCourses = useCallback(() => {
    if (!map) return;

    // 코스가 없을 때는 기본 위치(은평구)로 이동
    if (courses.length === 0) {
      map.flyTo({
        center: EUNPYEONG_CENTER,
        zoom: DEFAULT_ZOOM,
        duration: FLY_TO_DURATION,
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

    // 코스 외각 기준으로 적절한 여백 추가
    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;
    const lngPadding = Math.max(
      lngRange * FIT_BOUNDS_CONFIG.PADDING_RATIO,
      FIT_BOUNDS_CONFIG.MIN_PADDING,
    );
    const latPadding = Math.max(
      latRange * FIT_BOUNDS_CONFIG.PADDING_RATIO,
      FIT_BOUNDS_CONFIG.MIN_PADDING,
    );

    const bounds: [[number, number], [number, number]] = [
      [minLng - lngPadding, minLat - latPadding],
      [maxLng + lngPadding, maxLat + latPadding],
    ];

    // 단일 지점인 경우
    if (coordinates.length === 1) {
      map.flyTo({
        center: coordinates[0],
        zoom: DEFAULT_ZOOM,
        duration: FLY_TO_DURATION,
      });
    } else {
      // 여러 지점인 경우 - 줌 범위 제한 적용
      const uiPadding = FIT_BOUNDS_CONFIG.UI_PADDING;
      map.fitBounds(bounds, {
        padding: { top: uiPadding, bottom: uiPadding, left: uiPadding, right: uiPadding },
        maxZoom: FIT_BOUNDS_CONFIG.MAX_ZOOM,
        duration: FLY_TO_DURATION,
      });
    }
  }, [map, courses]);

  // 디바운스된 fitBounds 호출 (150ms)
  // 빠른 카테고리 전환 시 마지막 변경에만 반응
  const debouncedFitMapToCourses = useDebouncedCallback(fitMapToCourses, 150);

  // 지도가 로드되고 코스 데이터가 변경될 때마다 범위 조정
  // 카테고리 변경 시 해당 카테고리의 코스들을 보여주도록 자동 이동
  useEffect(() => {
    if (map) {
      debouncedFitMapToCourses();
    }
  }, [map, courses, debouncedFitMapToCourses]);

  return { fitMapToCourses };
}
