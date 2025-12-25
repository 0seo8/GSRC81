/**
 * 관리자 감사 로그 시스템
 * 모든 관리자 작업을 추적하고 기록합니다.
 */

import { createClient } from "@/lib/supabase/client";

// 작업 타입 정의
export const AuditAction = {
  // 코스 관련
  CREATE_COURSE: "CREATE_COURSE",
  UPDATE_COURSE: "UPDATE_COURSE",
  DELETE_COURSE: "DELETE_COURSE",
  PUBLISH_COURSE: "PUBLISH_COURSE",
  UNPUBLISH_COURSE: "UNPUBLISH_COURSE",

  // 사용자 관련
  GRANT_ADMIN: "GRANT_ADMIN",
  REVOKE_ADMIN: "REVOKE_ADMIN",
  UPDATE_USER: "UPDATE_USER",
  DELETE_USER: "DELETE_USER",

  // 설정 관련
  UPDATE_FLIGHT_SETTINGS: "UPDATE_FLIGHT_SETTINGS",
  UPDATE_APP_SETTINGS: "UPDATE_APP_SETTINGS",
  CHANGE_PASSWORD: "CHANGE_PASSWORD",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

// 대상 타입 정의
export const TargetType = {
  COURSE: "course",
  USER: "user",
  SETTINGS: "settings",
  PASSWORD: "password",
} as const;

export type TargetTypeValue = (typeof TargetType)[keyof typeof TargetType];

// 감사 로그 인터페이스
export interface AuditLogEntry {
  admin_user_id: string;
  admin_nickname?: string;
  action: AuditActionType;
  target_type?: TargetTypeValue;
  target_id?: string;
  metadata?: Record<string, unknown>;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * 감사 로그 생성 헬퍼 함수
 * @param entry 로그 항목 데이터
 * @returns 성공 여부
 */
export async function createAuditLog(
  entry: AuditLogEntry,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // IP 주소와 User Agent는 클라이언트에서 가져올 수 없으므로
    // API 라우트에서 처리하는 것이 권장됩니다.
    // 여기서는 기본값으로 처리
    const logEntry = {
      ...entry,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("admin_audit_logs")
      .insert([logEntry]);

    if (error) {
      console.error("❌ 감사 로그 생성 실패:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ 감사 로그 생성 성공:", entry.action);
    return { success: true };
  } catch (error) {
    console.error("❌ 감사 로그 생성 에러:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 코스 생성 로그
 */
export async function logCourseCreate(
  adminUserId: string,
  adminNickname: string,
  courseId: string,
  courseData: {
    title: string;
    distance_km: number;
    difficulty: string;
  },
) {
  return createAuditLog({
    admin_user_id: adminUserId,
    admin_nickname: adminNickname,
    action: AuditAction.CREATE_COURSE,
    target_type: TargetType.COURSE,
    target_id: courseId,
    new_value: courseData,
  });
}

/**
 * 코스 삭제 로그
 */
export async function logCourseDelete(
  adminUserId: string,
  adminNickname: string,
  courseId: string,
  courseData: {
    title: string;
    distance_km: number;
    difficulty: string;
  },
) {
  return createAuditLog({
    admin_user_id: adminUserId,
    admin_nickname: adminNickname,
    action: AuditAction.DELETE_COURSE,
    target_type: TargetType.COURSE,
    target_id: courseId,
    old_value: courseData,
  });
}

/**
 * 관리자 권한 부여 로그
 */
export async function logGrantAdmin(
  adminUserId: string,
  adminNickname: string,
  targetUserId: string,
  targetNickname: string,
) {
  return createAuditLog({
    admin_user_id: adminUserId,
    admin_nickname: adminNickname,
    action: AuditAction.GRANT_ADMIN,
    target_type: TargetType.USER,
    target_id: targetUserId,
    metadata: {
      target_nickname: targetNickname,
    },
    new_value: {
      is_admin: true,
    },
  });
}

/**
 * 관리자 권한 해제 로그
 */
export async function logRevokeAdmin(
  adminUserId: string,
  adminNickname: string,
  targetUserId: string,
  targetNickname: string,
) {
  return createAuditLog({
    admin_user_id: adminUserId,
    admin_nickname: adminNickname,
    action: AuditAction.REVOKE_ADMIN,
    target_type: TargetType.USER,
    target_id: targetUserId,
    metadata: {
      target_nickname: targetNickname,
    },
    new_value: {
      is_admin: false,
    },
  });
}

/**
 * 비행 설정 변경 로그
 */
export async function logFlightSettingsUpdate(
  adminUserId: string,
  adminNickname: string,
  oldSettings: {
    speedKmh: number;
    minDuration: number;
    maxDuration: number;
  },
  newSettings: {
    speedKmh: number;
    minDuration: number;
    maxDuration: number;
  },
) {
  return createAuditLog({
    admin_user_id: adminUserId,
    admin_nickname: adminNickname,
    action: AuditAction.UPDATE_FLIGHT_SETTINGS,
    target_type: TargetType.SETTINGS,
    old_value: oldSettings,
    new_value: newSettings,
  });
}
