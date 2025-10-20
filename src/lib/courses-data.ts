import { createClient } from "@supabase/supabase-js";
import { TABLES } from "./supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// 서버 전용 Supabase 클라이언트 (캐싱 최적화됨)
const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
});

import { Course } from "@/types";

export interface CourseWithComments extends Course {
  comment_count: number;
  start_latitude: number;
  start_longitude: number;
  category_key?: string;
}

export async function getCourses(
  categoryKey?: string
): Promise<CourseWithComments[]> {
  try {
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
        course_categories(key),
        course_comments(count)
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch courses:", error);
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    const coursesWithCommentCount: CourseWithComments[] = data.map(
      (course: any) => ({
        ...course,
        comment_count: course.course_comments?.[0]?.count || 0,
        category_key: course.course_categories?.key || "jingwan", // JOIN된 카테고리 키 사용, 없으면 기본값
      })
    );

    // 카테고리 필터링 (기본값: "jingwan")
    const targetCategory = categoryKey || "jingwan";
    const filteredCourses = coursesWithCommentCount.filter(
      (course) => course.category_key === targetCategory
    );

    return filteredCourses;
  } catch (error) {
    throw error;
  }
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
