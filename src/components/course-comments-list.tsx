"use client";

import React from "react";
import { CourseComment } from "@/lib/comments";
import { MessageCircle } from "lucide-react";
import { formatRelativeTime } from "@/utils/date-utils";

interface CourseCommentsListProps {
  comments: CourseComment[];
  loading: boolean;
}

export const CourseCommentsList: React.FC<CourseCommentsListProps> = ({
  comments,
  loading,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">러닝 노트</h3>
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
      <div className="flex items-center space-x-2">
        <MessageCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">러닝 노트</h3>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>아직 댓글이 없습니다.</p>
          <p className="text-sm mt-1">
            지도를 클릭해서 첫 번째 댓글을 남겨보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-3">
              {/* 프로필 이미지 */}
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 text-sm font-medium">
                  {comment.author_nickname.charAt(0)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {/* 작성자 정보 (이름, 거리, 시간) */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {comment.author_nickname}
                  </span>
                  <span className="text-sm text-gray-600">
                    {comment.distance_marker
                      ? `${comment.distance_marker.toFixed(1)}km`
                      : "0km"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>

                {/* 말풍선 댓글 내용 */}
                <div
                  className="relative bg-black text-white px-5 py-4 inline-block min-w-[160px] max-w-[280px]"
                  style={{ borderRadius: "0 16px 16px 16px" }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
