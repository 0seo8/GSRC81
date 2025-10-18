"use client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // 미들웨어에서 인증을 처리하므로 여기서는 단순히 children 렌더링
  return <>{children}</>;
}
