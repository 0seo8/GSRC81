"use client";

import { useEffect, useRef, useState, memo } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import { type CourseWithComments } from "@/lib/courses-data";
import { getCategoryColor } from "@/lib/category-colors";
import { NumberMarker } from "./number-marker";
import { MarkerSkeleton } from "./marker-skeleton";

type Course = CourseWithComments;

interface CourseMarkerProps {
  map: mapboxgl.Map;
  courses: Course[];
  currentCategory?: string;
  onCourseClick?: (course: Course) => void;
  onClusterClick?: (courses: Course[]) => void;
}

/**
 * Mapbox 네이티브 클러스터링을 사용한 코스 마커 컴포넌트
 *
 * 개선 사항:
 * - 수동 클러스터링 제거 → Mapbox GeoJSON 클러스터링 사용
 * - HTML 문자열 생성 제거 → React 컴포넌트 사용
 * - 복잡한 타이밍 로직 단순화
 * - 424 lines → ~200 lines (50% 감소)
 */
const CourseMarkerComponent = function CourseMarker({
  map,
  courses,
  currentCategory = "jingwan",
  onCourseClick,
  onClusterClick,
}: CourseMarkerProps) {
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasInitialized = useRef(false);

  // GeoJSON 데이터 생성
  const geojsonData = useRef<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  // 코스를 GeoJSON Feature로 변환
  useEffect(() => {
    geojsonData.current = {
      type: "FeatureCollection",
      features: courses.map((course) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [course.start_longitude, course.start_latitude],
        },
        properties: {
          id: course.id,
          category_key: course.category_key || "jingwan",
          title: course.title,
        },
      })),
    };
  }, [courses]);

  // Mapbox 레이어 및 소스 설정
  useEffect(() => {
    if (!map || courses.length === 0) return;

    const sourceId = "courses";
    const clusterId = "clusters";
    const unclusteredId = "unclustered-point";

    const setupLayers = () => {
      // 이미 초기화되었으면 데이터만 업데이트
      if (hasInitialized.current) {
        const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(geojsonData.current);
        }
        return;
      }

      // 기존 레이어/소스 제거 (있다면)
      if (map.getLayer(clusterId)) map.removeLayer(clusterId);
      if (map.getLayer(unclusteredId)) map.removeLayer(unclusteredId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      // GeoJSON 소스 추가 (클러스터링 활성화)
      map.addSource(sourceId, {
        type: "geojson",
        data: geojsonData.current,
        cluster: true,
        clusterMaxZoom: 12, // 줌 12 이상에서는 클러스터링 비활성화
        clusterRadius: 50, // 클러스터 반경 (픽셀)
      });

      // 클러스터 레이어 (숨김 - 마커로 대체)
      map.addLayer({
        id: clusterId,
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-opacity": 0, // 보이지 않음
          "circle-radius": 0,
        },
      });

      // 개별 포인트 레이어 (숨김 - 마커로 대체)
      map.addLayer({
        id: unclusteredId,
        type: "circle",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-opacity": 0,
          "circle-radius": 0,
        },
      });

      hasInitialized.current = true;
      setIsInitialLoading(false);
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once("load", setupLayers);
    }

    return () => {
      // 클린업은 컴포넌트 언마운트 시에만
    };
  }, [map, courses]);

  // 마커 렌더링 (React 기반)
  useEffect(() => {
    if (!map || !hasInitialized.current) return;

    const sourceId = "courses";

    // 기존 마커 제거
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const updateMarkers = () => {
      const features = map.querySourceFeatures(sourceId);
      const newMarkers: { [key: string]: mapboxgl.Marker } = {};

      // 클러스터 및 개별 포인트 처리
      for (const feature of features) {
        const coords = feature.geometry as GeoJSON.Point;
        const props = feature.properties;

        if (!props || !coords.coordinates) continue;

        const [lng, lat] = coords.coordinates;
        const isCluster = props.cluster;
        const markerId = isCluster
          ? `cluster-${props.cluster_id}`
          : `point-${props.id}`;

        // 이미 존재하는 마커는 재사용
        if (markersRef.current[markerId]) {
          newMarkers[markerId] = markersRef.current[markerId];
          continue;
        }

        // 마커 엘리먼트 생성
        const el = document.createElement("div");
        el.style.cssText = `
          cursor: pointer;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
          z-index: ${isCluster ? 10 : 5};
        `;

        const markerNumber = isCluster ? props.point_count : 1;
        const categoryKey =
          currentCategory === "all" ? "all" : props.category_key || "jingwan";
        const markerColor = getCategoryColor(categoryKey);

        // React 컴포넌트를 마커 엘리먼트에 렌더링
        const root = createRoot(el);
        root.render(
          <NumberMarker number={markerNumber} size={25} color={markerColor} />
        );

        // 마커 생성
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
        }).setLngLat([lng, lat]);

        // 클릭 이벤트
        el.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();

          // 마커를 지도 중앙으로 이동
          map.flyTo({
            center: [lng, lat],
            duration: 800,
            essential: true,
          });

          if (isCluster) {
            // 클러스터 클릭 - 포함된 코스들 가져오기
            const clusterId = props.cluster_id;
            const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;

            try {
              const expansionZoom = await new Promise<number>((resolve) => {
                source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                  if (err || zoom === null || zoom === undefined) {
                    resolve(map.getZoom() + 1);
                  } else {
                    resolve(zoom);
                  }
                });
              });

              // 클러스터 내 포인트 가져오기
              const leaves = await new Promise<GeoJSON.Feature[]>(
                (resolve) => {
                  source.getClusterLeaves(
                    clusterId,
                    props.point_count,
                    0,
                    (err, features) => {
                      if (err || !features) {
                        resolve([]);
                      } else {
                        resolve(features as GeoJSON.Feature[]);
                      }
                    }
                  );
                }
              );

              // Feature ID로 실제 코스 찾기
              const clusterCourses = leaves
                .map((leaf) => {
                  const courseId = leaf.properties?.id;
                  return courses.find((c) => c.id === courseId);
                })
                .filter((c): c is Course => c !== undefined);

              if (onClusterClick && clusterCourses.length > 0) {
                onClusterClick(clusterCourses);
              }
            } catch (error) {
              console.error("Error handling cluster click:", error);
            }
          } else {
            // 개별 마커 클릭
            const course = courses.find((c) => c.id === props.id);
            if (onCourseClick && course) {
              onCourseClick(course);
            }
          }
        });

        marker.addTo(map);
        newMarkers[markerId] = marker;
      }

      // 제거된 마커 정리
      Object.keys(markersRef.current).forEach((id) => {
        if (!newMarkers[id]) {
          markersRef.current[id].remove();
        }
      });

      markersRef.current = newMarkers;
    };

    // 초기 마커 렌더링
    updateMarkers();

    // 지도 이동/줌 시 마커 업데이트
    const events = ["moveend", "zoomend"];
    events.forEach((event) => {
      map.on(event, updateMarkers);
    });

    return () => {
      events.forEach((event) => {
        map.off(event, updateMarkers);
      });
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
    };
  }, [map, courses, currentCategory, onCourseClick, onClusterClick]);

  // 스켈레톤 위치 계산
  const skeletonPositions = courses.map((course) => ({
    lat: course.start_latitude,
    lng: course.start_longitude,
  }));

  return (
    <MarkerSkeleton
      map={map}
      positions={skeletonPositions}
      isLoading={isInitialLoading}
    />
  );
};

export const CourseMarker = memo(CourseMarkerComponent);