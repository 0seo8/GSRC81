"use client";

import { useEffect, useRef, useState, memo } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import { type CourseWithComments } from "@/shared/lib/courses-data";
import { getCategoryColor } from "@/core/config/category-colors";
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
  const currentCategoryRef = useRef(currentCategory);
  const coursesRef = useRef(courses);
  const onCourseClickRef = useRef(onCourseClick);
  const onClusterClickRef = useRef(onClusterClick);
  const geojsonDataRef = useRef<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  useEffect(() => {
    coursesRef.current = courses;
    onCourseClickRef.current = onCourseClick;
    onClusterClickRef.current = onClusterClick;
  }, [courses, onCourseClick, onClusterClick]);

  useEffect(() => {
    currentCategoryRef.current = currentCategory;

    if (map && Object.keys(markersRef.current).length > 0) {
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};

      const source = map.getSource("courses") as mapboxgl.GeoJSONSource;
      if (source && geojsonDataRef.current) {
        source.setData(geojsonDataRef.current);
      }
    }
  }, [currentCategory, map]);

  // courses가 변경될 때만 실행
  useEffect(() => {
    if (!map) return;

    const sourceId = "courses";
    const clusterId = "clusters";
    const unclusteredId = "unclustered-point";

    // GeoJSON 데이터 생성 및 ref에 저장
    const geojsonData: GeoJSON.FeatureCollection = {
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
    geojsonDataRef.current = geojsonData;

    const updateMarkers = () => {
      const features = map.querySourceFeatures(sourceId);

      // 현재 화면에 있는 feature ID 수집
      const currentFeatureIds = new Set<string>();
      for (const feature of features) {
        const props = feature.properties;
        if (!props) continue;

        const isCluster = props.cluster;
        const featureId = isCluster
          ? `cluster-${props.cluster_id}`
          : `point-${props.id}`;
        currentFeatureIds.add(featureId);
      }

      // 화면에 없는 마커 제거
      Object.keys(markersRef.current).forEach((markerId) => {
        if (!currentFeatureIds.has(markerId)) {
          markersRef.current[markerId].remove();
          delete markersRef.current[markerId];
        }
      });

      // 새 마커 생성 또는 업데이트
      for (const feature of features) {
        const coords = feature.geometry as GeoJSON.Point;
        const props = feature.properties;

        if (!props || !coords.coordinates) continue;

        const [lng, lat] = coords.coordinates;
        const isCluster = props.cluster;
        const markerId = isCluster
          ? `cluster-${props.cluster_id}`
          : `point-${props.id}`;

        // 이미 존재하면 스킵 (위치/숫자 변경이 필요한 경우 재생성)
        if (markersRef.current[markerId]) {
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
          currentCategoryRef.current === "all"
            ? "all"
            : currentCategoryRef.current;
        const markerColor = getCategoryColor(categoryKey);

        // React 컴포넌트 렌더링
        const root = createRoot(el);
        root.render(
          <NumberMarker number={markerNumber} size={25} color={markerColor} />,
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

          map.flyTo({
            center: [lng, lat],
            duration: 800,
            essential: true,
            padding: {
              bottom: window.innerHeight * 0.3,
            },
          });

          if (isCluster) {
            const clusterId = props.cluster_id;
            const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;

            try {
              const leaves = await new Promise<GeoJSON.Feature[]>((resolve) => {
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
                  },
                );
              });

              const clusterCourses = leaves
                .map((leaf) => {
                  const courseId = leaf.properties?.id;
                  return coursesRef.current.find((c) => c.id === courseId);
                })
                .filter((c): c is Course => c !== undefined);

              if (onClusterClickRef.current && clusterCourses.length > 0) {
                onClusterClickRef.current(clusterCourses);
              }
            } catch (error) {
              console.error("Error handling cluster click:", error);
            }
          } else {
            const course = coursesRef.current.find((c) => c.id === props.id);
            if (onCourseClickRef.current && course) {
              onCourseClickRef.current(course);
            }
          }
        });

        marker.addTo(map);
        markersRef.current[markerId] = marker;
      }
    };

    const setupLayers = () => {
      if (hasInitialized.current) {
        const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(geojsonData);
        }
        return;
      }

      // 기존 레이어/소스 제거
      if (map.getLayer(clusterId)) map.removeLayer(clusterId);
      if (map.getLayer(unclusteredId)) map.removeLayer(unclusteredId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      // GeoJSON 소스 추가
      map.addSource(sourceId, {
        type: "geojson",
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50,
      });

      // 클러스터 레이어 (숨김)
      map.addLayer({
        id: clusterId,
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-opacity": 0,
          "circle-radius": 0,
        },
      });

      // 개별 포인트 레이어 (숨김)
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

    const handleSourceData = (e: mapboxgl.MapSourceDataEvent) => {
      if (e.sourceId === sourceId && e.isSourceLoaded) {
        updateMarkers();
      }
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once("load", setupLayers);
    }

    map.on("moveend", updateMarkers);
    map.on("zoomend", updateMarkers);
    map.on("sourcedata", handleSourceData);

    return () => {
      map.off("moveend", updateMarkers);
      map.off("zoomend", updateMarkers);
      map.off("sourcedata", handleSourceData);

      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
    };
  }, [map, courses]);

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
