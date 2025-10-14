import { getActiveCoursesForMap } from "@/lib/courses-data-v2-extended";
import { MapClient } from "./map-client";

// React 19의 강력한 캐싱과 병렬성을 활용
export async function CoursesProvider() {
  try {
    const courses = await getActiveCoursesForMap();
    return <MapClient courses={courses} />;
  } catch (error) {
    console.error("Failed to load courses in CoursesProvider:", error);
    throw error; // ErrorBoundary에서 처리됨
  }
}