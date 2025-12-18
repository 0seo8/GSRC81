import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/shared/types/database.types";

/**
 * Category 타입 정의
 */
export type Category = Tables<"course_categories">;

/**
 * Category with Course Count
 */
export type CategoryWithCount = Category & {
  course_count: number;
};

/**
 * Category Repository
 *
 * 카테고리 데이터 접근 로직을 중앙화합니다.
 *
 * @example
 * ```typescript
 * // Server Component
 * import { createClient } from '@/lib/supabase/server';
 * import { categoryRepository } from '@/lib/supabase/repositories/categoryRepository';
 *
 * const supabase = await createClient();
 * const categories = await categoryRepository(supabase).getActiveCategories();
 * ```
 */
export function categoryRepository(supabase: SupabaseClient<Database>) {
  return {
    /**
     * 활성화된 모든 카테고리 조회
     */
    async getActiveCategories() {
      const { data, error } = await supabase
        .from("course_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },

    /**
     * 카테고리별 코스 수 포함 조회
     */
    async getCategoriesWithCounts() {
      const { data, error } = await supabase
        .from("course_categories")
        .select(
          `
          *,
          courses:courses(count)
        `,
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      // Transform count aggregation
      return data.map((category) => ({
        ...category,
        course_count: Array.isArray(category.courses)
          ? category.courses.length
          : (category.courses as unknown as { count: number })?.count || 0,
      })) as CategoryWithCount[];
    },

    /**
     * Key로 카테고리 조회
     */
    async getCategoryByKey(key: string) {
      const { data, error } = await supabase
        .from("course_categories")
        .select("*")
        .eq("key", key)
        .single();

      if (error) throw error;
      return data as Category;
    },

    /**
     * ID로 카테고리 조회
     */
    async getCategoryById(id: string) {
      const { data, error } = await supabase
        .from("course_categories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Category;
    },
  };
}
