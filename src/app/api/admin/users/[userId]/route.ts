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
 * DELETE /api/admin/users/[userId]
 * 사용자 삭제 (관리자 전용)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    console.log("🗑️ [DELETE User] Starting delete for userId:", userId);

    // 관리자 권한 체크
    const isAdmin = await checkAdminPermission();
    console.log("🔐 [DELETE User] Admin permission check:", isAdmin);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin permission required" },
        { status: 403 },
      );
    }

    // 현재 로그인한 관리자 정보 (useAdmin=true로 RLS 우회)
    const currentAdmin = await getCurrentUser(true);
    console.log(
      "👤 [DELETE User] Current admin:",
      currentAdmin?.kakao_nickname,
    );
    if (!currentAdmin) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 500 },
      );
    }

    // 대상 사용자 조회 (supabaseAdmin 사용 - RLS 우회)
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from("access_links")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !targetUser) {
      console.error("Failed to fetch target user:", fetchError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 본인 삭제 방지
    if (currentAdmin.kakao_user_id === targetUser.kakao_user_id) {
      return NextResponse.json(
        { error: "자기 자신을 삭제할 수 없습니다" },
        { status: 400 },
      );
    }

    // 관리자 삭제 시 최소 관리자 수 체크 (supabaseAdmin 사용)
    if (targetUser.is_admin) {
      const { count } = await supabaseAdmin
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

    // 사용자 삭제 (supabaseAdmin 사용 - RLS 우회)
    const { error: deleteError } = await supabaseAdmin
      .from("access_links")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("Failed to delete user:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete user: ${deleteError.message}` },
        { status: 500 },
      );
    }

    // 감사 로그 기록 (supabaseAdmin 사용)
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_user_id: currentAdmin.kakao_user_id,
      admin_nickname: currentAdmin.kakao_nickname,
      action: "DELETE_USER",
      target_type: "user",
      target_id: userId,
      metadata: {
        target_nickname: targetUser.kakao_nickname,
        was_admin: targetUser.is_admin,
      },
      old_value: targetUser,
      new_value: null,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "사용자가 삭제되었습니다",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
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

    // 현재 로그인한 관리자 정보 (useAdmin=true로 RLS 우회)
    const currentAdmin = await getCurrentUser(true);
    if (!currentAdmin) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 500 },
      );
    }

    // 대상 사용자 조회 (supabaseAdmin 사용 - RLS 우회)
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from("access_links")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newAdminStatus = action === "grant";

    // 관리자 해제 시 최소 관리자 수 체크 (supabaseAdmin 사용)
    if (action === "revoke") {
      const { count } = await supabaseAdmin
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

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_user_id: currentAdmin.kakao_user_id,
      admin_nickname: currentAdmin.kakao_nickname,
      action: action === "grant" ? "GRANT_ADMIN" : "REVOKE_ADMIN",
      target_type: "user",
      target_id: userId,
      metadata: {
        target_nickname: targetUser.kakao_nickname,
        previous_status: targetUser.is_admin,
        new_status: newAdminStatus,
      },
      old_value: { is_admin: targetUser.is_admin },
      new_value: { is_admin: newAdminStatus },
      ip_address: ipAddress,
      user_agent: userAgent,
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
