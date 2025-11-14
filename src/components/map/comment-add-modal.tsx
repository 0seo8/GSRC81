"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, MessageSquare } from "lucide-react";

interface CommentAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  position: { x: number; y: number } | null;
  isSubmitting?: boolean;
}

export function CommentAddModal({
  isOpen,
  onClose,
  onSubmit,
  position,
  isSubmitting = false,
}: CommentAddModalProps) {
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment.trim());
      setComment("");
      onClose();
    }
  };

  const handleClose = () => {
    setComment("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && position && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={handleClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  코멘트 추가
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 내용 */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                이 위치에 대한 코멘트를 남겨주세요.
              </p>
              
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="예: 여기서 물 보충 가능해요!"
                className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={200}
                autoFocus
              />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {comment.length}/200
                </span>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 p-6 pt-0">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                disabled={!comment.trim() || isSubmitting}
              >
                {isSubmitting ? "등록 중..." : "등록"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}