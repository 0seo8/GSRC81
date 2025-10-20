"use client";

import { useState, useCallback, useOptimistic } from "react";
import { type CourseWithComments } from "@/lib/courses-data";

export function useMapState(courses: CourseWithComments[]) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseWithComments | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<CourseWithComments[]>(
    [],
  );

  // React 19의 useOptimistic을 활용한 낙관적 업데이트
  const [optimisticCourses, addOptimisticCourse] = useOptimistic(
    courses,
    (state, newCourse: CourseWithComments) => [...state, newCourse],
  );

  const handleMapLoad = useCallback((mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);

    mapInstance.on("click", () => {
      setSelectedCourse(null);
      setSelectedCourses([]);
    });
  }, []);

  const handleCourseClick = useCallback((course: CourseWithComments) => {
    setSelectedCourse(course);
    setSelectedCourses([]);
  }, []);

  const handleClusterClick = useCallback((courses: CourseWithComments[]) => {
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
