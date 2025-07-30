"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { supabase } from "@/lib/supabase";

interface Course {
  id: string;
  title: string;
  description: string;
  start_latitude: number;
  start_longitude: number;
  finish_latitude?: number;
  finish_longitude?: number;
  distance_km: number;
  difficulty: "easy" | "medium" | "hard";
  avg_time_min: number;
  gpx_data?: string;
  is_active: boolean;
  created_at: string;
}

interface CourseDetailMapProps {
  courseId: string;
  className?: string;
}

export function CourseDetailMap({ courseId, className = "" }: CourseDetailMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);

  // Mapbox 토큰
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // 지도 초기화
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [126.9185, 37.6361], // 기본 중심점
      zoom: 14,
    });

    map.current.on("load", () => {
      console.log("Map loaded, loading course route...");
      loadCourseRoute();
    });

    return () => {
      map.current?.remove();
    };
  }, [courseId, mapboxToken]);

  const loadCourseRoute = async () => {
    if (!map.current) return;

    try {
      // 코스 포인트 데이터 가져오기
      const { data: points, error } = await supabase
        .from("course_points")
        .select("*")
        .eq("course_id", courseId)
        .order("seq", { ascending: true });

      if (error) throw error;

      if (!points || points.length === 0) {
        console.log("코스 포인트가 없습니다.");
        setLoading(false);
        return;
      }

      console.log(`Found ${points.length} course points`);

      // 경로 좌표 배열 생성
      const coordinates = points.map(point => [point.lng, point.lat]);
      
      // 지도 중심을 경로에 맞춤
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach(coord => bounds.extend(coord as [number, number]));
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 16 });

      // 기존 소스와 레이어 제거
      if (map.current.getSource("course-route")) {
        if (map.current.getLayer("course-line")) {
          map.current.removeLayer("course-line");
        }
        if (map.current.getLayer("course-line-outline")) {
          map.current.removeLayer("course-line-outline");
        }
        map.current.removeSource("course-route");
      }

      // 경로 소스 추가
      map.current.addSource("course-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
        },
        lineMetrics: true,
      });

      // 경로 라인 외곽선 (흰색)
      map.current.addLayer({
        id: "course-line-outline",
        type: "line",
        source: "course-route",
        paint: {
          "line-color": "#ffffff",
          "line-width": 8,
          "line-opacity": 0.6,
        },
      });

      // 경로 라인 (청록색)
      map.current.addLayer({
        id: "course-line",
        type: "line",
        source: "course-route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#22d3ee", // 청록색
          "line-width": 6,
          "line-opacity": 0.8,
        },
      });

      // 시작점 마커 (초록색) - RealMapView 스타일 사용
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat([points[0].lng, points[0].lat])
        .setPopup(new mapboxgl.Popup().setHTML('<div class="font-semibold">🏃‍♂️ 시작점</div>'))
        .addTo(map.current);

      // 끝점 마커 (빨간색) - RealMapView 스타일 사용
      const lastPoint = points[points.length - 1];
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([lastPoint.lng, lastPoint.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<div class="font-semibold">🏁 도착점</div>'))
        .addTo(map.current);

      setLoading(false);

    } catch (error) {
      console.error("코스 경로 로드 실패:", error);
    }
  };

  if (!mapboxToken) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-600">지도를 표시할 수 없습니다.</p>
        <p className="text-sm text-gray-500 mt-1">Mapbox 토큰이 설정되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: "300px" }}
      />
      
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">지도 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 지도 상단에 메모 안내 텍스트 */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 shadow-sm">
        <p className="text-xs text-gray-600">지도를 클릭해서 메모를 남겨보세요</p>
      </div>
    </div>
  );
}