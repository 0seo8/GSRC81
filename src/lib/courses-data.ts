import { createClient } from "@supabase/supabase-js";
import { TABLES } from "./supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables:", {
    supabaseUrl: supabaseUrl ? "✓ Set" : "✗ Missing",
    supabaseAnonKey: supabaseAnonKey ? "✓ Set" : "✗ Missing",
  });
  throw new Error("Missing Supabase environment variables");
}

console.log("Supabase config:", {
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length || 0,
});

// 서버 전용 Supabase 클라이언트 (ANON 키 사용, 타임아웃 추가)
const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { 
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: { params: { eventsPerSecond: 10 } },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10초 타임아웃
      });
    },
  },
});

import { Course } from "@/types";

export interface CourseWithComments extends Course {
  comment_count: number;
  start_latitude: number;
  start_longitude: number;
  category_key?: string;
}

// Supabase select 결과 레코드 타입
interface SupabaseCourseRow {
  id: string;
  title: string;
  description?: string;
  distance_km: number;
  difficulty: Course["difficulty"];
  start_latitude: number;
  start_longitude: number;
  cover_image_url?: string;
  created_at: string;
  is_active: boolean;
  course_categories?: { key?: string } | { key?: string }[] | null;
  course_comments?: { count: number }[] | null;
}

export async function getCourses(
  categoryKey?: string,
): Promise<CourseWithComments[]> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to fetch courses (attempt ${attempt}/${maxRetries})`);
      
      const { data, error } = await supabaseServer
        .from(TABLES.COURSES)
        .select(
          `
          id,
          title,
          description,
          distance_km,
          difficulty,
          start_latitude,
          start_longitude,
          cover_image_url,
          created_at,
          is_active,
          course_categories(key),
          course_comments(count)
        `,
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(`Failed to fetch courses (attempt ${attempt}):`, error);
        lastError = new Error(`Failed to fetch courses: ${error.message}`);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // 재시도 전 대기
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      if (!data) {
        return [];
      }

      const rows = (data ?? []) as SupabaseCourseRow[];
      const coursesWithCommentCount: CourseWithComments[] = rows.map(
        (course) => ({
          ...course,
          comment_count: course.course_comments?.[0]?.count || 0,
          category_key: Array.isArray(course.course_categories)
            ? (course.course_categories[0]?.key ?? "jingwan")
            : (course.course_categories?.key ?? "jingwan"), // JOIN된 카테고리 키 사용, 없으면 기본값
        }),
      );

      // 카테고리 필터링 (기본값: "jingwan")
      const targetCategory = categoryKey || "jingwan";
      const filteredCourses = coursesWithCommentCount.filter(
        (course) => course.category_key === targetCategory,
      );

      console.log(`Successfully fetched ${filteredCourses.length} courses`);
      return filteredCourses;

    } catch (error) {
      console.error(`Network error on attempt ${attempt}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  // 이 부분에 도달할 일은 없지만 TypeScript를 위해 추가
  throw lastError || new Error("Failed to fetch courses after all retries");
}

export interface CourseCategory {
  id: string;
  key: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export async function getCourseCategories(): Promise<CourseCategory[]> {
  try {
    const { data, error } = await supabaseServer
      .from(TABLES.COURSE_CATEGORIES)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Failed to fetch course categories:", error);
      throw new Error(`Failed to fetch course categories: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCourseCategories:", error);
    throw error;
  }
}

export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const { data, error } = await supabaseServer
      .from(TABLES.COURSES)
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No rows found
      }
      console.error("Failed to fetch course:", error);
      throw new Error(`Failed to fetch course: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in getCourseById:", error);
    throw error;
  }
}
