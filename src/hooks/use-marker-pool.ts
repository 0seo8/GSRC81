import { useRef, useCallback } from "react";
import { type Map } from "mapbox-gl";

interface MarkerPool {
  available: HTMLElement[];
  inUse: Map<string, HTMLElement>;
}

export function useMarkerPool() {
  const poolRef = useRef<MarkerPool>({
    available: [],
    inUse: new Map(),
  });

  // 마커 생성 또는 재사용
  const acquireMarker = useCallback((courseId: string): HTMLElement => {
    const pool = poolRef.current;
    
    // 이미 사용 중인 마커가 있으면 반환
    if (pool.inUse.has(courseId)) {
      return pool.inUse.get(courseId)!;
    }

    // 풀에서 마커 가져오기 또는 새로 생성
    let marker = pool.available.pop();
    if (!marker) {
      marker = createMarkerElement();
    }

    pool.inUse.set(courseId, marker);
    return marker;
  }, []);

  // 마커 해제 및 풀로 반환
  const releaseMarker = useCallback((courseId: string) => {
    const pool = poolRef.current;
    const marker = pool.inUse.get(courseId);
    
    if (marker) {
      // 마커 스타일 초기화
      resetMarkerStyle(marker);
      pool.inUse.delete(courseId);
      pool.available.push(marker);
    }
  }, []);

  // 모든 마커 해제
  const releaseAllMarkers = useCallback(() => {
    const pool = poolRef.current;
    
    pool.inUse.forEach((marker, courseId) => {
      resetMarkerStyle(marker);
      pool.available.push(marker);
    });
    
    pool.inUse.clear();
  }, []);

  // 풀 정리
  const clearPool = useCallback(() => {
    const pool = poolRef.current;
    pool.available.length = 0;
    pool.inUse.clear();
  }, []);

  return {
    acquireMarker,
    releaseMarker,
    releaseAllMarkers,
    clearPool,
    getPoolStats: () => ({
      available: poolRef.current.available.length,
      inUse: poolRef.current.inUse.size,
    }),
  };
}

function createMarkerElement(): HTMLElement {
  const marker = document.createElement("div");
  marker.className = "course-marker";
  marker.style.cssText = `
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #3B82F6;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    cursor: pointer;
    transition: all 0.2s ease;
  `;
  return marker;
}

function resetMarkerStyle(marker: HTMLElement): void {
  marker.style.background = "#3B82F6";
  marker.style.transform = "scale(1)";
  marker.style.zIndex = "1";
  marker.className = "course-marker";
}