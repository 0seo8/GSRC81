"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createComment, CreateCommentData } from "@/lib/comments";
import { useAuth } from "@/contexts/AuthContext";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  position: {
    lng: number;
    lat: number;
    distanceMarker: number;
  } | null;
  onCommentAdded?: () => void;
}

export function CommentModal({
  isOpen,
  onClose,
  courseId,
  position,
  onCommentAdded,
}: CommentModalProps) {
  const { kakaoUserId, kakaoNickname } = useAuth();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!position || !message.trim()) return;

    // 로그인된 사용자 닉네임 사용 (카카오 닉네임이 있으면 사용, 없으면 GSRC81 러너)
    const authorNickname = kakaoNickname || "GSRC81 러너";

    setIsSubmitting(true);
    try {
      const commentData: CreateCommentData = {
        course_id: courseId,
        author_nickname: authorNickname,
        message: message.trim(),
        latitude: position.lat,
        longitude: position.lng,
        distance_marker: position.distanceMarker,
        is_visible_in_flight: true,
      };

      await createComment(commentData);

      // 성공적으로 등록된 후 처리
      setMessage("");
      onCommentAdded?.();
      onClose();
    } catch (error) {
      console.error("댓글 등록 실패:", error);
      alert("댓글 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  if (!position) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    코멘트 추가
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {position.distanceMarker.toFixed(1)}km 지점
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="px-6 pb-6">
              <div className="space-y-4">
                {/* 메시지 입력 */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    메시지
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="이 지점에 대한 코멘트를 남겨주세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors resize-none"
                    rows={3}
                    maxLength={200}
                    required
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>비행모드에서 말풍선으로 표시됩니다</span>
                    <span>{message.length}/200</span>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={isSubmitting || !message.trim()}
                >
                  {isSubmitting ? "등록 중..." : "등록"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
