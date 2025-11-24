/**
 * User Verification Utilities
 * 사용자 인증 코드 검증 관련 유틸리티 함수
 */

import { supabase } from "@/lib/supabase";

export interface VerificationResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    kakao_user_id: string;
    access_code: string;
    is_active: boolean;
  };
}

/**
 * 사용자가 이미 검증되었는지 확인
 * @param kakaoUserId - 카카오 사용자 ID
 * @returns 검증 여부
 */
export async function isUserVerified(
  kakaoUserId: string,
): Promise<boolean> {
  if (!kakaoUserId) return false;

  const { data, error } = await supabase
    .from("access_links")
    .select("*")
    .eq("kakao_user_id", kakaoUserId)
    .single();

  return !error && !!data;
}

/**
 * 접근 코드 검증 및 사용자 연결
 * @param code - 접근 코드
 * @param kakaoUserId - 카카오 사용자 ID
 * @returns 검증 결과
 */
export async function verifyAccessCode(
  code: string,
  kakaoUserId: string,
): Promise<VerificationResult> {
  if (!code || !kakaoUserId) {
    return {
      success: false,
      error: "접근 코드와 사용자 ID가 필요합니다.",
    };
  }

  // 1. 접근 코드 유효성 확인
  const { data: accessLink, error: fetchError } = await supabase
    .from("access_links")
    .select("*")
    .eq("access_code", code)
    .single();

  if (fetchError || !accessLink) {
    return {
      success: false,
      error: "유효하지 않은 접근 코드입니다.",
    };
  }

  // 2. 이미 사용된 코드인지 확인
  if (accessLink.kakao_user_id && accessLink.kakao_user_id !== kakaoUserId) {
    return {
      success: false,
      error: "이미 사용된 접근 코드입니다.",
    };
  }

  // 3. 사용자 ID 연결 및 활성화
  const { data: updatedLink, error: updateError } = await supabase
    .from("access_links")
    .update({
      kakao_user_id: kakaoUserId,
      kakao_nickname: null,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accessLink.id)
    .select()
    .single();

  if (updateError || !updatedLink) {
    return {
      success: false,
      error: "인증 처리 중 오류가 발생했습니다.",
    };
  }

  return {
    success: true,
    data: updatedLink,
  };
}

/**
 * 사용자의 검증 정보 가져오기
 * @param kakaoUserId - 카카오 사용자 ID
 * @returns 검증 정보
 */
export async function getUserVerificationData(kakaoUserId: string) {
  if (!kakaoUserId) return null;

  const { data, error } = await supabase
    .from("access_links")
    .select("*")
    .eq("kakao_user_id", kakaoUserId)
    .single();

  if (error) return null;
  return data;
}