/**
 * User Verification Utilities
 *
 * 간단한 아키텍처:
 * - access_codes 테이블에 코드 정보 저장
 * - access_links.access_code_id FK로 연결
 * - 사용자는 최초 1회만 인증
 */

import { supabase } from "@/shared/lib/supabase";

export interface VerificationResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    kakao_user_id: string;
    is_active: boolean;
    is_admin: boolean;
    verified: boolean;
  };
}

/**
 * 사용자가 이미 검증되었는지 확인
 * @param kakaoUserId - 카카오 사용자 ID
 * @returns 검증 여부
 */
export async function isUserVerified(kakaoUserId: string): Promise<boolean> {
  if (!kakaoUserId) return false;

  const { data, error } = await supabase
    .from("access_links")
    .select("id, is_active, verified")
    .eq("kakao_user_id", kakaoUserId)
    .maybeSingle();

  // verified = true인 사용자만 인증된 것으로 간주
  return !error && !!data && data.is_active && data.verified === true;
}

/**
 * 접근 코드 검증 및 사용자 등록
 *
 * 플로우:
 * 1. 이미 인증된 사용자인지 확인 (kakao_user_id로 조회)
 * 2. 신규 사용자면 access_codes 테이블에서 코드 유효성 확인
 * 3. access_links 레코드 생성 (access_code_id FK 저장)
 *
 * @param code - 사용자가 입력한 접근 코드
 * @param kakaoUserId - 카카오 사용자 ID
 * @param kakaoNickname - 카카오 닉네임 (선택)
 * @param kakaoProfileUrl - 카카오 프로필 URL (선택)
 * @returns 검증 결과
 */
export async function verifyAccessCode(
  code: string,
  kakaoUserId: string,
  kakaoNickname?: string,
  kakaoProfileUrl?: string,
): Promise<VerificationResult> {
  if (!code || !kakaoUserId) {
    return {
      success: false,
      error: "접근 코드와 사용자 ID가 필요합니다.",
    };
  }

  // 1. 이미 인증된 사용자인지 확인
  const { data: existingUser } = await supabase
    .from("access_links")
    .select("*")
    .eq("kakao_user_id", kakaoUserId)
    .maybeSingle();

  if (existingUser) {
    if (!existingUser.is_active) {
      return {
        success: false,
        error: "비활성화된 계정입니다. 관리자에게 문의하세요.",
      };
    }

    return {
      success: true,
      data: {
        id: existingUser.id,
        kakao_user_id: existingUser.kakao_user_id,
        is_active: existingUser.is_active,
        is_admin: existingUser.is_admin || false,
        verified: existingUser.verified || false,
      },
    };
  }

  // 2. 신규 사용자 - access_codes 테이블에서 코드 조회
  const { data: accessCode, error: codeError } = await supabase
    .from("access_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (codeError || !accessCode) {
    return {
      success: false,
      error: "유효하지 않은 접근 코드입니다.",
    };
  }

  // 활성화 상태 확인
  if (!accessCode.is_active) {
    return {
      success: false,
      error: "비활성화된 접근 코드입니다.",
    };
  }

  // 만료일 확인
  if (accessCode.expires_at) {
    const expiryDate = new Date(accessCode.expires_at);
    if (expiryDate < new Date()) {
      return {
        success: false,
        error: "만료된 접근 코드입니다.",
      };
    }
  }

  // 3. access_links 레코드 생성 (코드 인증 사용자)
  const { data: newUser, error: insertError } = await supabase
    .from("access_links")
    .insert({
      access_code_id: accessCode.id,
      kakao_user_id: kakaoUserId,
      kakao_nickname: kakaoNickname || null,
      kakao_profile_url: kakaoProfileUrl || null,
      is_admin: false,
      is_active: true,
      verified: true, // 코드 인증 사용자는 verified = true
    })
    .select()
    .single();

  if (insertError || !newUser) {
    console.error("User creation error:", insertError);
    return {
      success: false,
      error: "사용자 등록 중 오류가 발생했습니다.",
    };
  }

  return {
    success: true,
    data: {
      id: newUser.id,
      kakao_user_id: newUser.kakao_user_id,
      is_active: newUser.is_active,
      is_admin: newUser.is_admin || false,
      verified: newUser.verified || false,
    },
  };
}

/**
 * 게스트 사용자 생성
 *
 * @param kakaoUserId - 카카오 사용자 ID
 * @param kakaoNickname - 카카오 닉네임 (선택)
 * @param kakaoProfileUrl - 카카오 프로필 URL (선택)
 * @returns 검증 결과
 */
export async function createGuestUser(
  kakaoUserId: string,
  kakaoNickname?: string,
  kakaoProfileUrl?: string,
): Promise<VerificationResult> {
  if (!kakaoUserId) {
    return {
      success: false,
      error: "사용자 ID가 필요합니다.",
    };
  }

  // 1. 이미 등록된 사용자인지 확인
  const { data: existingUser } = await supabase
    .from("access_links")
    .select("*")
    .eq("kakao_user_id", kakaoUserId)
    .maybeSingle();

  if (existingUser) {
    // 이미 등록된 사용자 (게스트 또는 인증 사용자)
    return {
      success: true,
      data: {
        id: existingUser.id,
        kakao_user_id: existingUser.kakao_user_id,
        is_active: existingUser.is_active,
        is_admin: existingUser.is_admin || false,
        verified: existingUser.verified || false,
      },
    };
  }

  // 2. 새로운 게스트 사용자 생성
  const { data: newGuest, error: insertError } = await supabase
    .from("access_links")
    .insert({
      access_code_id: null, // 게스트는 코드 없음
      kakao_user_id: kakaoUserId,
      kakao_nickname: kakaoNickname || null,
      kakao_profile_url: kakaoProfileUrl || null,
      is_admin: false,
      is_active: true,
      verified: false, // 게스트는 verified = false
    })
    .select()
    .single();

  if (insertError || !newGuest) {
    console.error("Guest user creation error:", insertError);
    return {
      success: false,
      error: "게스트 사용자 등록 중 오류가 발생했습니다.",
    };
  }

  return {
    success: true,
    data: {
      id: newGuest.id,
      kakao_user_id: newGuest.kakao_user_id,
      is_active: newGuest.is_active,
      is_admin: newGuest.is_admin || false,
      verified: newGuest.verified || false,
    },
  };
}
