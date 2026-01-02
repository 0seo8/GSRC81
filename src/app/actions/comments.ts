"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  commentRepository,
  type CommentInsert,
  type CommentUpdate,
} from "@/lib/supabase/repositories";

/**
 * Server Actions for Comment Mutations
 *
 * Next.js 15 Server Actions를 사용한 댓글 데이터 변경
 *
 * 특징:
 * - 'use server' 지시자로 서버 사이드 실행 보장
 * - revalidatePath()로 자동 캐시 무효화
 * - TypeScript 타입 안전성
 * - 클라이언트에서 직접 호출 가능
 *
 * @example
 * ```typescript
 * // Client Component
 * 'use client';
 * import { createCommentAction } from '@/app/actions/comments';
 *
 * async function handleSubmit(formData: FormData) {
 *   const result = await createCommentAction(formData);
 *   if (result.error) {
 *     console.error(result.error);
 *   } else {
 *     console.log('Comment created:', result.data);
 *   }
 * }
 * ```
 */

/**
 * 댓글 생성
 */
export async function createCommentAction(formData: FormData) {
  try {
    const courseId = formData.get("courseId") as string;
    const authorNickname = formData.get("authorNickname") as string;
    const message = formData.get("message") as string;
    const authorUserKey = formData.get("authorUserKey") as string | null;
    const avatarUrl = formData.get("avatarUrl") as string | null;
    const latitude = formData.get("latitude") as string | null;
    const longitude = formData.get("longitude") as string | null;
    const distanceMarker = formData.get("distanceMarker") as string | null;

    if (!courseId || !authorNickname || !message) {
      return { error: "필수 필드가 누락되었습니다" };
    }

    const supabase = await createClient();
    const repo = commentRepository(supabase);

    const newComment: CommentInsert = {
      course_id: courseId,
      author_nickname: authorNickname,
      message,
      author_user_key: authorUserKey,
      avatar_url: avatarUrl,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      distance_marker: distanceMarker ? parseFloat(distanceMarker) : null,
    };

    const comment = await repo.createComment(newComment);

    // 캐시 무효화 (해당 코스 페이지 자동 업데이트)
    revalidatePath(`/courses/${courseId}`);
    revalidatePath("/courses"); // 목록 페이지도 업데이트

    return { data: comment, error: null };
  } catch (error) {
    console.error("Error creating comment:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "댓글 생성 중 오류가 발생했습니다",
      data: null,
    };
  }
}

/**
 * 댓글 수정
 * Admin 클라이언트를 사용하여 RLS 정책 우회 (본인 댓글만 수정 가능)
 */
export async function updateCommentAction(
  commentId: string,
  message: string,
  authorUserKey: string,
) {
  try {
    if (!message || !message.trim()) {
      return { error: "메시지는 필수입니다", data: null };
    }

    if (message.length > 200) {
      return { error: "메시지는 200자 이하여야 합니다", data: null };
    }

    // Admin 클라이언트 사용 (RLS 우회)
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    // 먼저 댓글 조회하여 본인 확인
    const { data: existingComment, error: fetchError } = await supabase
      .from("course_comments")
      .select("*")
      .eq("id", commentId)
      .single();

    if (fetchError || !existingComment) {
      return { error: "댓글을 찾을 수 없습니다", data: null };
    }

    // 본인 확인
    if (existingComment.author_user_key !== authorUserKey) {
      return { error: "본인의 댓글만 수정할 수 있습니다", data: null };
    }

    // 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from("course_comments")
      .update({
        message: message.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating comment:", updateError);
      throw updateError;
    }

    revalidatePath(`/courses/${existingComment.course_id}`);

    return { data: updatedComment, error: null };
  } catch (error) {
    console.error("Error updating comment:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "댓글 수정 중 오류가 발생했습니다",
      data: null,
    };
  }
}

/**
 * 댓글 삭제 (Soft delete)
 */
export async function deleteCommentAction(commentId: string, userKey: string) {
  try {
    const supabase = await createClient();
    const repo = commentRepository(supabase);

    // 권한 확인
    const comment = await repo.getCommentById(commentId);

    if (comment.author_user_key !== userKey) {
      return { error: "권한이 없습니다" };
    }

    await repo.deleteComment(commentId);

    revalidatePath(`/courses/${comment.course_id}`);

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "댓글 삭제 중 오류가 발생했습니다",
      success: false,
    };
  }
}

/**
 * 댓글 좋아요
 */
export async function likeCommentAction(commentId: string, courseId: string) {
  try {
    const supabase = await createClient();
    const repo = commentRepository(supabase);

    await repo.incrementLikes(commentId);

    revalidatePath(`/courses/${courseId}`);

    return { success: true, error: null };
  } catch (error) {
    console.error("Error liking comment:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "좋아요 중 오류가 발생했습니다",
      success: false,
    };
  }
}

/**
 * 관리자 전용: 댓글 숨기기/표시
 */
export async function toggleCommentVisibilityAction(
  commentId: string,
  hidden: boolean,
) {
  try {
    const supabase = await createClient();
    const repo = commentRepository(supabase);

    // TODO: 관리자 권한 확인 (NextAuth 세션 체크)

    await repo.toggleCommentVisibility(commentId, hidden);

    const comment = await repo.getCommentById(commentId);
    revalidatePath(`/courses/${comment.course_id}`);

    return { success: true, error: null };
  } catch (error) {
    console.error("Error toggling comment visibility:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "댓글 표시 설정 중 오류가 발생했습니다",
      success: false,
    };
  }
}

/**
 * 관리자 전용: 댓글 강제 삭제 (Hard delete)
 * Server-side에서 Admin 클라이언트 사용하여 RLS 우회
 */
export async function adminDeleteCommentAction(
  commentId: string,
  courseId: string,
) {
  try {
    console.log("[SERVER ACTION] adminDeleteCommentAction 시작:", {
      commentId,
      courseId,
    });

    // Server-side에서만 사용 가능한 Admin 클라이언트
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    console.log("[SERVER ACTION] Admin 클라이언트 생성 완료");

    // TODO: 관리자 권한 확인 (NextAuth 세션 체크)
    // const session = await getServerSession();
    // if (!session?.user?.isAdmin) {
    //   return { error: "관리자 권한이 필요합니다", success: false };
    // }

    console.log("[SERVER ACTION] DELETE 쿼리 실행 중...");
    const { data, error } = await supabase
      .from("course_comments")
      .delete()
      .eq("id", commentId)
      .select();

    console.log("[SERVER ACTION] DELETE 결과:", { data, error });

    if (error) {
      console.error("[SERVER ACTION] Admin delete error:", error);
      throw error;
    }

    console.log("[SERVER ACTION] 삭제 성공, 캐시 무효화 중...");

    // 캐시 무효화
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/admin/courses/${courseId}/manage`);

    console.log("[SERVER ACTION] 완료");

    return { success: true, error: null };
  } catch (error) {
    console.error("[SERVER ACTION] Error in admin delete:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "댓글 삭제 중 오류가 발생했습니다",
      success: false,
    };
  }
}
