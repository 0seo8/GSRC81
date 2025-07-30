"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Satellite,
  Map as MapIcon,
  Route,
  Mountain,
  Timer,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  start_latitude: number;
  start_longitude: number;
  distance_km: number;
  difficulty: "easy" | "medium" | "hard";
  avg_time_min: number;
  nearest_station?: string;
  gpx_coordinates?: string; // JSON 문자열로 저장된 좌표 배열
  elevation_gain?: number;
  is_active: boolean;
  created_at: string;
}

interface CourseDetailMapProps {
  courseId: string;
  className?: string;
  showCompactHeader?: boolean;
}

export function CourseDetailMap({
  courseId,
  className = "",
  showCompactHeader = false,
}: CourseDetailMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets">(
    "satellite"
  );

  // Mapbox 토큰
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "쉬움";
      case "medium":
        return "보통";
      case "hard":
        return "어려움";
      default:
        return difficulty;
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Mapbox 토큰 설정
    mapboxgl.accessToken = mapboxToken;

    // 지도 초기화
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style:
        mapStyle === "satellite"
          ? "mapbox://styles/mapbox/satellite-v9"
          : "mapbox://styles/mapbox/streets-v12",
      center: [126.9185, 37.6361], // 기본 중심점
      zoom: 14,
      pitch: 0,
      bearing: 0,
    });

    // 지도 컨트롤 추가
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.current.on("load", () => {
      loadCourseRoute();
    });

    return () => {
      map.current?.remove();
    };
  }, [courseId, mapboxToken]);

  // 지도 스타일 변경
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(
        mapStyle === "satellite"
          ? "mapbox://styles/mapbox/satellite-v9"
          : "mapbox://styles/mapbox/streets-v12"
      );

      map.current.once("styledata", () => {
        loadCourseRoute();
      });
    }
  }, [mapStyle]);

  // 지도 크기 변경 시 resize 호출
  useEffect(() => {
    if (map.current) {
      // 약간의 지연을 두고 resize 호출
      const timer = setTimeout(() => {
        map.current?.resize();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [className]);

  const loadCourseRoute = async () => {
    if (!map.current) return;

    try {
      // 코스 데이터 가져오기
      const { data: courseData, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (error) throw error;

      if (!courseData) {
        setLoading(false);
        return;
      }

      setCourse(courseData);

      let coordinates: number[][];

      // gpx_coordinates가 있으면 사용, 없으면 시작점만 표시
      if (courseData.gpx_coordinates) {
        try {
          const gpxCoords = JSON.parse(courseData.gpx_coordinates);
          coordinates = gpxCoords.map((coord: { lat: number; lng: number }) => [
            coord.lng,
            coord.lat,
          ]);
        } catch (parseError) {
          console.error("GPX 좌표 파싱 오류:", parseError);
          // 파싱 실패 시 시작점만 사용
          coordinates = [
            [courseData.start_longitude, courseData.start_latitude],
          ];
        }
      } else {
        // GPX 데이터가 없으면 시작점만 표시
        coordinates = [[courseData.start_longitude, courseData.start_latitude]];
      }

      // 지도 중심을 경로에 맞춤 (참고 코드 스타일)
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 16,
        duration: 1000, // 부드러운 애니메이션
      });

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

      // 경로 라인 (오렌지색)
      map.current.addLayer({
        id: "course-line",
        type: "line",
        source: "course-route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ff6b35", // 오렌지색 (참고 코드와 동일)
          "line-width": 6,
          "line-opacity": 0.8,
        },
      });

      // 시작점 마커 (초록색) - RealMapView 스타일 사용
      new mapboxgl.Marker({ color: "#22c55e" })
        .setLngLat(coordinates[0] as [number, number])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            '<div class="font-semibold">🏃‍♂️ 시작점</div>'
          )
        )
        .addTo(map.current);

      // 끝점 마커 (빨간색) - 시작점과 다른 경우에만 표시
      const lastPoint = coordinates[coordinates.length - 1];
      const startPoint = coordinates[0];

      // 시작점과 끝점이 다른 경우에만 끝점 마커 표시
      if (lastPoint[0] !== startPoint[0] || lastPoint[1] !== startPoint[1]) {
        new mapboxgl.Marker({ color: "#ef4444" })
          .setLngLat(lastPoint as [number, number])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              '<div class="font-semibold">🏁 도착점</div>'
            )
          )
          .addTo(map.current);
      }

      setLoading(false);
    } catch (error) {
      console.error("코스 경로 로드 실패:", error);
    }
  };

  if (!mapboxToken) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-600">지도를 표시할 수 없습니다.</p>
        <p className="text-sm text-gray-500 mt-1">
          Mapbox 토큰이 설정되지 않았습니다.
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* 간결한 코스 헤더 */}
      {showCompactHeader && course && (
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {course.title}
              </h3>
              <div>{course.description}</div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Route className="w-4 h-4" />
                  <span>{course.distance_km} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mountain className="w-4 h-4" />
                  <span>+{course.elevation_gain || 448}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="w-4 h-4" />
                  <span>
                    {Math.floor(course.avg_time_min / 60)}시간{" "}
                    {course.avg_time_min % 60}분
                  </span>
                </div>
                <div
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 ${getDifficultyColor(
                    course.difficulty
                  )}`}
                >
                  {getDifficultyText(course.difficulty)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 지도 컨테이너 */}
      <div className="relative">
        <div
          ref={mapContainer}
          className="w-full h-full rounded-lg overflow-hidden"
          style={{ minHeight: "400px" }}
        />

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">지도 로딩 중...</p>
            </div>
          </div>
        )}

        {/* 지도 컨트롤 */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {/* 지도 스타일 토글 */}
          <div className="bg-white rounded-md shadow-md overflow-hidden flex">
            <Button
              variant={mapStyle === "satellite" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMapStyle("satellite")}
              className="rounded-none border-0 text-xs px-3 py-1 h-7 flex-1"
            >
              <Satellite className="w-3 h-3 mr-1" />
              위성
            </Button>
            <Button
              variant={mapStyle === "streets" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMapStyle("streets")}
              className="rounded-none border-0 text-xs px-3 py-1 h-7 flex-1"
            >
              <MapIcon className="w-3 h-3 mr-1" />
              일반
            </Button>
          </div>

          {/* 안내 텍스트 */}
          <div className="bg-white bg-opacity-90 rounded-md px-2 py-1 shadow-sm">
            <p className="text-xs text-gray-600">
              🏃‍♂️ 녹색: 시작점 | 🏁 빨간색: 도착점
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
