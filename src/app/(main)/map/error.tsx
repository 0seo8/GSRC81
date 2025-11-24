"use client";

import { useEffect } from "react";
import { MapError } from "@/components/map/map-error";

/**
 * Map 페이지 에러 UI
 * Next.js가 자동으로 Error Boundary로 감싸서 사용
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 에러 추적 서비스로 전송)
    console.error("Map page error:", error);
  }, [error]);

  return <MapError onReset={reset} />;
}