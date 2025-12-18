"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 안전한 Admin 인증 (Server Actions)
 *
 * 보안 개선:
 * - ✅ 서버 사이드에서만 실행 (클라이언트 노출 방지)
 * - ✅ Admin 테이블 RLS 우회 (Service Role 사용)
 * - ✅ bcrypt 해싱 서버에서 처리
 * - ✅ 세션 쿠키로 관리 (localStorage 사용 안함)
 */

const ADMIN_SESSION_COOKIE = "gsrc81-admin-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7일

interface AdminSession {
  id: string;
  username: string;
  isAdmin: true;
  expiresAt: number;
}

/**
 * Admin 로그인
 */
export async function loginAdmin(username: string, password: string) {
  try {
    // Admin 클라이언트 (RLS 우회)
    const supabase = createAdminClient();

    // Admin 조회
    const { data: admin, error } = await supabase
      .from("admin")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !admin) {
      return { success: false, error: "존재하지 않는 사용자입니다" };
    }

    // 비밀번호 검증 (서버 사이드)
    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      return { success: false, error: "비밀번호가 일치하지 않습니다" };
    }

    // 마지막 로그인 시간 업데이트
    await supabase
      .from("admin")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", admin.id);

    // 세션 생성
    const session: AdminSession = {
      id: admin.id,
      username: admin.username,
      isAdmin: true,
      expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
    };

    // 안전한 쿠키 설정
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, JSON.stringify(session), {
      httpOnly: true, // JavaScript 접근 불가 (XSS 방지)
      secure: process.env.NODE_ENV === "production", // HTTPS only
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return { success: true, admin: { id: admin.id, username: admin.username } };
  } catch (error) {
    console.error("Admin login error:", error);
    return { success: false, error: "로그인 중 오류가 발생했습니다" };
  }
}

/**
 * Admin 로그아웃
 */
export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return { success: true };
}

/**
 * Admin 세션 확인
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

    if (!sessionCookie?.value) {
      return null;
    }

    const session: AdminSession = JSON.parse(sessionCookie.value);

    // 세션 만료 확인
    if (session.expiresAt < Date.now()) {
      cookieStore.delete(ADMIN_SESSION_COOKIE);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Admin 권한 확인 (middleware용)
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.isAdmin === true;
}
