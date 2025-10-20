// GSRC81 Maps: GPX 데이터 마이그레이션 유틸리티
// 기존 데이터를 새로운 통합 형식으로 변환

import { supabase } from "./supabase";
import { Course } from "@/types";
import { CourseV2, UnifiedGPXData } from "@/types/unified";

/**
 * 기존 Course를 새로운 CourseV2로 변환
 */
export async function migrateCourseToV2(
  course: Course,
): Promise<Partial<CourseV2>> {
  try {
    // 1. course_points 테이블에서 데이터 가져오기
    let points: Array<{ lat: number; lng: number; ele?: number }> = [];

    const { data: coursePoints } = await supabase
      .from("course_points")
      .select("*")
      .eq("course_id", course.id)
      .order("seq", { ascending: true });

    if (coursePoints && coursePoints.length > 0) {
      points = coursePoints.map((p) => ({
        lat: p.latitude,
        lng: p.longitude,
        ele: p.elevation,
      }));
    } else if (course.gpx_coordinates) {
      // gpx_coordinates 문자열 파싱
      try {
        const parsed = JSON.parse(course.gpx_coordinates);
        points = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Failed to parse gpx_coordinates:", e);
      }
    }

    // 2. bounds 계산
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);

    const bounds = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };

    // 3. 통합 GPX 데이터 생성
    const gpxData: UnifiedGPXData = {
      version: "1.1",
      points,
      bounds,
      stats: {
        totalDistance: course.distance_km,
        elevationGain: course.elevation_gain || 0,
        estimatedDuration: course.avg_time_min || 0,
      },
      metadata: {
        startPoint: {
          lat: course.start_latitude,
          lng: course.start_longitude,
        },
        endPoint:
          course.end_latitude && course.end_longitude
            ? {
                lat: course.end_latitude,
                lng: course.end_longitude,
              }
            : undefined,
        nearestStation: course.nearest_station,
        gpxUrl: course.gpx_url,
      },
    };

    // 4. CourseV2 객체 생성
    const courseV2: Partial<CourseV2> = {
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      course_type: determineCourseType(course), // 타입 추론
      gpx_data_v2: gpxData,
      cover_image_url: course.cover_image_url,
      is_active: course.is_active,
      created_at: course.created_at,
      updated_at: course.updated_at,
    };

    return courseV2;
  } catch (error) {
    console.error("Migration error for course:", course.id, error);
    throw error;
  }
}

/**
 * 코스 타입 자동 추론
 */
function determineCourseType(course: Course): "track" | "trail" | "road" {
  const title = course.title.toLowerCase();
  const description = (course.description || "").toLowerCase();

  if (title.includes("트랙") || description.includes("트랙")) {
    return "track";
  }
  if (
    title.includes("트레일") ||
    description.includes("산") ||
    title.includes("숲") ||
    description.includes("트레일")
  ) {
    return "trail";
  }
  return "road"; // 기본값
}

/**
 * 모든 코스 마이그레이션 실행
 */
export async function migrateAllCourses(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // 1. 모든 코스 가져오기
    const { data: courses, error } = await supabase
      .from("courses")
      .select("*")
      .is("gpx_data_v2", null); // 아직 마이그레이션 안된 것만

    if (error) throw error;

    if (!courses || courses.length === 0) {
      return results;
    }

    // 2. 각 코스 마이그레이션
    for (const course of courses) {
      try {
        const courseV2 = await migrateCourseToV2(course);

        // 3. 업데이트
        const { error: updateError } = await supabase
          .from("courses")
          .update({ gpx_data_v2: courseV2.gpx_data_v2 })
          .eq("id", course.id);

        if (updateError) throw updateError;

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Course ${course.id}: ${error}`);
        console.error(`❌ Failed to migrate course ${course.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Migration failed:", error);
    results.errors.push(`Global error: ${error}`);
  }

  return results;
}

/**
 * 단일 코스 마이그레이션
 */
export async function migrateSingleCourse(courseId: string): Promise<boolean> {
  try {
    const { data: course, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (error || !course) {
      console.error("Course not found:", courseId);
      return false;
    }

    const courseV2 = await migrateCourseToV2(course);

    const { error: updateError } = await supabase
      .from("courses")
      .update({ gpx_data: courseV2.gpx_data })
      .eq("id", courseId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error("Failed to migrate course:", error);
    return false;
  }
}

/**
 * 마이그레이션 상태 확인
 */
export async function checkMigrationStatus(): Promise<{
  total: number;
  migrated: number;
  pending: number;
  percentage: number;
}> {
  try {
    const { count: total } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });

    const { count: migrated } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .not("gpx_data", "is", null);

    const totalCount = total || 0;
    const migratedCount = migrated || 0;
    const pending = totalCount - migratedCount;
    const percentage = totalCount > 0 ? (migratedCount / totalCount) * 100 : 0;

    return {
      total: totalCount,
      migrated: migratedCount,
      pending,
      percentage: Math.round(percentage),
    };
  } catch (error) {
    console.error("Failed to check migration status:", error);
    return {
      total: 0,
      migrated: 0,
      pending: 0,
      percentage: 0,
    };
  }
}
