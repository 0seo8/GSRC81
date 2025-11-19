import type { NextAuthOptions } from "next-auth"
import KakaoProvider from "next-auth/providers/kakao"
import { supabase } from "./supabase"

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

        const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;
        
        if (!existingUser) {
          // 최초 로그인시 verify 페이지로 리다이렉트하기 위해 false 반환
          return `/verify?uid=${user.id}`;
        }

        if (!existingUser.is_active) {
          return false;
        }

        return true;
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      // 카카오 로그인시 프로필 정보를 토큰에 저장
      if (account?.provider === "kakao" && profile) {
        token.kakaoId = profile.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.kakaoId) {
        // 카카오 사용자 ID를 세션에 추가
        session.user.id = token.kakaoId as string;
        
        // 추가 사용자 정보가 필요하면 여기서 설정
        const { data: userInfo } = await supabase
          .from("access_links")
          .select("*")
          .eq("kakao_user_id", token.kakaoId)
          .single();

        if (userInfo) {
          session.user.isVerified = userInfo.is_active;
        }
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
}