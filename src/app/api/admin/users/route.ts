import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase";
import { checkAdminPermission } from "@/features/admin/lib/auth-helpers";

/**
 * GET /api/admin/users
 * 사용자 목록 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 체크
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin permission required" },
        { status: 403 },
      );
    }

    // URL 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const filter = searchParams.get("filter"); // 'admin' | 'user' | 'all'
    const search = searchParams.get("search"); // 닉네임 검색

    // 쿼리 빌드 (supabaseAdmin 사용 - RLS 우회)
    let query = supabaseAdmin
      .from("access_links")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // 필터 적용
    if (filter === "admin") {
      query = query.eq("is_admin", true);
    } else if (filter === "user") {
      query = query.eq("is_admin", false);
    }

    // 검색 적용
    if (search && search.trim()) {
      query = query.ilike("kakao_nickname", `%${search.trim()}%`);
    }

    // 페이지네이션
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error("Failed to fetch users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
