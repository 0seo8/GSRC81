"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

/**
 * 세션 자동 갱신 컴포넌트
 * - 마운트 시 한 번만 세션 업데이트 실행
 * - isAdmin, isVerified 필드가 없는 기존 세션을 갱신
 */
export function SessionRefresher() {
  const { data: session, update } = useSession();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    // 이미 갱신했거나 세션이 없으면 스킵
    if (hasRefreshed.current || !session?.user) return;

    // isAdmin 또는 isVerified가 undefined인 경우에만 갱신
    if (
      session.user.isAdmin === undefined ||
      session.user.isVerified === undefined
    ) {
      console.log("🔄 세션 갱신 중... (isAdmin, isVerified 필드 추가)");
      update();
      hasRefreshed.current = true;
    }
  }, [session, update]);

  return null; // UI 없음
}
