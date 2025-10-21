"use client";

import { motion } from "framer-motion";
import { MessageSquare, MapPin, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CourseComment } from "@/lib/comments";
import Image from "next/image";

interface CommentListProps {
  comments: CourseComment[];
  loading?: boolean;
}

export function CommentList({ comments, loading = false }: CommentListProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">댓글을 불러오는 중...</span>
        </div>
      </Card>
    );
  }

  if (comments.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium mb-1">아직 댓글이 없습니다</p>
          <p className="text-sm">지도를 클릭해서 첫 번째 댓글을 남겨보세요!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            코스 댓글 ({comments.length})
          </h3>
        </div>

        <div className="space-y-4">
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-100"
            >
              <div className="flex items-start space-x-3">
                {/* 아바타 */}
                <div className="flex-shrink-0">
                  {comment.avatar_url ? (
                    <Image
                      src={comment.avatar_url}
                      alt={comment.author_nickname}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-orange-600" />
                    </div>
                  )}
                </div>

                {/* 댓글 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {comment.author_nickname}
                      </span>
                      {comment.distance_marker && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          {comment.distance_marker.toFixed(1)}km
                        </div>
                      )}
                    </div>
                    <time className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString(
                        "ko-KR",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </time>
                  </div>

                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {comment.message}
                  </p>

                  {comment.is_visible_in_flight && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        비행모드에서 표시
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}
