"use client";

import { useEffect, useRef, useState, memo } from "react";
import mapboxgl from "mapbox-gl";
import { type CourseWithComments } from "@/lib/courses-data";
import { MarkerSkeleton } from "./marker-skeleton";

type Course = CourseWithComments;

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
  currentCategory?: string;
  onCourseClick?: (course: Course) => void;
  onClusterClick?: (courses: Course[]) => void;
}

// TODO: 2. 전체맵에서 클러스트 간격을 조절하기.
// 두 지점 간 거리 계산 (Haversine formula)
function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
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

// 줌 레벨에 따른 클러스터링 거리 계산 (10-12.85 범위에 최적화)
function getClusterDistance(zoom: number): number {
  // 줌 범위: 10(최소) ~ 12.85(최대)
  if (zoom >= 12.5) return 0; // 최대 줌에 가까우면 클러스터링 없음
  if (zoom >= 12.0) return 100; // 높은 줌: 100m 이내 클러스터링
  if (zoom >= 11.5) return 200; // 중간 줌: 200m 이내 클러스터링
  if (zoom >= 11.0) return 400; // 중간-낮은 줌: 400m 이내 클러스터링
  if (zoom >= 10.5) return 600; // 낮은 줌: 600m 이내 클러스터링
  return 800; // 최소 줌: 800m 이내 클러스터링
}

