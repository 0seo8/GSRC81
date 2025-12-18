import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/shared/lib/supabase";
import {
  getCurrentUser,
  checkAdminPermission,
} from "@/features/admin/lib/auth-helpers";

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

/**
 * POST /api/admin/users/[userId]
 * 관리자 권한 부여/해제 (관리자 전용)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { action } = body; // 'grant' | 'revoke'

    if (!action || !["grant", "revoke"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'grant' or 'revoke'" },
        { status: 400 },
      );
    }

    // 관리자 권한 체크
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin permission required" },
        { status: 403 },
      );
    }

    // 현재 로그인한 관리자 정보
    const currentAdmin = await getCurrentUser();
    if (!currentAdmin) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 500 },
      );
    }

    // 대상 사용자 조회
    const { data: targetUser, error: fetchError } = await supabase
      .from("access_links")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newAdminStatus = action === "grant";

    // 관리자 해제 시 최소 관리자 수 체크
    if (action === "revoke") {
      const { count } = await supabase
        .from("access_links")
        .select("*", { count: "exact", head: true })
        .eq("is_admin", true);

      if ((count || 0) <= 1) {
        return NextResponse.json(
          { error: "최소 1명의 관리자가 필요합니다" },
          { status: 400 },
        );
      }
    }

    // 관리자 권한 업데이트 (supabaseAdmin 사용 - RLS 우회)
    console.log("Updating admin status:", {
      userId,
      newAdminStatus,
      action,
    });

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from("access_links")
      .update({ is_admin: newAdminStatus })
      .eq("id", userId)
      .select();

    console.log("Update result:", { updateData, updateError });

    if (updateError) {
      console.error("Failed to update admin status:", updateError);
      return NextResponse.json(
        { error: `Failed to update admin status: ${updateError.message}` },
        { status: 500 },
      );
    }

    if (!updateData || updateData.length === 0) {
      console.error("No rows updated");
      return NextResponse.json(
        { error: "No rows were updated. User may not exist." },
        { status: 404 },
      );
    }

    // 감사 로그 기록 (supabaseAdmin 사용)
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await supabaseAdmin.from("admin_action_logs").insert({
      admin_id: currentAdmin.id,
      action_type: action === "grant" ? "grant_admin" : "revoke_admin",
      target_user_id: userId,
      target_user_nickname: targetUser.kakao_nickname,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: {
        previous_status: targetUser.is_admin,
        new_status: newAdminStatus,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        nickname: targetUser.kakao_nickname,
        is_admin: newAdminStatus,
      },
      message:
        action === "grant"
          ? "관리자 권한이 부여되었습니다"
          : "관리자 권한이 해제되었습니다",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
