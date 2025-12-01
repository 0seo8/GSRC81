import type { NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import { supabase } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "kakao") {
        // access_links 테이블에서 사용자 확인
        const { data: existingUsers } = await supabase
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

        if (!existingUser.is_active) {
          return false;
        }

        return true;
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
        token.kakaoId = profile.id;

        // 카카오 프로필 정보 추가
        token.name = profile.kakao_account?.profile?.nickname || profile.properties?.nickname || null;
        token.email = profile.kakao_account?.email || null;
        token.picture = profile.kakao_account?.profile?.profile_image_url || profile.properties?.profile_image || null;
      }

      // update trigger가 호출되거나 처음 로그인할 때 최신 정보를 가져옴
      if (token.kakaoId && (trigger === "update" || account?.provider === "kakao")) {
        const { data: userInfo } = await supabase
          .from("access_links")
          .select("is_admin, is_active")
          .eq("kakao_user_id", token.kakaoId)
          .single();

        if (userInfo) {
          token.isAdmin = userInfo.is_admin || false;
          token.isVerified = userInfo.is_active;
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