const CourseMarkerComponent = function CourseMarker({
  map,
  courses,
  currentCategory = "jingwan",
  onCourseClick,
  onClusterClick,
}: CourseMarkerProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const styleLoadHandlerRef = useRef<(() => void) | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(10);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasMarkersBeenRendered = useRef(false);

  // 줌 레벨 변경 감지
  useEffect(() => {
    if (!map) return;

    // 초기 줌 레벨 설정
    const initialZoom = map.getZoom();
    setZoomLevel(initialZoom);

    // 줌 이벤트 리스너 (debounce 적용)
    let timeoutId: NodeJS.Timeout;
    let isZooming = false;

    const handleZoomStart = () => {
      isZooming = true;
    };

    const handleZoomEnd = () => {
      isZooming = false;
      // 줌이 완료된 후 마커 업데이트
      const newZoom = map.getZoom();
      setZoomLevel(newZoom);
    };

    const handleZoom = () => {
      if (!isZooming) return;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newZoom = map.getZoom();
        setZoomLevel(newZoom);
      }, 100); // 약간 더 긴 debounce로 안정성 향상
    };

    map.on("zoomstart", handleZoomStart);
    map.on("zoomend", handleZoomEnd);
    map.on("zoom", handleZoom);

    return () => {
      clearTimeout(timeoutId);
      map.off("zoomstart", handleZoomStart);
      map.off("zoomend", handleZoomEnd);
      map.off("zoom", handleZoom);
    };
  }, [map]);

  // 코스들을 클러스터링하는 함수 (카테고리별로 클러스터링)
  function clusterCourses(
    courses: Course[],
    maxDistance: number,
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
      const courseCategory = course.category_key || "jingwan";

      // 같은 카테고리의 다른 코스들과 거리 비교하여 클러스터에 추가
      courses.forEach((otherCourse) => {
        if (used.has(otherCourse.id)) return;

        const otherCategory = otherCourse.category_key || "jingwan";

        // 같은 카테고리인지 확인
        if (courseCategory !== otherCategory) return;

        const distance = getDistanceInMeters(
          course.start_latitude,
          course.start_longitude,
          otherCourse.start_latitude,
          otherCourse.start_longitude,
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
    if (!map || !courses.length) {
      return;
    }

    const addMarkersNow = () => {
      // 기존 마커 제거
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // 지도가 완전히 준비되었는지 한번 더 확인
      if (!map.isStyleLoaded()) {
        return;
      }

      // 현재 줌 레벨에 따른 클러스터링 거리 사용
      const clusterDistance = getClusterDistance(zoomLevel);

      // 코스 클러스터링
      const clusters = clusterCourses(courses, clusterDistance);

      // 클러스터별 마커 생성
      // 첫 번째 마커 렌더링 완료 시 초기 로딩 상태 업데이트
      if (!hasMarkersBeenRendered.current) {
        hasMarkersBeenRendered.current = true;
        setIsInitialLoading(false);
      }

      clusters.forEach((cluster) => {
        const isCluster = cluster.count > 1;

        // 카테고리별 마커 색상 결정
        const getCategoryMarkerColor = (categoryKey: string) => {
          switch (categoryKey) {
            case "jingwan":
              return "#78A893"; // 진관동러닝 - 초록색
            case "track":
              return "#D04836"; // 트랙러닝 - 빨간색
            case "trail":
              return "#78A893"; // 트레일러닝 - 초록색
            case "road":
              return "#7A7A7A"; // 로드러닝 - 회색
            case "all":
              return "#000000"; // 전체 카테고리 - 검정색
            default:
              return "#78A893"; // 기본값 (진관동러닝)
          }
        };

        // 클러스터의 대표 카테고리 결정
        // "all" 카테고리일 때는 모든 마커를 검정색으로 통일
        const representativeCategory = currentCategory === "all" 
          ? "all" 
          : (cluster.courses[0]?.category_key || "jingwan");
        const markerColor = getCategoryMarkerColor(representativeCategory);

        // 마커 엘리먼트 생성
        const markerElement = document.createElement("div");
        markerElement.className = isCluster
          ? "course-cluster-marker"
          : "course-marker";

        // NumberMarker를 사용해서 HTML 생성
        const markerNumber = isCluster ? cluster.count : 1;
        const markerSize = 25; // 모든 마커 크기 동일하게 고정

        // NumberMarker 컴포넌트의 HTML을 문자열로 생성
        const markerHeight = (markerSize * 31) / 25;
        markerElement.innerHTML = `
          <div style="position: relative; display: inline-block;">
            <svg width="${markerSize}" height="${markerHeight}" viewBox="0 0 25 31" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.66117 3.66116C8.54272 -1.22039 16.4573 -1.22039 21.3388 3.66116V3.66116C26.2204 8.54271 26.2204 16.4573 21.3388 21.3388L12.5 30.1777L3.66117 21.3388C-1.22039 16.4573 -1.22039 8.54271 3.66117 3.66116V3.66116Z" fill="${markerColor}"/>
            </svg>
            <div style="
              position: absolute; 
              top: 0; 
              left: 0; 
              right: 0; 
              bottom: 0; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: white; 
              font-weight: bold; 
              font-family: Poppins, system-ui, sans-serif;
              font-size: ${markerSize * 0.4}px;
              padding-bottom: ${markerSize * 0.16}px;
            ">
              ${markerNumber}
            </div>
          </div>
        `;

        markerElement.style.cssText = `
          cursor: pointer;
          position: absolute;
          transform: translate(-50%, -100%);
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
          z-index: ${isCluster ? 10 : 5};
          display: block !important;
          visibility: visible !important;
        `;

        // 클릭 이벤트
        markerElement.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          // 마커를 맵의 중앙으로 이동
          map.flyTo({
            center: [cluster.center_lng, cluster.center_lat],
            duration: 800,
            essential: true
          });

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

        // 좌표 유효성 검사
        if (
          !cluster.center_lat ||
          !cluster.center_lng ||
          cluster.center_lat < -90 ||
          cluster.center_lat > 90 ||
          cluster.center_lng < -180 ||
          cluster.center_lng > 180
        ) {
          return;
        }

        // 마커 엘리먼트 검증
        if (!markerElement || !markerElement.style) {
          return;
        }

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
          console.error("Error adding marker:", error);
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
        // 약간의 지연을 두고 마커 추가 (스타일 로드 완료 보장)
        setTimeout(() => {
          if (map.isStyleLoaded()) {
            addMarkersNow();
          }
        }, 100);
      };

      // styledata 이벤트 리스너 추가
      map.on("styledata", styleLoadHandlerRef.current);

      // idle 이벤트도 한번 체크 (지도가 완전히 렌더링된 후)
      map.once("idle", () => {
        if (map.isStyleLoaded()) {
          addMarkersNow();
        }
      });

      return;
    }

    // 이미 로드된 경우에도 약간의 지연 후 마커 추가 (렌더링 안정성)
    setTimeout(() => {
      addMarkersNow();
    }, 50);

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
  }, [map, courses, currentCategory, onCourseClick, onClusterClick, zoomLevel]);

  // 스켈레톤 위치 계산 (코스의 시작점들)
  const skeletonPositions = courses.map((course) => ({
    lat: course.start_latitude,
    lng: course.start_longitude,
  }));

  return (
    <>
      {/* 초기 로딩 시에만 스켈레톤 표시 */}
      <MarkerSkeleton
        map={map}
        positions={skeletonPositions}
        isLoading={isInitialLoading}
      />
    </>
  );
};

// React.memo로 props 변경 시에만 리렌더링
export const CourseMarker = memo(CourseMarkerComponent);
