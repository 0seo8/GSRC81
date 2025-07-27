"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface Course {
  id: string;
  title: string;
  start_latitude: number;
  start_longitude: number;
  distance_km: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CourseMarkerProps {
  map: mapboxgl.Map;
  courses: Course[];
  onCourseClick?: (course: Course) => void;
}

export function CourseMarker({ map, courses, onCourseClick }: CourseMarkerProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map || !courses.length) return;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // 새 마커 추가
    courses.forEach(course => {
      // 난이도별 색상
      const colors = {
        easy: '#10b981',    // 초록
        medium: '#f59e0b',  // 노랑
        hard: '#ef4444'     // 빨강
      };

      // 마커 엘리먼트 생성
      const markerElement = document.createElement('div');
      markerElement.className = 'course-marker';
      markerElement.style.cssText = `
        width: 24px;
        height: 24px;
        background-color: ${colors[course.difficulty]};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: transform 0.2s ease;
      `;

      // 호버 효과
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      // 클릭 이벤트
      markerElement.addEventListener('click', () => {
        if (onCourseClick) {
          onCourseClick(course);
        }
      });

      // 마커 생성 및 추가
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([course.start_longitude, course.start_latitude])
        .addTo(map);

      // 팝업 추가
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false
      }).setHTML(`
        <div class="text-sm">
          <div class="font-semibold text-gray-900">${course.title}</div>
          <div class="text-gray-600">${course.distance_km}km</div>
          <div class="text-xs text-gray-500 capitalize">${course.difficulty}</div>
        </div>
      `);

      marker.setPopup(popup);

      // 마커 배열에 저장
      markersRef.current.push(marker);
    });

    return () => {
      // 컴포넌트 언마운트 시 마커 제거
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [map, courses, onCourseClick]);

  return null;
}