// GSRC81 Maps: 확장된 V2 코스 데이터 서비스
import {
  CourseV2,
  extractStartPoint,
  extractEndPoint,
  getDistance,
} from "@/types/unified";
import { getActiveCoursesV2 } from "./courses-data-v2";

// MapClient 호환성을 위한 확장 타입
export interface CourseV2WithComments extends CourseV2 {
  comment_count: number;
  start_latitude: number;
  start_longitude: number;
  distance_km: number;
  category_key?: string;
}

/**
 * MapClient와 호환되는 형태로 코스 데이터 변환
 */
export async function getActiveCoursesForMap(): Promise<
  CourseV2WithComments[]
> {
  const courses = await getActiveCoursesV2();

  return courses.map((course) => {
    const [startLat, startLng] = extractStartPoint(course);
    const distance = getDistance(course);

    return {
      ...course,
      comment_count: 0, // TODO: 댓글 수 집계 추가
      start_latitude: startLat,
      start_longitude: startLng,
      distance_km: distance,
    };
  });
}
