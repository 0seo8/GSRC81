// GSRC81 Maps: 확장된 V2 코스 데이터 서비스
import { CourseV2, extractStartPoint, extractEndPoint, getDistance } from '@/types/unified';
import { getActiveCoursesV2 } from './courses-data-v2';

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
export async function getActiveCoursesForMap(): Promise<CourseV2WithComments[]> {
  const courses = await getActiveCoursesV2();
  
  console.log(`🔍 Loaded ${courses.length} courses for map`);
  
  return courses.map(course => {
    const [startLat, startLng] = extractStartPoint(course);
    const distance = getDistance(course);
    
    console.log(`📍 Course "${course.title}": lat=${startLat}, lng=${startLng}, distance=${distance}km`);
    
    if (isNaN(startLat) || isNaN(startLng)) {
      console.error(`❌ Invalid coordinates for course "${course.title}":`, {
        course,
        gpx_data: course.gpx_data,
        startPoint: course.gpx_data?.metadata?.startPoint,
        firstPoint: course.gpx_data?.points?.[0]
      });
    }
    
    return {
      ...course,
      comment_count: 0, // TODO: 댓글 수 집계 추가
      start_latitude: startLat,
      start_longitude: startLng, 
      distance_km: distance,
    };
  });
}