import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    console.log("Kakao callback started");
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    console.log("Authorization code:", code);
    
    if (!code) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login?error=no_code`);

    // 1️⃣ 카카오 OAuth 토큰 요청
    console.log("Requesting token from Kakao...");
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID!,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
        redirect_uri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI!,
        code,
      }),
    });
    
    const tokenData = await tokenRes.json();
    console.log("Token response:", tokenData);
    
    const kakaoAccessToken = tokenData.access_token;
    
    if (!kakaoAccessToken) {
      console.error("No access token received");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login?error=no_token`);
    }

  // 2️⃣ 유저 정보 가져오기
  const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${kakaoAccessToken}` },
  });
  const userData = await userRes.json();
  
  console.log("Kakao user data:", userData);
  console.log("Token data:", tokenData);
  
  const { id } = userData;
  
  if (!id) {
    console.error("No user ID found in Kakao response");
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login?error=invalid_user`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3️⃣ access_links에서 기존 유저 확인
  const { data: existingUser } = await supabase
    .from("access_links")
    .select("*")
    .eq("kakao_user_id", id.toString())
    .single();

  if (!existingUser) {
    // 최초 로그인 → 접근 코드 입력 페이지로 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/verify?uid=${id}`
    );
  }

  if (!existingUser.is_active) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login?error=not_active`);
  }

  // 4️⃣ 이미 등록된 유저 → 바로 로그인 성공
  // 쿠키로 인증 상태 설정
  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/map`);
  
  const authData = {
    authenticated: true,
    timestamp: Date.now(),
    type: 'kakao'
  };
  
  // 쿠키에 인증 정보 저장 (24시간)
  response.cookies.set('gsrc81-auth', JSON.stringify(authData), {
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    httpOnly: false, // 클라이언트에서 접근 가능하도록
    sameSite: 'lax'
  });
  
  return response;
  } catch (error) {
    console.error("Kakao callback error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login?error=callback_error`);
  }
}