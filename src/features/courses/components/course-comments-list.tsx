"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { CourseComment } from "@/shared/lib/comments";
import { MessageCircle, Trash2, Edit } from "lucide-react";
import { formatRelativeTime } from "@/shared/lib/utils/date-utils";
import { EditCommentModal } from "@/features/comments/components/edit-comment-modal";

interface CourseCommentsListProps {
  comments: CourseComment[];
  loading: boolean;
  isAdmin?: boolean;
  onDeleteComment?: (commentId: string, authorNickname: string) => void;
}

export const CourseCommentsList: React.FC<CourseCommentsListProps> = ({
  comments,
  loading,
  isAdmin = false,
  onDeleteComment,
}) => {
  const { data: session } = useSession();
  const [editingComment, setEditingComment] = useState<CourseComment | null>(
    null,
  );

  const handleEditClick = (comment: CourseComment) => {
    setEditingComment(comment);
  };

  const handleCloseEditModal = () => {
    setEditingComment(null);
  };

  const handleCommentUpdated = () => {
    // 페이지 새로고침은 EditCommentModal에서 처리됨
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>아직 댓글이 없습니다.</p>
          <p className="text-sm mt-1">
            지도를 클릭해서 첫 번째 댓글을 남겨보세요!
          </p>
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5625rem" }}
        >
          {comments.map((comment, index) => {
            const isEven = index % 2 === 0;
            const isOwner =
              session?.user?.email &&
              comment.author_user_key === session.user.email;

            // 디버깅: 소유권 확인
            if (index === 0) {
              console.log("🔍 [Comment Ownership Debug]", {
                sessionEmail: session?.user?.email,
                commentAuthorKey: comment.author_user_key,
                isOwner,
                comment,
              });
            }

            return (
              <div
                key={comment.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr 48px",
                  gap: "0.75rem",
                }}
              >
                {/* 왼쪽 프로필 영역 */}
                <div className="flex justify-center">
                  {isEven && (
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {comment.avatar_url ? (
                        <img
                          src={comment.avatar_url}
                          alt={comment.author_nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">
                          {comment.author_nickname.charAt(0)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 가운데 댓글 영역 (항상 같은 위치) */}
                <div>
                  {/* 작성자 정보 */}
                  <div
                    className={`flex items-center space-x-2 mb-2 ${isEven ? "justify-start" : "justify-end"}`}
                  >
                    <span className="font-medium text-black text-sm">
                      {comment.author_nickname}
                    </span>
                    <span className="text-sm text-gray-500">
                      {comment.distance_marker
                        ? `${comment.distance_marker.toFixed(1)}km`
                        : "0km"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </div>

                  {/* 말풍선 */}
                  <div
                    className={`flex ${isEven ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className="relative bg-black text-white px-3 py-3 inline-block group"
                      style={{
                        borderRadius: isEven
                          ? "0 18px 18px 18px"
                          : "18px 0px 18px 18px",
                      }}
                    >
                      <p
                        className="leading-relaxed whitespace-pre-wrap"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {comment.message}
                      </p>
                      {comment.edited_at && (
                        <p className="text-xs text-gray-400 mt-1">(수정됨)</p>
                      )}

                      {/* 본인 댓글: 수정/삭제 버튼 */}
                      {isOwner && (
                        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(comment)}
                            className="bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700"
                            title="댓글 수정"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              onDeleteComment?.(
                                comment.id,
                                comment.author_nickname,
                              )
                            }
                            className="bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                            title="댓글 삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* 관리자: 삭제 버튼만 */}
                      {!isOwner && isAdmin && onDeleteComment && (
                        <button
                          onClick={() =>
                            onDeleteComment(comment.id, comment.author_nickname)
                          }
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          title="댓글 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 오른쪽 프로필 영역 */}
                <div className="flex justify-center">
                  {!isEven && (
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {comment.avatar_url ? (
                        <img
                          src={comment.avatar_url}
                          alt={comment.author_nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">
                          {comment.author_nickname.charAt(0)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 댓글 수정 모달 */}
      {editingComment && session?.user?.email && (
        <EditCommentModal
          isOpen={!!editingComment}
          onClose={handleCloseEditModal}
          comment={editingComment}
          authorUserKey={session.user.email}
          onCommentUpdated={handleCommentUpdated}
        />
      )}
    </div>
  );
};
