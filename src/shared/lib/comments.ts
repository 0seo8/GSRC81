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
export async function createComment(
  data: CreateCommentData,
): Promise<CourseComment> {
  const { data: comment, error } = await supabase
    .from("course_comments")
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
    console.error("Error creating comment:", error);
    throw new Error("댓글 등록에 실패했습니다.");
  }

  return comment;
}

/**
 * 코스의 댓글 목록을 가져옵니다
 */
export async function getCourseComments(
  courseId: string,
): Promise<CourseComment[]> {
  const { data: comments, error } = await supabase
    .from("course_comments")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_deleted", false)
    .eq("hidden_by_admin", false)
    .order("distance_marker", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    throw new Error("댓글을 불러오는데 실패했습니다.");
  }

  return comments || [];
}

/**
 * 비행모드에서 표시할 댓글만 가져옵니다
 */
export async function getFlightModeComments(
  courseId: string,
): Promise<CourseComment[]> {
  const { data: comments, error } = await supabase
    .from("course_comments")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_deleted", false)
    .eq("hidden_by_admin", false)
    .eq("is_visible_in_flight", true)
    .order("distance_marker", { ascending: true });

  if (error) {
    console.error("Error fetching flight mode comments:", error);
    throw new Error("비행모드 댓글을 불러오는데 실패했습니다.");
  }

  return comments || [];
}

/**
 * 댓글을 수정합니다 (본인만 가능)
 */
export async function updateComment(
  commentId: string,
  message: string,
  authorUserKey: string,
): Promise<CourseComment> {
  // 메시지 검증
  if (!message || message.length > 200) {
    throw new Error("메시지는 1~200자 사이여야 합니다.");
  }

  // 본인 확인 및 수정
  const { data: comment, error } = await supabase
    .from("course_comments")
    .update({
      message: message.trim(),
      edited_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .eq("author_user_key", authorUserKey) // 본인만 수정 가능
    .select()
    .single();

  if (error) {
    console.error("Error updating comment:", error);
    throw new Error(
      "댓글 수정에 실패했습니다. 본인의 댓글만 수정할 수 있습니다.",
    );
  }

  return comment;
}

/**
 * 댓글을 삭제합니다 (소프트 삭제)
 */
export async function deleteComment(
  commentId: string,
  authorUserKey: string,
): Promise<void> {
  const { error } = await supabase
    .from("course_comments")
    .update({
      is_deleted: true,
      message: "[삭제된 댓글입니다]",
    })
    .eq("id", commentId)
    .eq("author_user_key", authorUserKey); // 본인만 삭제 가능

  if (error) {
    console.error("Error deleting comment:", error);
    throw new Error(
      "댓글 삭제에 실패했습니다. 본인의 댓글만 삭제할 수 있습니다.",
    );
  }
}
