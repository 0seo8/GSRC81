import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/shared/types/database.types";

/**
 * Comment 타입 정의
 */
export type Comment = Tables<"course_comments">;
export type CommentInsert = TablesInsert<"course_comments">;
export type CommentUpdate = TablesUpdate<"course_comments">;

/**
 * Comment with Photos
 */
export type CommentWithPhotos = Comment & {
  course_comment_photos: Tables<"course_comment_photos">[];
};

/**
 * Comment Repository
 *
 * 댓글 데이터 접근 로직을 중앙화합니다.
 *
 * @example
 * ```typescript
 * // Server Action
 * 'use server';
 * import { createClient } from '@/lib/supabase/server';
 * import { commentRepository } from '@/lib/supabase/repositories/commentRepository';
 *
 * export async function getComments(courseId: string) {
 *   const supabase = await createClient();
 *   return await commentRepository(supabase).getCommentsByCourse(courseId);
 * }
 * ```
 */
export function commentRepository(supabase: SupabaseClient<Database>) {
  return {
    /**
     * 코스별 댓글 조회 (최신순)
     */
    async getCommentsByCourse(courseId: string) {
      const { data, error } = await supabase
        .from("course_comments")
        .select(
          `
          *,
          course_comment_photos (*)
        `,
        )
        .eq("course_id", courseId)
        .eq("is_deleted", false)
        .eq("hidden_by_admin", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CommentWithPhotos[];
    },

    /**
     * 비행 모드용 댓글 조회 (맵에 표시될 댓글만)
     */
    async getVisibleCommentsForFlight(courseId: string) {
      const { data, error } = await supabase
        .from("course_comments")
        .select(
          `
          id,
          author_nickname,
          avatar_url,
          message,
          latitude,
          longitude,
          distance_marker,
          created_at
        `,
        )
        .eq("course_id", courseId)
        .eq("is_deleted", false)
        .eq("hidden_by_admin", false)
        .eq("is_visible_in_flight", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("distance_marker", { ascending: true });

      if (error) throw error;
      return data;
    },

    /**
     * 단일 댓글 조회
     */
    async getCommentById(commentId: string) {
      const { data, error } = await supabase
        .from("course_comments")
        .select(
          `
          *,
          course_comment_photos (*)
        `,
        )
        .eq("id", commentId)
        .single();

      if (error) throw error;
      return data as CommentWithPhotos;
    },

    /**
     * 댓글 생성
     */
    async createComment(comment: CommentInsert) {
      const { data, error } = await supabase
        .from("course_comments")
        .insert(comment)
        .select()
        .single();

      if (error) throw error;
      return data as Comment;
    },

    /**
     * 댓글 수정
     */
    async updateComment(commentId: string, updates: CommentUpdate) {
      const { data, error } = await supabase
        .from("course_comments")
        .update({
          ...updates,
          edited_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .select()
        .single();

      if (error) throw error;
      return data as Comment;
    },

    /**
     * 댓글 삭제 (Soft delete)
     */
    async deleteComment(commentId: string) {
      const { error } = await supabase
        .from("course_comments")
        .update({ is_deleted: true })
        .eq("id", commentId);

      if (error) throw error;
    },

    /**
     * 댓글 좋아요 증가
     */
    async incrementLikes(commentId: string) {
      // @ts-expect-error - RPC 함수 타입 정의 누락
      const { data, error } = await supabase.rpc("increment_comment_likes", {
        comment_id: commentId,
      });

      // RPC 함수가 없으면 수동으로 처리
      if (error?.code === "42883") {
        const { data: comment } = await supabase
          .from("course_comments")
          .select("likes_count")
          .eq("id", commentId)
          .single();

        if (!comment) throw new Error("Comment not found");

        const { data: updated, error: updateError } = await supabase
          .from("course_comments")
          .update({ likes_count: (comment.likes_count || 0) + 1 })
          .eq("id", commentId)
          .select()
          .single();

        if (updateError) throw updateError;
        return updated;
      }

      if (error) throw error;
      return data;
    },

    /**
     * 관리자 댓글 숨기기/표시
     */
    async toggleCommentVisibility(commentId: string, hidden: boolean) {
      const { error } = await supabase
        .from("course_comments")
        .update({ hidden_by_admin: hidden })
        .eq("id", commentId);

      if (error) throw error;
    },

    /**
     * 사용자별 댓글 조회
     */
    async getCommentsByUser(userKey: string) {
      const { data, error } = await supabase
        .from("course_comments")
        .select(
          `
          *,
          courses (
            id,
            title,
            cover_image_url
          )
        `,
        )
        .eq("author_user_key", userKey)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  };
}
