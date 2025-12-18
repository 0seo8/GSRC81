/**
 * Repository 패턴 중앙 Export
 *
 * 모든 Repository를 한 곳에서 import할 수 있습니다.
 *
 * @example
 * ```typescript
 * import { courseRepository, commentRepository } from '@/lib/supabase/repositories';
 * import { createClient } from '@/lib/supabase/server';
 *
 * const supabase = await createClient();
 * const courses = await courseRepository(supabase).getActiveCourses();
 * const comments = await commentRepository(supabase).getCommentsByCourse(courseId);
 * ```
 */

export * from "./courseRepository";
export * from "./commentRepository";
export * from "./categoryRepository";
