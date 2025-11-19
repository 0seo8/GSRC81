import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware() {
    // 추가적인 미들웨어 로직이 필요하면 여기에
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // 인증이 필요한 페이지들
        const protectedPaths = ["/map", "/courses", "/admin"];
        const isProtectedPath = protectedPaths.some((path) =>
          pathname.startsWith(path),
        );

        // 인증이 필요하지 않은 페이지는 허용
        if (!isProtectedPath) {
          return true;
        }

        // 보호된 페이지는 토큰 필요
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
)

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
