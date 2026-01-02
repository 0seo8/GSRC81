"use server";

import { revalidatePath } from "next/cache";
import { GPXDataSchema } from "@/core/validation/gpx";
import type { UnifiedGPXData } from "@/types/unified";
import type { Json } from "@/shared/types/database.types";

/**
 * 관리자 전용 코스 관리 Server Actions
 * Server-side에서 Admin 클라이언트를 사용하여 RLS 정책 우회
 */

/**
 * 코스 생성용 입력 타입
 */
export interface CreateCourseInput {
  title: string;
  description: string;
  distance_km: number;
  avg_time_min: number;
  difficulty: "easy" | "medium" | "hard";
  category_id: string | null;
  gpxData: unknown;
  photos?: string[];
}

/**
 * 코스 생성 (GPX 업로드)
 * RLS 정책을 우회하여 관리자만 사용 가능
 */
export async function adminCreateCourseAction(input: CreateCourseInput) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    // Zod로 GPX 데이터 검증
    const validatedGPX = GPXDataSchema.parse(input.gpxData);
    const { startPoint, coordinates, distance, duration, elevationGain } =
      validatedGPX;

    // 통계 계산
    const bounds = {
      minLat: Math.min(...coordinates.map((c) => c.lat)),
      maxLat: Math.max(...coordinates.map((c) => c.lat)),
      minLng: Math.min(...coordinates.map((c) => c.lng)),
      maxLng: Math.max(...coordinates.map((c) => c.lng)),
    };

    // vFinal 표준화된 GPX 데이터 구조
    const normalizedGpxData: UnifiedGPXData = {
      version: "1.1" as const,
      points: coordinates,
      bounds,
      stats: {
        totalDistance: distance,
        elevationGain: elevationGain || 0,
        estimatedDuration: duration,
      },
      metadata: {
        startPoint: {
          lat: startPoint.lat,
          lng: startPoint.lng,
        },
        endPoint: {
          lat: coordinates[coordinates.length - 1].lat,
          lng: coordinates[coordinates.length - 1].lng,
        },
      },
    };

    const courseData = {
      title: input.title,
      description: input.description,
      start_latitude: startPoint.lat,
      start_longitude: startPoint.lng,
      distance_km: input.distance_km || distance,
      avg_time_min: input.avg_time_min || duration,
      difficulty: input.difficulty,
      category_id: input.category_id || null,
      elevation_gain: elevationGain || 0,
      sort_order: 0,
      gpx_data: normalizedGpxData as unknown as Json,
      is_active: true,
    };

    const { data, error: courseError } = await supabase
      .from("courses")
      .insert([courseData])
      .select()
      .single();

    if (courseError) {
      console.error("❌ Supabase insert error:", courseError);
      throw courseError;
    }

    // 사진이 있으면 course_photos에 저장
    if (input.photos && input.photos.length > 0) {
      const photoInserts = input.photos.map((url) => ({
        course_id: data.id,
        file_url: url,
        caption: "",
      }));

      const { error: photoError } = await supabase
        .from("course_photos")
        .insert(photoInserts);

      if (photoError) {
        console.error("Failed to save photos:", photoError);
        // 사진 저장 실패는 에러로 처리하지 않음 (코스는 생성됨)
      }
    }

    revalidatePath("/admin/courses");
    revalidatePath("/map");

    return {
      success: true,
      error: null,
      data: { id: data.id },
    };
  } catch (error) {
    console.error("Error creating course:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "코스 등록 중 오류가 발생했습니다",
      data: null,
    };
  }
}

/**
 * 코스 제목 업데이트
 */
export async function adminUpdateCourseTitleAction(
  courseId: string,
  title: string,
) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("courses")
      .update({ title: title.trim() })
      .eq("id", courseId);

    if (error) {
      console.error("Admin update title error:", error);
      throw error;
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/admin/courses/${courseId}/manage`);
    revalidatePath("/admin/courses");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating course title:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "코스 제목 업데이트 중 오류가 발생했습니다",
      success: false,
    };
  }
}

/**
 * 코스 통계 업데이트
 */
export async function adminUpdateCourseStatsAction(
  courseId: string,
  stats: {
    distance_km: number;
    avg_time_min: number;
    elevation_gain: number;
    difficulty: "easy" | "medium" | "hard";
  },
) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("courses")
      .update({
        distance_km: stats.distance_km,
        avg_time_min: stats.avg_time_min,
        elevation_gain: stats.elevation_gain,
        difficulty: stats.difficulty,
      })
      .eq("id", courseId);

    if (error) {
      console.error("Admin update stats error:", error);
      throw error;
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/admin/courses/${courseId}/manage`);

    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating course stats:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "코스 통계 업데이트 중 오류가 발생했습니다",
      success: false,
    };
  }
}

/**
 * 코스 설명 업데이트
 */
export async function adminUpdateCourseDescriptionAction(
  courseId: string,
  description: string,
) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("courses")
      .update({ detail_description: description.trim() })
      .eq("id", courseId);

    if (error) {
      console.error("Admin update description error:", error);
      throw error;
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/admin/courses/${courseId}/manage`);

    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating course description:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "코스 설명 업데이트 중 오류가 발생했습니다",
      success: false,
    };
  }
}

/**
 * 코스 삭제
 * RLS 정책을 우회하여 관리자만 사용 가능
 */
export async function adminDeleteCourseAction(courseId: string) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    // 코스 정보 먼저 조회 (감사 로그용)
    const { data: course, error: fetchError } = await supabase
      .from("courses")
      .select("id, title, distance_km, difficulty")
      .eq("id", courseId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch course:", fetchError);
      throw fetchError;
    }

    // 코스 삭제
    const { error: deleteError } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (deleteError) {
      console.error("❌ Supabase delete error:", deleteError);
      throw deleteError;
    }

    revalidatePath("/admin/courses");
    revalidatePath("/admin");
    revalidatePath("/map");

    return {
      success: true,
      error: null,
      data: course,
    };
  } catch (error) {
    console.error("Error deleting course:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "코스 삭제 중 오류가 발생했습니다",
      data: null,
    };
  }
}
