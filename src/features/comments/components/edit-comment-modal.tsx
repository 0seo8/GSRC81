"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit, MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { updateCommentAction } from "@/app/actions/comments";
import type { CourseComment } from "@/shared/lib/comments";

interface EditCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: CourseComment;
  authorUserKey: string;
  onCommentUpdated?: () => void;
}

export function EditCommentModal({
  isOpen,
  onClose,
  comment,
  authorUserKey,
  onCommentUpdated,
}: EditCommentModalProps) {
  const [message, setMessage] = useState(comment.message);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      // Server Action 사용 (RLS 우회)
      const result = await updateCommentAction(
        comment.id,
        message.trim(),
        authorUserKey,
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // 성공적으로 수정된 후 처리
      onCommentUpdated?.();
      onClose();

      // 페이지 새로고침하여 Server Component 데이터도 업데이트
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (error) {
      console.error("댓글 수정 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "댓글 수정에 실패했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage(comment.message); // 원래 메시지로 복원
    onClose();
  };

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
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 280,
              duration: 0.3,
            }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-xl max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-track-primary/10 p-2 rounded-full">
                  <Edit className="w-5 h-5 text-track-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-lola-950">
                    코멘트 수정
                  </h3>
                  {comment.distance_marker !== undefined && (
                    <div className="flex items-center text-sm text-lola-600 mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {comment.distance_marker.toFixed(1)}km 지점
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-lola-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-lola-600" />
              </button>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="px-6 pb-6">
              <div className="space-y-4">
                {/* 메시지 입력 */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-lola-700 mb-2"
                  >
                    메시지
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="이 지점에 대한 코멘트를 남겨주세요"
                    className="w-full px-3 py-2 border border-lola-300 rounded-lg focus:ring-2 focus:ring-track-primary focus:border-track-primary outline-none transition-colors resize-none"
                    rows={3}
                    maxLength={200}
                    required
                  />
                  <div className="flex justify-between text-xs text-lola-600 mt-1">
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
                  className="flex-1 bg-track-primary hover:bg-track-primary/90"
                  disabled={isSubmitting || !message.trim()}
                >
                  {isSubmitting ? "수정 중..." : "수정"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
