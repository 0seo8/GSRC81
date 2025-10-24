"use client";

import React from "react";
import { CourseComment } from "@/lib/comments";
import { MessageCircle } from "lucide-react";

interface CourseCommentsListProps {
  comments: CourseComment[];
  loading: boolean;
  onCommentAdded: () => void;
}

export const CourseCommentsList: React.FC<CourseCommentsListProps> = ({
  comments,
  loading,
  onCommentAdded,
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
          <p className="text-sm mt-1">지도를 클릭해서 첫 번째 댓글을 남겨보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                {/* 프로필 이미지 또는 기본 아바타 */}
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">
                    {comment.author_nickname.charAt(0)}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* 작성자 정보 */}
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {comment.author_nickname}
                    </span>
                    {comment.distance_marker && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        {comment.distance_marker.toFixed(1)}km
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  
                  {/* 댓글 내용 */}
                  <p className="text-gray-700 text-sm leading-relaxed">
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