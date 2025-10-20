// GSRC81 Maps: 코스 데이터 서비스 (v2 - gpx_data 사용)
import { supabase } from "./supabase";
import { CourseV2, UnifiedGPXData } from "@/types/unified";

/**
 * 모든 활성 코스 가져오기 (gpx_data 사용)
 */
export async function getActiveCoursesV2(): Promise<CourseV2[]> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select(
        `
        *,
        course_categories (
          key,
          name
        )
      `,
      )
      .eq("is_active", true)
      .not("gpx_data", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // CourseV2 형식으로 변환
    const courses: CourseV2[] = (data || []).map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      course_type: determineCourseType(course),
      gpx_data: course.gpx_data as UnifiedGPXData,
      cover_image_url: course.cover_image_url,
      is_active: course.is_active,
      created_at: course.created_at,
      updated_at: course.updated_at,
    }));

    return courses;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

/**
 * 특정 코스 가져오기 (gpx_data 사용)
 */
export async function getCourseByIdV2(id: string): Promise<CourseV2 | null> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    const course: CourseV2 = {
      id: data.id,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      course_type: determineCourseType(data),
      gpx_data: data.gpx_data as UnifiedGPXData,
      cover_image_url: data.cover_image_url,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return course;
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
}

/**
 * 코스 타입 자동 결정
 */
function determineCourseType(
  course: Record<string, unknown>,
): "track" | "trail" | "road" {
  const title = String(course.title || "").toLowerCase();
  const description = String(course.description || "").toLowerCase();

  if (title.includes("트랙") || description.includes("트랙")) {
    return "track";
  }
  if (
    title.includes("트레일") ||
    title.includes("둘레") ||
    title.includes("산") ||
    description.includes("트레일")
  ) {
    return "trail";
  }
  return "road";
}

/**
 * 지도용 마커 데이터 추출
 */
export function extractMapMarkers(courses: CourseV2[]) {
  return courses.map((course) => {
    const startPoint =
      course.gpx_data.metadata?.startPoint || course.gpx_data.points[0];

    return {
      id: course.id,
      title: course.title,
      position: [startPoint.lng, startPoint.lat] as [number, number],
      difficulty: course.difficulty,
      distance: course.gpx_data.stats.totalDistance,
      type: course.course_type || "road",
    };
  });
}

/**
 * GPX 경로 데이터 추출 (Mapbox 형식)
 */
export function extractRouteCoordinates(course: CourseV2): [number, number][] {
  return course.gpx_data.points.map((point) => [point.lng, point.lat]);
}

/**
 * 코스 경계 계산
 */
export function getCourseBounds(course: CourseV2) {
  const { bounds } = course.gpx_data;
  return [
    [bounds.minLng, bounds.minLat],
    [bounds.maxLng, bounds.maxLat],
  ] as [[number, number], [number, number]];
}

/**
 * 거리별 필터링
 */
export function filterCoursesByDistance(
  courses: CourseV2[],
  minKm: number,
  maxKm: number,
): CourseV2[] {
  return courses.filter((course) => {
    const distance = course.gpx_data.stats.totalDistance;
    return distance >= minKm && distance <= maxKm;
  });
}

/**
 * 난이도별 필터링
 */
export function filterCoursesByDifficulty(
  courses: CourseV2[],
  difficulty: "easy" | "medium" | "hard",
): CourseV2[] {
  return courses.filter((course) => course.difficulty === difficulty);
}

/**
 * 코스 타입별 필터링
 */
export function filterCoursesByType(
  courses: CourseV2[],
  type: "track" | "trail" | "road",
): CourseV2[] {
  return courses.filter((course) => course.course_type === type);
}

/**
 * 포맷된 거리 문자열
 */
export function formatDistance(km: number): string {
  return `${km.toFixed(1)}km`;
}

/**
 * 포맷된 시간 문자열 (자연어)
 */
export function formatDuration(minutes: number | null): string {
  if (!minutes) return "시간 미정";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  }
  return `${mins}분`;
}

/**
 * 고도 증가량 포맷
 */
export function formatElevation(meters: number): string {
  return `+${meters}m`;
}

/**
 * 실시간 코스 구독 (Supabase Realtime)
 */
export function subscribeToCourseChanges(callback: (course: CourseV2) => void) {
  return supabase
    .channel("courses-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "courses",
      },
      async (payload) => {
        if (payload.new && payload.new.gpx_data) {
          const course: CourseV2 = {
            id: payload.new.id,
            title: payload.new.title,
            description: payload.new.description,
            difficulty: payload.new.difficulty,
            course_type: determineCourseType(payload.new),
            gpx_data: payload.new.gpx_data as UnifiedGPXData,
            cover_image_url: payload.new.cover_image_url,
            is_active: payload.new.is_active,
            created_at: payload.new.created_at,
            updated_at: payload.new.updated_at,
          };
          callback(course);
        }
      },
    )
    .subscribe();
}
