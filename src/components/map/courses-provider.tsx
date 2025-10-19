import { getCourses, getCourseCategories } from "@/lib/courses-data";
import { MapClient } from "./map-client";

// React 19의 강력한 캐싱과 병렬성을 활용
export async function CoursesProvider() {
  try {
    // 카테고리와 초기 코스를 병렬로 로드
    const [categories, courses] = await Promise.all([
      getCourseCategories(),
      getCourses("jingwan") // 초기 로드시 진관동러닝 카테고리만 표시
    ]);

    console.log("📂 카테고리 로드됨:", categories.length, "개");
    console.log("📍 진관동러닝 코스 로드됨:", courses.length, "개");

    return <MapClient courses={courses} categories={categories} />;
  } catch (error) {
    console.error("Failed to load data in CoursesProvider:", error);
    throw error; // ErrorBoundary에서 처리됨
  }
}
