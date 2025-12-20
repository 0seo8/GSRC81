"use server";

import { revalidatePath } from "next/cache";

/**
 * 관리자 전용 코스 관리 Server Actions
 * Server-side에서 Admin 클라이언트를 사용하여 RLS 정책 우회
 */

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
