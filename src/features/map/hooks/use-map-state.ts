"use client";

import { useState, useCallback, useOptimistic } from "react";
import { type CourseWithCategory } from "@/lib/supabase/repositories/courseRepository";

export function useMapState(courses: CourseWithCategory[]) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseWithCategory | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<CourseWithCategory[]>(
    [],
  );

  // React 19의 useOptimistic을 활용한 낙관적 업데이트
  const [optimisticCourses, addOptimisticCourse] = useOptimistic(
    courses,
    (state, newCourse: CourseWithCategory) => [...state, newCourse],
  );

  const handleMapLoad = useCallback((mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);

    mapInstance.on("click", () => {
      setSelectedCourse(null);
      setSelectedCourses([]);
    });
  }, []);

  const handleCourseClick = useCallback((course: CourseWithCategory) => {
    setSelectedCourse(course);
    setSelectedCourses([]);
  }, []);

  const handleClusterClick = useCallback((courses: CourseWithCategory[]) => {
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
