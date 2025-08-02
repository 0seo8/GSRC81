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

interface CourseCluster {
  id: string;
  courses: Course[];
  center_lat: number;
  center_lng: number;
  count: number;
}

interface CourseMarkerProps {
  map: mapboxgl.Map;
  courses: Course[];
  onCourseClick?: (course: Course) => void;
  onClusterClick?: (courses: Course[]) => void;
}

let effectCallCount = 0;

// 두 지점 간 거리 계산 (Haversine formula)
function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 클러스터링 완전히 비활성화
function getClusterDistance(zoom: number): number {
  // 클러스터링 없음 - 모든 점을 개별적으로 표시
  return 0;
}

export function CourseMarker({
  map,
  courses,
  onCourseClick,
  onClusterClick,
}: CourseMarkerProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const styleLoadHandlerRef = useRef<(() => void) | null>(null);
  // 줌 레벨 고정 (클러스터링이 일정하므로 불필요)

  // 코스들을 클러스터링하는 함수
  function clusterCourses(
    courses: Course[],
    maxDistance: number
  ): CourseCluster[] {
    if (maxDistance === 0) {
      // 클러스터링 없음 - 각 코스를 개별 클러스터로 처리
      return courses.map((course) => ({
        id: course.id,
        courses: [course],
        center_lat: course.start_latitude,
        center_lng: course.start_longitude,
        count: 1,
      }));
    }

    const clusters: CourseCluster[] = [];
    const used = new Set<string>();

    courses.forEach((course) => {
      if (used.has(course.id)) return;

      const cluster: CourseCluster = {
        id: `cluster-${course.id}`,
        courses: [course],
        center_lat: course.start_latitude,
        center_lng: course.start_longitude,
        count: 1,
      };

      used.add(course.id);

      // 다른 코스들과 거리 비교하여 클러스터에 추가
      courses.forEach((otherCourse) => {
        if (used.has(otherCourse.id)) return;

        const distance = getDistanceInMeters(
          course.start_latitude,
          course.start_longitude,
          otherCourse.start_latitude,
          otherCourse.start_longitude
        );

        if (distance <= maxDistance) {
          cluster.courses.push(otherCourse);
          used.add(otherCourse.id);
          cluster.count++;
        }
      });

      // 클러스터 중심점 재계산 (평균 좌표)
      if (cluster.courses.length > 1) {
        const avgLat =
          cluster.courses.reduce((sum, c) => sum + c.start_latitude, 0) /
          cluster.courses.length;
        const avgLng =
          cluster.courses.reduce((sum, c) => sum + c.start_longitude, 0) /
          cluster.courses.length;
        cluster.center_lat = avgLat;
        cluster.center_lng = avgLng;
      }

      clusters.push(cluster);
    });

    return clusters;
  }

  // Mapbox 마커는 자동으로 지도와 동기화됨

  // 마커 렌더링 및 클러스터링
  useEffect(() => {
    effectCallCount++;

    if (!map || !courses.length) {
      return;
    }

    const addMarkersNow = () => {
      // 기존 마커 제거
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // 고정된 클러스터링 거리 사용
      const clusterDistance = getClusterDistance(0); // 줌 레벨 무관

      // 코스 클러스터링
      const clusters = clusterCourses(courses, clusterDistance);

      // 클러스터별 마커 생성
      clusters.forEach((cluster) => {
        const isCluster = cluster.count > 1;

        // 마커 엘리먼트 생성
        const markerElement = document.createElement("div");
        markerElement.className = isCluster
          ? "course-cluster-marker"
          : "course-marker";

        if (isCluster) {
          // 클러스터 마커 스타일
          markerElement.style.cssText = `
            width: 50px;
            height: 50px;
            background-color: #1f2937;
            border: 4px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 6px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            color: white;
            position: absolute;
            transform: translate(-50%, -50%);
          `;
          markerElement.textContent = cluster.count.toString();
        } else {
          // 개별 마커 스타일
          const colors = {
            easy: "#6b7280", // 그레이
            medium: "#4b5563", // 다크 그레이
            hard: "#374151", // 더 다크 그레이
          };
          const course = cluster.courses[0];

          markerElement.style.cssText = `
            width: 40px;
            height: 40px;
            background-color: ${colors[course.difficulty]};
            border: 4px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 6px 12px rgba(0,0,0,0.4);
            position: absolute;
            transform: translate(-50%, -50%);
            display: block !important;
            visibility: visible !important;
          `;
        }

        // 클릭 이벤트
        markerElement.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          if (isCluster) {
            // 클러스터 클릭 - 코스 리스트 표시
            if (onClusterClick) {
              onClusterClick(cluster.courses);
            }
          } else {
            // 개별 마커 클릭
            if (onCourseClick) {
              onCourseClick(cluster.courses[0]);
            }
          }
        });

        try {
          // 마커 생성 및 추가 (anchor를 center로 설정)
          const marker = new mapboxgl.Marker({
            element: markerElement,
            draggable: false,
            anchor: "center",
          })
            .setLngLat([cluster.center_lng, cluster.center_lat])
            .addTo(map);

          markersRef.current.push(marker);
        } catch (error) {
          console.error("❌ Error adding marker:", error);
        }
      });
    };

    // map이 완전히 로드되었는지 확인
    if (!map.isStyleLoaded()) {
      // 기존 핸들러 제거
      if (styleLoadHandlerRef.current) {
        map.off("styledata", styleLoadHandlerRef.current);
      }

      // 새 핸들러 생성 및 저장
      styleLoadHandlerRef.current = () => {
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
  }, [map, courses, onCourseClick, onClusterClick]);

  return null;
}
