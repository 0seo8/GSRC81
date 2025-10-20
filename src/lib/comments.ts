import { supabase } from "./supabase";

export interface CreateCommentData {
  course_id: string;
  author_nickname: string;
  message: string;
  latitude: number;
  longitude: number;
  distance_marker: number;
  is_visible_in_flight?: boolean;
  author_user_key?: string;
  avatar_url?: string;
}

export interface CourseComment {
  id: string;
  course_id: string;
  author_nickname: string;
  message: string;
  created_at: string;
  likes_count: number;
  avatar_url?: string;
  author_user_key?: string;
  edited_at?: string;
  is_deleted: boolean;
  is_flagged: boolean;
  hidden_by_admin: boolean;
  latitude?: number;
  longitude?: number;
  distance_marker?: number;
  is_visible_in_flight: boolean;
}

/**
 * 새 댓글을 등록합니다
 */
export async function createComment(data: CreateCommentData): Promise<CourseComment> {
  const { data: comment, error } = await supabase
    .from('course_comments')
    .insert({
      course_id: data.course_id,
      author_nickname: data.author_nickname,
      message: data.message,
      latitude: data.latitude,
      longitude: data.longitude,
      distance_marker: data.distance_marker,
      is_visible_in_flight: data.is_visible_in_flight ?? true,
      author_user_key: data.author_user_key,
      avatar_url: data.avatar_url,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    throw new Error('댓글 등록에 실패했습니다.');
  }

  return comment;
}

/**
 * 코스의 댓글 목록을 가져옵니다
 */
export async function getCourseComments(courseId: string): Promise<CourseComment[]> {
  const { data: comments, error } = await supabase
    .from('course_comments')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_deleted', false)
    .eq('hidden_by_admin', false)
    .order('distance_marker', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw new Error('댓글을 불러오는데 실패했습니다.');
  }

  return comments || [];
}

/**
 * 비행모드에서 표시할 댓글만 가져옵니다
 */
export async function getFlightModeComments(courseId: string): Promise<CourseComment[]> {
  const { data: comments, error } = await supabase
    .from('course_comments')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_deleted', false)
    .eq('hidden_by_admin', false)
    .eq('is_visible_in_flight', true)
    .order('distance_marker', { ascending: true });

  if (error) {
    console.error('Error fetching flight mode comments:', error);
    throw new Error('비행모드 댓글을 불러오는데 실패했습니다.');
  }

  return comments || [];
}