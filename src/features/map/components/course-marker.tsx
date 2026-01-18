"use client";

import { useEffect, useRef, useState, memo } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import { toast } from "sonner";
import { type CourseForMap } from "@/lib/supabase/repositories/courseRepository";
import { getCategoryDesign } from "@/core/config/category-designs";
import {
  getMarkerOffset,
  MARKER_ANIMATION,
  CLUSTER_CONFIG,
  MARKER_Z_INDEX,
} from "@/core/config/map";
import { NumberMarker } from "./number-marker";
import { MarkerSkeleton } from "./marker-skeleton";

type Course = CourseForMap;

interface CourseMarkerProps {
  map: mapboxgl.Map;
  courses: Course[];
  currentCategory?: string;
  onCourseClick?: (course: Course) => void;
  onClusterClick?: (courses: Course[]) => void;
}

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
          category_key: course.course_categories?.key || "jingwan",
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

        // 마커 정보 계산
        const markerNumber = isCluster ? props.point_count : 1;

        // 마커 엘리먼트 생성
        const el = document.createElement("div");
        el.style.cssText = `
          cursor: pointer;
          z-index: ${isCluster ? MARKER_Z_INDEX.CLUSTER : MARKER_Z_INDEX.POINT};
        `;

        // 접근성 속성 추가
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute(
          "aria-label",
          isCluster
            ? `${markerNumber}개 코스가 모인 클러스터`
            : `${props.title || "코스"} 마커`,
        );
        const categoryKey =
          currentCategoryRef.current === "all"
            ? "all"
            : currentCategoryRef.current;
        const markerColor = getCategoryDesign(categoryKey).markerColor;

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

          // 마커 클릭 시 바텀시트가 열리므로 항상 "medium" 오프셋 사용
          // (클릭 시점에는 아직 snapPoint가 minimized일 수 있음)
          const offsetY = getMarkerOffset("medium");

          if (process.env.NODE_ENV === "development") {
            console.log("Marker Clicked:", {
              id: props.id,
              title: props.title,
              lng,
              lat,
              offsetY,
              currentCenter: map.getCenter(),
              windowHeight: window.innerHeight,
            });
          }

          // 현재 중심에서 타겟까지의 거리 계산 (대략적인 픽셀 거리)
          const currentCenter = map.getCenter();
          const zoom = map.getZoom();

          // 경도/위도 차이를 픽셀로 환산 (대략적)
          const lngDiff = Math.abs(lng - currentCenter.lng);
          const latDiff = Math.abs(lat - currentCenter.lat);
          const pixelDistance = Math.sqrt(
            Math.pow((lngDiff * Math.pow(2, zoom) * 256) / 360, 2) +
              Math.pow((latDiff * Math.pow(2, zoom) * 256) / 180, 2),
          );

          // 거리에 따른 duration 조절
          // 가까운 거리는 빠르게, 먼 거리는 천천히
          const duration = Math.min(
            MARKER_ANIMATION.MAX_DURATION,
            Math.max(
              MARKER_ANIMATION.MIN_DURATION,
              pixelDistance * MARKER_ANIMATION.DURATION_PER_PIXEL,
            ),
          );

          // easeTo 사용 (flyTo보다 부드럽고 줌 변경 없음)
          map.easeTo({
            center: [lng, lat],
            duration,
            offset: [0, offsetY],
            easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
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

              if (clusterCourses.length > 0) {
                onClusterClickRef.current?.(clusterCourses);
              } else {
                // 빈 클러스터 또는 코스를 찾을 수 없는 경우 피드백
                toast.info("선택 가능한 코스가 없습니다", {
                  duration: 2000,
                });
              }
            } catch (error) {
              console.error("Error handling cluster click:", error);
              toast.error("코스 정보를 불러오는데 실패했습니다", {
                duration: 3000,
              });
            }
          } else {
            const course = coursesRef.current.find((c) => c.id === props.id);
            if (course) {
              onCourseClickRef.current?.(course);
            } else {
              // 코스를 찾을 수 없는 경우 피드백
              toast.error("코스 정보를 찾을 수 없습니다", {
                duration: 2000,
              });
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
        clusterMaxZoom: CLUSTER_CONFIG.MAX_ZOOM,
        clusterRadius: CLUSTER_CONFIG.RADIUS,
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
