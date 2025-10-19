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

export async function getCourses(): Promise<CourseWithComments[]> {
  try {
    const { data, error } = await supabaseServer
      .from(TABLES.COURSES)
      .select(
        `
        *,
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
        category_key: "jingwan", // 임시로 모든 코스를 진관동러닝으로 설정
      })
    );

    return coursesWithCommentCount;
  } catch (error) {
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
