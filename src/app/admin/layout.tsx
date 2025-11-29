import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/lib/auth";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // 로그인 페이지는 권한 체크하지 않음
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const session = await getServerSession(authOptions);

  // 로그인하지 않은 경우
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  // 관리자가 아닌 경우
  if (!session.user.isAdmin) {
    redirect("/map?error=unauthorized");
  }

  return <>{children}</>;
}