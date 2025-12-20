import type { NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import { supabaseAdmin } from "./supabase";

// 카카오 프로필 타입 확장 (실제 API 응답 구조 반영)
interface KakaoProfile {
  id: string | number;
  connected_at?: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
      is_default_image?: boolean;
      is_default_nickname?: boolean;
    };
    email?: string;
    profile_image_needs_agreement?: boolean;
    profile_nickname_needs_agreement?: boolean;
    email_needs_agreement?: boolean;
    has_email?: boolean;
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "profile_nickname profile_image account_email",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "kakao" && profile) {
        const kakaoProfile = profile as KakaoProfile;

        // 프로필 이미지 URL 추출 (jwt 콜백과 동일한 우선순위)
        let profileImageUrl =
          kakaoProfile.kakao_account?.profile?.profile_image_url ||
          kakaoProfile.kakao_account?.profile?.thumbnail_image_url ||
          kakaoProfile.properties?.profile_image ||
          null;

        // 보안: http를 https로 변환 (카카오 CDN은 https 지원)
        if (profileImageUrl && profileImageUrl.startsWith("http://")) {
          profileImageUrl = profileImageUrl.replace("http://", "https://");
        }

        // 닉네임 추출
        const nickname =
          kakaoProfile.kakao_account?.profile?.nickname ||
          kakaoProfile.properties?.nickname ||
          null;

        // 디버깅: signIn 콜백에서 받은 프로필 정보 확인
        console.log("🔍 [signIn] 카카오 프로필 정보:", {
          kakaoUserId: user.id,
          nickname,
          profileImageUrl,
          hasProfileAccount: !!kakaoProfile.kakao_account?.profile,
          profileImageNeedsAgreement:
            kakaoProfile.kakao_account?.profile_image_needs_agreement,
        });

        // access_links 테이블에서 사용자 확인 (RLS 우회)
        const { data: existingUsers } = await supabaseAdmin
          .from("access_links")
          .select("*")
          .eq("kakao_user_id", user.id);

        const existingUser =
          existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

        if (!existingUser) {
          // 최초 로그인시 verify 페이지로 리다이렉트
          // false를 반환하면 로그인이 차단되므로 true를 반환하고 redirect 콜백에서 처리
          return true;
        }

        // 기존 사용자의 프로필 정보 업데이트 (닉네임, 프로필 이미지) - RLS 우회
        const { error: updateError } = await supabaseAdmin
          .from("access_links")
          .update({
            kakao_nickname: nickname,
            kakao_profile_url: profileImageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("kakao_user_id", user.id);

        if (updateError) {
          console.error("❌ [signIn] 프로필 업데이트 실패:", updateError);
        } else {
          console.log("✅ [signIn] 프로필 업데이트 성공:", {
            kakaoUserId: user.id,
            nickname,
            profileImageUrl,
          });
        }

        return existingUser.is_active;
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // 콜백 URL이 제공되면 해당 URL 사용
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
    async jwt({ token, account, profile, trigger }) {
      // 카카오 로그인시 프로필 정보를 토큰에 저장
      if (account?.provider === "kakao" && profile) {
        const kakaoProfile = profile as KakaoProfile;
        token.kakaoId = kakaoProfile.id;

        // 카카오 프로필 정보 추가
        token.name =
          kakaoProfile.kakao_account?.profile?.nickname ||
          kakaoProfile.properties?.nickname ||
          null;
        token.email = kakaoProfile.kakao_account?.email || null;

        // 프로필 이미지 우선순위: profile_image_url > thumbnail_image_url > properties
        token.picture =
          kakaoProfile.kakao_account?.profile?.profile_image_url ||
          kakaoProfile.kakao_account?.profile?.thumbnail_image_url ||
          kakaoProfile.properties?.profile_image ||
          null;

        // 보안: http를 https로 변환 (카카오 CDN은 https 지원)
        if (token.picture && token.picture.startsWith("http://")) {
          token.picture = token.picture.replace("http://", "https://");
        }

        // 디버깅: 프로필 이미지 수신 여부 확인
        if (!token.picture) {
          console.warn("⚠️ 카카오 프로필 이미지를 받지 못했습니다.", {
            needsAgreement:
              kakaoProfile.kakao_account?.profile_image_needs_agreement,
            hasProfile: !!kakaoProfile.kakao_account?.profile,
          });
        }
      }

      // update trigger가 호출되거나 처음 로그인할 때 최신 정보를 가져옴 (RLS 우회)
      if (
        token.kakaoId &&
        (trigger === "update" || account?.provider === "kakao")
      ) {
        const { data: userInfo } = await supabaseAdmin
          .from("access_links")
          .select("is_admin, is_active, verified")
          .eq("kakao_user_id", token.kakaoId)
          .single();

        if (userInfo) {
          token.isAdmin = userInfo.is_admin || false;
          token.isVerified = userInfo.verified || false; // verified 컬럼 사용
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.kakaoId) {
        // 카카오 사용자 ID를 세션에 추가
        session.user.id = token.kakaoId as string;

        // 카카오 프로필 정보를 세션에 추가
        session.user.name = token.name as string | null;
        session.user.email = token.email as string | null;
        session.user.image = token.picture as string | null;

        // JWT 토큰에서 최신 정보를 가져옴
        session.user.isVerified = token.isVerified as boolean;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24시간
  },
};
