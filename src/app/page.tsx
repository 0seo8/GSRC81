"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 미들웨어에서 인증을 처리하므로 바로 /map으로 리다이렉트
    router.replace("/map");
  }, [router]);

  // 로딩 화면
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col justify-center items-center">
      <div className="mb-4">
        <h1 className="text-black text-xl font-semibold tracking-wide text-center">
          GSRC81 MAPS
        </h1>
      </div>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
    </div>
  );
}
