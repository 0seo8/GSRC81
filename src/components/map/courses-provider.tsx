import { getCourses } from "@/lib/courses-data";
import { MapClient } from "./map-client";

// React 19의 강력한 캐싱과 병렬성을 활용
export async function CoursesProvider() {
  try {
    // 초기 로드시 진관동러닝 카테고리만 표시
    const courses = await getCourses("jingwan");

    console.log("cu", courses);
    console.log("📍 진관동러닝 코스 로드됨:", courses.length, "개");

    return <MapClient courses={courses} />;
  } catch (error) {
    console.error("Failed to load courses in CoursesProvider:", error);
    throw error; // ErrorBoundary에서 처리됨
  }
}
