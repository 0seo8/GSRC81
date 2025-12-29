import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Extend JWT type to include custom fields
interface ExtendedJWT {
  kakaoId?: string;
  isVerified?: boolean;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ 1. Root path immediate redirect
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/map", req.url));
  }

  // ✅ 2. /login 접근 시 이미 로그인된 사용자 자동 리다이렉트
  if (pathname === "/login") {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token) {
      // 이미 로그인됨 - 인증 여부 체크
      const extendedToken = token as ExtendedJWT;
      const isVerified = extendedToken.isVerified === true;
      const kakaoId = extendedToken.kakaoId;

      if (isVerified) {
        // 인증 완료 → /map으로
        return NextResponse.redirect(new URL("/map", req.url));
      } else {
        // 미인증 → /verify로
        return NextResponse.redirect(
          new URL(`/verify?uid=${kakaoId}`, req.url),
        );
      }
    }
    // 로그인 안 됨 → /login 페이지 표시
  }

  // ✅ 3. Public paths (로그인 없이 접근 가능)
  const publicPaths = ["/login", "/verify", "/terms", "/privacy"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Public path가 아니면 로그인 필수
  if (!isPublicPath) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // 로그인 안 됨 → /login으로 리다이렉트
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 로그인은 했지만 인증 안 됨 → /verify로 리다이렉트
    const extendedToken = token as ExtendedJWT;
    const isVerified = extendedToken.isVerified === true;

    if (!isVerified && pathname !== "/verify") {
      const kakaoId = extendedToken.kakaoId;
      return NextResponse.redirect(new URL(`/verify?uid=${kakaoId}`, req.url));
    }
  }

  // ✅ 4. Admin routes handled by AdminContext
  // No need to check here, AdminContext + admin middleware handles it

  // Add pathname to headers for admin layout
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - *.png, *.jpg, *.jpeg, *.svg, *.gif, *.webp (image files)
     * - manifest.json (PWA manifest)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|json)).*)",
  ],
};
