"use server";

import { revalidatePath } from "next/cache";

/**
 * 관리자 전용 Access Code 관리 Server Actions
 * Server-side에서 Admin 클라이언트를 사용하여 RLS 정책 우회
 */

/**
 * Access Codes 조회
 * RLS 정책을 우회하여 관리자만 사용 가능
 */
export async function adminGetAccessCodesAction() {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("access_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch access codes:", error);
      throw error;
    }

    return {
      success: true,
      error: null,
      data: data || [],
    };
  } catch (error) {
    console.error("Error fetching access codes:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "접근 코드 정보를 불러오는 중 오류가 발생했습니다",
      data: [],
    };
  }
}

/**
 * Access Code 업데이트 (코드 변경)
 * RLS 정책을 우회하여 관리자만 사용 가능
 */
export async function adminUpdateAccessCodeAction(
  codeId: string,
  newCode: string,
) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    // 새 코드 중복 확인
    const { data: existingCode } = await supabase
      .from("access_codes")
      .select("id")
      .eq("code", newCode)
      .neq("id", codeId)
      .maybeSingle();

    if (existingCode) {
      return {
        success: false,
        error: "이미 사용 중인 접근 코드입니다.",
      };
    }

    // 코드 업데이트
    const { error: updateError } = await supabase
      .from("access_codes")
      .update({
        code: newCode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", codeId);

    if (updateError) {
      console.error("❌ Supabase update error:", updateError);
      throw updateError;
    }

    revalidatePath("/admin/password");

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error updating access code:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "접근 코드 변경 중 오류가 발생했습니다",
    };
  }
}

/**
 * Access Code 생성
 * RLS 정책을 우회하여 관리자만 사용 가능
 */
export async function adminCreateAccessCodeAction(
  code: string,
  description?: string,
  expiresAt?: string,
) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    // 코드 중복 확인
    const { data: existingCode } = await supabase
      .from("access_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (existingCode) {
      return {
        success: false,
        error: "이미 사용 중인 접근 코드입니다.",
      };
    }

    // 새 코드 생성
    const { data, error: insertError } = await supabase
      .from("access_codes")
      .insert({
        code,
        description: description || null,
        expires_at: expiresAt || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Supabase insert error:", insertError);
      throw insertError;
    }

    revalidatePath("/admin/password");

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error("Error creating access code:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "접근 코드 생성 중 오류가 발생했습니다",
      data: null,
    };
  }
}

/**
 * Access Code 삭제
 * RLS 정책을 우회하여 관리자만 사용 가능
 */
export async function adminDeleteAccessCodeAction(codeId: string) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    const { error: deleteError } = await supabase
      .from("access_codes")
      .delete()
      .eq("id", codeId);

    if (deleteError) {
      console.error("❌ Supabase delete error:", deleteError);
      throw deleteError;
    }

    revalidatePath("/admin/password");

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error deleting access code:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "접근 코드 삭제 중 오류가 발생했습니다",
    };
  }
}

/**
 * Access Code 활성화/비활성화 토글
 * RLS 정책을 우회하여 관리자만 사용 가능
 */
export async function adminToggleAccessCodeAction(
  codeId: string,
  isActive: boolean,
) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    const { error: updateError } = await supabase
      .from("access_codes")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", codeId);

    if (updateError) {
      console.error("❌ Supabase update error:", updateError);
      throw updateError;
    }

    revalidatePath("/admin/password");

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error toggling access code:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "접근 코드 상태 변경 중 오류가 발생했습니다",
    };
  }
}
