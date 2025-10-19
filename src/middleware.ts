import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 인증이 필요한 페이지들
  const protectedPaths = ["/map", "/courses", "/admin"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // 인증이 필요하지 않은 페이지는 그대로 진행
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // 쿠키에서 인증 정보 확인
  const authCookie = request.cookies.get("gsrc81-auth");

  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.value);
      const isValid = Date.now() - authData.timestamp < 24 * 60 * 60 * 1000; // 24시간

      if (isValid && authData.authenticated) {
        return NextResponse.next();
      }
    } catch (error) {
      console.error("Middleware auth parse error:", error);
    }
  }

  // 인증이 없거나 유효하지 않으면 로그인 페이지로 리다이렉트
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
