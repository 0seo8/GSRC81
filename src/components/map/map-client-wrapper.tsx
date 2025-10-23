"use client";

import { MapProvider } from "@/contexts/map-context";
import { OptimizedMapClient } from "./optimized-map-client";
import { type CourseWithComments, type CourseCategory } from "@/lib/courses-data";

interface MapClientWrapperProps {
  courses: CourseWithComments[];
  categories: CourseCategory[];
}

export function MapClientWrapper({ courses, categories }: MapClientWrapperProps) {
  return (
    <MapProvider initialCourses={courses}>
      <OptimizedMapClient courses={courses} categories={categories} />
    </MapProvider>
  );
}