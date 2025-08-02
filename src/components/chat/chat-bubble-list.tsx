"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, Plus, X } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
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
          console.log("Real-time update received:", payload);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 헤더 */}

      {/* 메시지 리스트 */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">첫 번째 메모를 남겨보세요!</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div
              key={comment.id}
              className={`flex items-start gap-3 mb-4 ${
                index % 2 === 0 ? "flex-row" : "flex-row-reverse"
              }`}
            >
              {/* 캐릭터 아바타 */}
              <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src={getRandomCharacter() || "/placeholder.svg"}
                  alt="러닝 캐릭터"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>

              {/* 말풍선 */}
              <div
                className={`relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  index % 2 === 0
                    ? "bg-gray-100 text-gray-900 rounded-bl-sm"
                    : "bg-gray-700 text-white rounded-br-sm"
                }`}
              >
                {/* 말풍선 꼬리 */}
                <div
                  className={`absolute top-4 w-0 h-0 ${
                    index % 2 === 0
                      ? "-left-2 border-t-[8px] border-r-[8px] border-b-[8px] border-t-transparent border-r-gray-100 border-b-transparent"
                      : "-right-2 border-t-[8px] border-l-[8px] border-b-[8px] border-t-transparent border-l-orange-500 border-b-transparent"
                  }`}
                ></div>

                <div className="mb-2">
                  <span
                    className={`text-sm font-semibold ${
                      index % 2 === 0 ? "text-gray-800" : "text-gray-100"
                    }`}
                  >
                    {comment.author_nickname}
                  </span>
                </div>

                <p className="text-sm leading-relaxed mb-3">
                  {comment.message}
                </p>

                {/* 시간 */}
                <div className="flex justify-end">
                  <p
                    className={`text-xs ${
                      index % 2 === 0 ? "text-gray-500" : "text-gray-200"
                    }`}
                  >
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 메모 작성 토글 버튼 */}
      <div className="p-4 border-t border-gray-100">
        {!showCommentForm ? (
          <Button
            onClick={() => setShowCommentForm(true)}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3"
          >
            <Plus className="w-4 h-4 mr-2" />
          </Button>
        ) : (
          <>
            {/* 닫기 버튼 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">메모 작성</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCommentForm(false);
                  setMessage("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 입력 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 메시지 입력과 전송 버튼 */}
              <div className="space-y-3">
                <Textarea
                  placeholder="메모를 입력하세요... (예: 코스 반환점에 화장실 있어요!)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full min-h-[80px] bg-white border-gray-200 focus:border-orange-300 focus:ring-orange-200 resize-none"
                  maxLength={200}
                />

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {message.length}/200자 • 따뜻한 응원과 유용한 정보를
                    남겨주세요
                  </p>

                  <Button
                    type="submit"
                    disabled={!message.trim() || submitting}
                    className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 px-6 py-2 font-medium"
                    size="sm"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>등록중...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        <span>메모 등록</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
