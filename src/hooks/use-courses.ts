import { use } from "react";
import { getCourses, type CourseWithComments } from "@/lib/courses-data";

// React 19의 use hook을 활용한 데이터 fetching
export function useCoursesData() {
  const coursesPromise = getCourses();
  return use(coursesPromise);
}

// 캐시된 promise를 위한 컨텍스트
let coursesCache: Promise<CourseWithComments[]> | null = null;

export function getCoursesPromise(): Promise<CourseWithComments[]> {
  if (!coursesCache) {
    coursesCache = getCourses();
  }
  return coursesCache;
}

// 캐시 무효화
export function invalidateCoursesCache() {
  coursesCache = null;
}
