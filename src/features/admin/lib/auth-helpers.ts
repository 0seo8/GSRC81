import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/lib/auth";
import { supabase } from "@/shared/lib/supabase";

/**
 * 현재 로그인한 사용자의 세션 정보 가져오기
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

/**
 * 현재 로그인한 사용자 정보 가져오기 (access_links 테이블)
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return null;
  }

  const { data: user, error } = await supabase
    .from("access_links")
    .select("*")
    .eq("kakao_user_id", session.user.id)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * 현재 사용자가 관리자 권한이 있는지 확인
 */
export async function checkAdminPermission(): Promise<boolean> {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return false;
  }

  // 세션에서 먼저 확인 (성능 최적화)
  if (session.user.isAdmin === true) {
    return true;
  }

  // DB에서 재확인 (최신 정보)
  const user = await getCurrentUser();
  return user?.is_admin === true;
}

/**
 * 관리자 권한 검증 및 401 에러 반환
 */
export async function requireAdmin() {
  const isAdmin = await checkAdminPermission();

  if (!isAdmin) {
    throw new Error("Unauthorized: Admin permission required");
  }

  return true;
}

/**
 * 로그인 검증 및 401 에러 반환
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized: Login required");
  }

  return user;
}
