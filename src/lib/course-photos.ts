import { supabase } from "./supabase";
import { createClient } from "@supabase/supabase-js";

// Service Role 클라이언트 (RLS 우회용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // 임시로 ANON 키 사용

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface CoursePhoto {
  id: string;
  course_id: string;
  user_id?: string;
  file_url: string;
  caption?: string;
  created_at: string;
}

export interface CreateCoursePhotoData {
  course_id: string;
  user_id?: string;
  file_url: string;
  caption?: string;
}

/**
 * 코스의 사진 목록을 가져옵니다
 */
export async function getCoursePhotos(
  courseId: string,
): Promise<CoursePhoto[]> {
  const { data: photos, error } = await supabase
    .from("course_photos")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching course photos:", error);
    throw new Error("코스 사진을 불러오는데 실패했습니다.");
  }

  return photos || [];
}

/**
 * 새 코스 사진을 등록합니다
 */
export async function createCoursePhoto(
  data: CreateCoursePhotoData,
): Promise<CoursePhoto> {
  const { data: photo, error } = await supabase
    .from("course_photos")
    .insert({
      course_id: data.course_id,
      user_id: data.user_id,
      file_url: data.file_url,
      caption: data.caption,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating course photo:", error);
    throw new Error("사진 등록에 실패했습니다.");
  }

  return photo;
}

/**
 * 코스 사진을 삭제합니다
 */
export async function deleteCoursePhoto(photoId: string): Promise<void> {
  const { error } = await supabase
    .from("course_photos")
    .delete()
    .eq("id", photoId);

  if (error) {
    console.error("Error deleting course photo:", error);
    throw new Error("사진 삭제에 실패했습니다.");
  }
}

/**
 * 코스 사진 개수를 가져옵니다
 */
export async function getCoursePhotosCount(courseId: string): Promise<number> {
  const { count, error } = await supabase
    .from("course_photos")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  if (error) {
    console.error("Error counting course photos:", error);
    return 0;
  }

  return count || 0;
}
