"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Send, MessageSquare, Plus, X } from "lucide-react";
import Image from "next/image";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";

interface CourseComment {
  id: string;
  course_id: string;
  author_nickname: string;
  message: string;
  created_at: string;
}

interface ChatBubbleListProps {
  courseId: string;
  onCommentUpdate?: () => void;
}

export function ChatBubbleList({
  courseId,
  onCommentUpdate,
}: ChatBubbleListProps) {
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    loadComments();
    const cleanup = subscribeToComments();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("course_comments")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`course-comments-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "course_comments",
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          loadComments();
          onCommentUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("course_comments").insert({
        course_id: courseId,
        author_nickname: "익명",
        message: message.trim(),
      });

      if (error) throw error;

      setMessage("");
      setShowCommentForm(false); // 폼 닫기
      // 즉시 새로고침
      await loadComments();
      onCommentUpdate?.();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRandomCharacter = () => {
    const characters = [
      "/character-running-1.svg",
      "/character-running-2.svg",
      "/character-running-3.svg",
      "/character-running-4.svg",
    ];
    return characters[Math.floor(Math.random() * characters.length)];
  };

  const formatCommentDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = differenceInDays(now, date);

    if (diffDays <= 3) {
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: ko,
      });
    } else {
      return format(date, "yyyy년 MM월 dd일", { locale: ko });
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 w-1/4"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-200"></div>
            <div className="h-12 bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-200">
      {/* 메시지 리스트 */}
      <div className="max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">첫 번째 메모를 남겨보세요!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="w-full border-b border-gray-200 p-4 flex items-start gap-3"
            >
              {/* 캐릭터 아바타 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
                <Image
                  src={getRandomCharacter() || "/placeholder.svg"}
                  alt="러닝 캐릭터"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">
                    {comment.author_nickname}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatCommentDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {comment.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 메모 작성 토글 버튼 */}
      <div className="border-t border-gray-200 p-4">
        {!showCommentForm ? (
          <button
            onClick={() => setShowCommentForm(true)}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 px-4 border border-gray-700 font-medium"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
          </button>
        ) : (
          <>
            {/* 닫기 버튼 헤더 */}
            <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
              <h4 className="font-bold text-gray-900 mt-1">메모 작성</h4>
              <button
                onClick={() => {
                  setShowCommentForm(false);
                  setMessage("");
                }}
                className="text-gray-500 hover:text-gray-700 p-1 border border-gray-300 text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* 입력 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 메시지 입력과 전송 버튼 */}
              <div className="space-y-3">
                <textarea
                  placeholder="메모를 입력하세요... (예: 코스 반환점에 화장실 있어요!)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full min-h-[80px] bg-white border-2 border-gray-300 focus:border-gray-500 p-3 resize-none text-sm"
                  maxLength={200}
                />

                <div className="flex items-end justify-between gap-4">
                  <p className="text-xs text-gray-500 flex-1">
                    {message.length}/200자 • 따뜻한 응원과 유용한 정보를
                    남겨주세요
                  </p>

                  <button
                    type="submit"
                    disabled={!message.trim() || submitting}
                    className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 text-white px-6 py-2 border border-gray-700 font-medium"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                        <span>등록중...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        <span>메모 등록</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
