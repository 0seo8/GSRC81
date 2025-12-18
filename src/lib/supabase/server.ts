import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/shared/types/database.types";

/**
 * Server Components용 Supabase 클라이언트
 *
 * 사용처:
 * - Server Components (app/ 디렉토리의 async 컴포넌트)
 * - Server Actions
 * - Route Handlers
 *
 * 특징:
 * - cookies()를 통한 세션 관리 (RLS 정책 적용)
 * - 자동 타입 추론 (Database 타입 적용)
 * - SSR 최적화
 *
 * @example
 * ```typescript
 * // Server Component
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function CoursesPage() {
 *   const supabase = await createClient();
 *   const { data: courses } = await supabase
 *     .from('courses')
 *     .select('*');
 *   return <CourseList courses={courses} />;
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // SSR/SSG 환경에서 쿠키 설정 실패는 무시
            // (Server Component에서는 읽기만 가능)
          }
        },
      },
    },
  );
}

/**
 * Admin용 Service Role 클라이언트
 *
 * 사용처:
 * - RLS를 우회해야 하는 관리자 작업
 * - 백그라운드 작업
 * - Cross-user 쿼리
 *
 * ⚠️ 주의: Client Components에서 절대 사용 금지
 *
 * @example
 * ```typescript
 * // Server Action
 * 'use server';
 * import { createAdminClient } from '@/lib/supabase/server';
 *
 * export async function deleteUserData(userId: string) {
 *   const supabase = createAdminClient();
 *   await supabase.from('access_links').delete().eq('id', userId);
 * }
 * ```
 */
export function createAdminClient() {
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Admin client는 쿠키 사용 안함
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
