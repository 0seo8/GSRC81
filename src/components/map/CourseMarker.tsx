"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface Course {
  id: string;
  title: string;
  description: string;
  start_latitude: number;
  start_longitude: number;
  distance_km: number;
  avg_time_min: number;
  difficulty: "easy" | "medium" | "hard";
  nearest_station: string;
  is_active: boolean;
  created_at: string;
}

interface CourseMarkerProps {
  map: mapboxgl.Map;
  courses: Course[];
  onCourseClick?: (course: Course) => void;
}

let effectCallCount = 0;

export function CourseMarker({
  map,
  courses,
  onCourseClick,
}: CourseMarkerProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const styleLoadHandlerRef = useRef<(() => void) | null>(null);


  useEffect(() => {
    effectCallCount++;
    console.log(`🔄 CourseMarker useEffect CALLED #${effectCallCount} - map:`, !!map, "courses count:", courses.length);
    console.log("🔄 Current courses:", courses.map(c => c.id));

    if (!map || !courses.length) {
      console.log("❌ CourseMarker - early return: map=", !!map, "courses.length=", courses.length);
      return;
    }

    const addMarkersNow = () => {
      // 기존 마커 제거
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      console.log("🎯 addMarkersNow CALLED for", courses.length, "courses");

      // 새 마커 추가
      courses.forEach((course) => {
        console.log(
          "CourseMarker - creating marker for:",
          course.title,
          "at",
          course.start_latitude,
          course.start_longitude
        );
        // 난이도별 색상
        const colors = {
          easy: "#10b981", // 초록
          medium: "#f59e0b", // 노랑
          hard: "#ef4444", // 빨강
        };

        // 마커 엘리먼트 생성
        const markerElement = document.createElement("div");
        markerElement.className = "course-marker";
        markerElement.style.cssText = `
          width: 40px;
          height: 40px;
          background-color: ${colors[course.difficulty]};
          border: 4px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 6px 12px rgba(0,0,0,0.4);
          transition: transform 0.2s ease;
          z-index: 999;
          position: relative;
          display: block !important;
          visibility: visible !important;
        `;
        
        console.log("🎯 Creating marker element for:", course.title, "with color:", colors[course.difficulty]);

        // 호버 효과 제거 - 지도 이동 방지
        // markerElement.addEventListener("mouseenter", () => {
        //   markerElement.style.transform = "scale(1.2)";
        // });

        // markerElement.addEventListener("mouseleave", () => {
        //   markerElement.style.transform = "scale(1)";
        // });

        // 클릭 이벤트 (이벤트 전파 방지)
        markerElement.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onCourseClick) {
            onCourseClick(course);
          }
        });

        try {
          console.log("🎯 Adding marker to map at coordinates:", [course.start_longitude, course.start_latitude]);
          
          // 마커 생성 및 추가 (드래그 비활성화)
          const marker = new mapboxgl.Marker({
            element: markerElement,
            draggable: false // 드래그 완전 비활성화
          })
            .setLngLat([course.start_longitude, course.start_latitude])
            .addTo(map);

          console.log("✅ Marker successfully added for:", course.title);

          // 팝업 제거 - 호버 시 지도 이동 방지
          // const popup = new mapboxgl.Popup({
          //   offset: 25,
          //   closeButton: false,  
          //   closeOnClick: false,
          // }).setHTML(`
          //   <div class="text-sm">
          //     <div class="font-semibold text-gray-900">${course.title}</div>
          //     <div class="text-gray-600">${course.distance_km}km</div>
          //     <div class="text-xs text-gray-500 capitalize">${course.difficulty}</div>
          //   </div>
          // `);
          // marker.setPopup(popup);

          // 마커 배열에 저장
          markersRef.current.push(marker);
          
          console.log("📍 Total markers in array:", markersRef.current.length);
        } catch (error) {
          console.error("❌ CourseMarker - error adding marker:", error);
        }
      });
    };

    // map이 완전히 로드되었는지 확인
    if (!map.isStyleLoaded()) {
      console.log("CourseMarker - map style not loaded yet, waiting...");

      // 기존 핸들러 제거
      if (styleLoadHandlerRef.current) {
        map.off("styledata", styleLoadHandlerRef.current);
      }

      // 새 핸들러 생성 및 저장
      styleLoadHandlerRef.current = () => {
        console.log("CourseMarker - map style loaded, adding markers");
        addMarkersNow();
      };

      map.on("styledata", styleLoadHandlerRef.current);
      return;
    }

    // 이미 로드된 경우 바로 마커 추가
    addMarkersNow();

    return () => {
      // 컴포넌트 언마운트 시 마커 제거
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // 이벤트 리스너 제거
      if (styleLoadHandlerRef.current) {
        map.off("styledata", styleLoadHandlerRef.current);
        styleLoadHandlerRef.current = null;
      }
    };
  }, [map, courses, onCourseClick]);

  return null;
}
