"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare } from "lucide-react";
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

export function ChatBubbleList({ courseId, onCommentUpdate }: ChatBubbleListProps) {
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (!nickname.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("course_comments").insert({
        course_id: courseId,
        author_nickname: nickname.trim(),
        message: message.trim(),
      });

      if (error) throw error;

      setMessage("");
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
      "/character-running-4.svg"
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
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">
            크루원 메모 ({comments.length})
          </h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          코스에 대한 팁이나 정보를 공유해보세요!
        </p>
      </div>

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
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src={getRandomCharacter()}
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
                    : "bg-orange-500 text-white rounded-br-sm"
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
                      index % 2 === 0 ? "text-gray-800" : "text-orange-100"
                    }`}
                  >
                    {comment.author_nickname}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-2">{comment.message}</p>
                <p
                  className={`text-xs ${
                    index % 2 === 0 ? "text-gray-500" : "text-orange-200"
                  }`}
                >
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 입력 폼 */}
      <div className="p-4 border-t border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-32 flex-shrink-0"
              maxLength={20}
            />
            <Textarea
              placeholder="메모를 입력하세요... (예: 코스반환점에 화장실 있어요!)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 min-h-[44px] max-h-24 resize-none"
              maxLength={200}
            />
            <Button
              type="submit"
              disabled={!nickname.trim() || !message.trim() || submitting}
              className="bg-orange-500 hover:bg-orange-600 flex-shrink-0"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            {message.length}/200자 • 따뜻한 응원과 유용한 정보를 남겨주세요
          </p>
        </form>
      </div>
    </div>
  );
}