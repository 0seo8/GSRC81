"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/shared/types/database.types";

/**
 * Client Components용 Supabase 클라이언트
 *
 * 사용처:
 * - 'use client' 컴포넌트
 * - 클라이언트 사이드 인터랙션
 * - 실시간 구독 (Realtime)
 * - React Query와 함께 사용
 *
 * 특징:
 * - 브라우저 localStorage에 세션 저장
 * - 자동 타입 추론 (Database 타입 적용)
 * - Realtime 구독 지원
 *
 * @example
 * ```typescript
 * // Client Component
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 *
 * export function InteractiveMap() {
 *   const supabase = createClient();
 *
 *   useEffect(() => {
 *     const channel = supabase
 *       .channel('courses-changes')
 *       .on('postgres_changes',
 *         { event: '*', schema: 'public', table: 'courses' },
 *         (payload) => console.log('Course changed:', payload)
 *       )
 *       .subscribe();
 *
 *     return () => { channel.unsubscribe(); };
 *   }, []);
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storageKey: "gsrc81-auth-token",
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    },
  );
}

/**
 * Singleton 인스턴스 (선택적)
 *
 * 여러 컴포넌트에서 동일한 클라이언트 인스턴스를 재사용하려면
 * 이 변수를 사용하세요. (메모리 효율적)
 */
let clientInstance: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}
