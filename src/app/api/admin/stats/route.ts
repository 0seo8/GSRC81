import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase";
import { checkAdminPermission } from "@/features/admin/lib/auth-helpers";

/**
 * GET /api/admin/stats
 * 관리자 대시보드 통계 조회 (RLS 우회)
 */
export async function GET() {
  try {
    // 관리자 권한 체크
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin permission required" },
        { status: 403 },
      );
    }

    // 통계 데이터 조회 (supabaseAdmin 사용 - RLS 우회)
    const [
      { count: courseCount },
      { count: commentCount },
      { count: userCount },
    ] = await Promise.all([
      supabaseAdmin.from("courses").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("course_comments")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("access_links")
        .select("*", { count: "exact", head: true })
        .eq("verified", true),
    ]);

    return NextResponse.json({
      totalCourses: courseCount || 0,
      totalComments: commentCount || 0,
      activeUsers: userCount || 0,
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
