import { getCourses } from "@/lib/courses-data";
import { MapClient } from "./map-client";

// React 19의 강력한 캐싱과 병렬성을 활용
export async function CoursesProvider() {
  try {
    const courses = await getCourses();
    
    // 데이터베이스에서 불러온 데이터 콘솔 출력
    console.log("📍 Map page - Loaded courses from database:");
    console.log("Total courses:", courses.length);
    console.log("Courses data:", courses);
    
    return <MapClient courses={courses} />;
  } catch (error) {
    console.error("Failed to load courses in CoursesProvider:", error);
    throw error; // ErrorBoundary에서 처리됨
  }
}