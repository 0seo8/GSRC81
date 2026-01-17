"use client";

import { useState, useCallback, useOptimistic } from "react";
import { type CourseForMap } from "@/lib/supabase/repositories/courseRepository";

export function useMapState(courses: CourseForMap[]) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseForMap | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<CourseForMap[]>(
    [],
  );

  // React 19의 useOptimistic을 활용한 낙관적 업데이트
  const [optimisticCourses, addOptimisticCourse] = useOptimistic(
    courses,
    (state, newCourse: CourseForMap) => [...state, newCourse],
  );

  const handleMapLoad = useCallback((mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);

    mapInstance.on("click", () => {
      setSelectedCourse(null);
      setSelectedCourses([]);
    });
  }, []);

  const handleCourseClick = useCallback((course: CourseForMap) => {
    setSelectedCourse(course);
    setSelectedCourses([]);
  }, []);

  const handleClusterClick = useCallback((courses: CourseForMap[]) => {
    setSelectedCourses(courses);
    setSelectedCourse(null);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedCourses([]);
    setSelectedCourse(null);
  }, []);

  return {
    map,
    setMap,
    selectedCourse,
    selectedCourses,
    optimisticCourses,
    addOptimisticCourse,
    handleMapLoad,
    handleCourseClick,
    handleClusterClick,
    handleCloseDrawer,
  };
}
