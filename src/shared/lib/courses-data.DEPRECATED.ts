/**
 * ⚠️ DEPRECATED: 이 파일은 더 이상 사용하지 않습니다.
 *
 * 새로운 Repository 패턴을 사용하세요:
 *
 * @example
 * ```typescript
 * // Before (기존 방식)
 * import { getCourses, getCourseById } from '@/shared/lib/courses-data';
 * const courses = await getCourses();
 * const course = await getCourseById(id);
 *
 * // After (새 방식 - Server Components)
 * import { createClient } from '@/lib/supabase/server';
 * import { courseRepository } from '@/lib/supabase/repositories';
 *
 * const supabase = await createClient();
 * const repo = courseRepository(supabase);
 * const courses = await repo.getActiveCourses();
 * const course = await repo.getCourseById(id);
 * ```
 *
 * 마이그레이션 가이드: /src/lib/supabase/README.md
 */

export { getCourses, getCourseById, getCourseCategories } from "./courses-data";
