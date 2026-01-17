import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/shared/types/database.types";

/**
 * Course 타입 정의
 */
export type Course = Tables<"courses">;
export type CourseInsert = TablesInsert<"courses">;
export type CourseUpdate = TablesUpdate<"courses">;

/**
 * Course with Relations (JOIN 결과)
 */
export type CourseWithCategory = Course & {
  course_categories: Tables<"course_categories"> | null;
};

export type CourseWithDetails = CourseWithCategory & {
  course_comments: Tables<"course_comments">[];
  course_photos: Tables<"course_photos">[];
};

/**
 * 맵 렌더링에 필요한 최소 코스 데이터
 */
export type CourseForMap = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  distance_km: number;
  elevation_gain: number | null;
  gpx_data: unknown;
  start_latitude: number;
  start_longitude: number;
  cover_image_url: string | null;
  category_id: string | null;
  course_categories: {
    key: string;
    name: string;
  } | null;
};

/**
 * Course Repository
 *
 * 코스 데이터 접근 로직을 중앙화합니다.
 * Server Components, Client Components, Server Actions 모두에서 사용 가능합니다.
 *
 * @example
 * ```typescript
 * // Server Component
 * import { createClient } from '@/lib/supabase/server';
 * import { courseRepository } from '@/lib/supabase/repositories/courseRepository';
 *
 * const supabase = await createClient();
 * const courses = await courseRepository(supabase).getActiveCourses();
 * ```
 */
export function courseRepository(supabase: SupabaseClient<Database>) {
  return {
    /**
     * 활성화된 모든 코스 조회 (카테고리 포함)
     */
    async getActiveCourses() {
      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          *,
          course_categories (
            id,
            key,
            name,
            description,
            cover_image_url,
            sort_order
          )
        `,
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CourseWithCategory[];
    },

    /**
     * 카테고리별 코스 조회
     */
    async getCoursesByCategory(categoryId: string) {
      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          *,
          course_categories (*)
        `,
        )
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as CourseWithCategory[];
    },

    /**
     * 단일 코스 조회 (상세 정보 포함)
     */
    async getCourseById(courseId: string) {
      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          *,
          course_categories (*),
          course_comments (
            *,
            course_comment_photos (*)
          ),
          course_photos (*)
        `,
        )
        .eq("id", courseId)
        .single();

      if (error) throw error;
      return data as CourseWithDetails;
    },

    /**
     * GPX 데이터와 함께 코스 조회 (맵 렌더링용)
     */
    async getCoursesForMap() {
      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          id,
          title,
          description,
          difficulty,
          distance_km,
          elevation_gain,
          gpx_data,
          start_latitude,
          start_longitude,
          cover_image_url,
          category_id,
          course_categories (
            key,
            name
          )
        `,
        )
        .eq("is_active", true)
        .not("gpx_data", "is", null)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as CourseForMap[];
    },

    /**
     * 코스 검색 (제목, 설명, 태그)
     */
    async searchCourses(query: string) {
      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          *,
          course_categories (*)
        `,
        )
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as CourseWithCategory[];
    },

    /**
     * 코스 생성 (Admin용)
     */
    async createCourse(course: CourseInsert) {
      const { data, error } = await supabase
        .from("courses")
        .insert(course)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },

    /**
     * 코스 업데이트 (Admin용)
     */
    async updateCourse(courseId: string, updates: CourseUpdate) {
      const { data, error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", courseId)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },

    /**
     * 코스 삭제 (Soft delete - is_active를 false로)
     */
    async deleteCourse(courseId: string) {
      const { error } = await supabase
        .from("courses")
        .update({ is_active: false })
        .eq("id", courseId);

      if (error) throw error;
    },

    /**
     * 코스 통계 조회
     */
    async getCourseStats(courseId: string) {
      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          id,
          title,
          distance_km,
          elevation_gain,
          course_comments:course_comments(count),
          course_photos:course_photos(count)
        `,
        )
        .eq("id", courseId)
        .single();

      if (error) throw error;
      return data;
    },
  };
}
