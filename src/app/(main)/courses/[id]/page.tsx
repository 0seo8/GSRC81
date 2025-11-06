"use client";

import { notFound } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Course } from "@/types";
import { getCourseById } from "@/lib/courses-data";
import { CourseCommentsList } from "@/components/course-comments-list";
import { getCourseComments, CourseComment } from "@/lib/comments";

const CourseDetailMap = dynamic(
  () => import("@/components/course-detail-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[50vh] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>
    ),
  }
);

interface CourseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const [courseId, setCourseId] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      try {
        const resolvedParams = await params;
        setCourseId(resolvedParams.id);

        const courseData = await getCourseById(resolvedParams.id);
        setCourse(courseData);

        // 댓글 로드
        if (courseData) {
          loadComments(resolvedParams.id);
        }
      } catch (error) {
        console.error("Failed to load course:", error);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [params]);

  // 댓글 로드 함수
  async function loadComments(courseId: string) {
    try {
      setLoadingComments(true);
      const commentsData = await getCourseComments(courseId);
      setComments(commentsData);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoadingComments(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-lola-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">코스를 불러오는 중...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!course || !courseId) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-lola-50">
        {/* 상단 지도 영역 - 헤더 공간 확보 */}
        <div className="h-[60vh] relative p-4 pt-16">
          <div className="h-full rounded-2xl overflow-hidden">
            <CourseDetailMap courseId={courseId} />
          </div>
        </div>

        {/* 하단 컨텐츠 */}
        <div className="h-[40vh] bg-lola-50 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* 코스 정보 섹션 */}
            <div className="space-y-4">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {course.title}
                </h1>
                <div className="text-right">
                  <span className="text-xs font-medium text-gray-600">
                    BY GSRC81
                  </span>
                </div>
              </div>

              {/* 통계 정보 */}
              <div className="grid grid-cols-4 gap-4 py-4 border-t border-b border-black">
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-500">
                    거리
                  </div>
                  <div className="text-xsfont-semibold">
                    {course.distance_km}km
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">시간</div>
                  <div className="text-xs font-semibold">
                    약 {course.avg_time_min || 30}분
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">고도</div>
                  <div className="text-xs font-semibold">
                    {course.elevation_gain || 32}m
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">난이도</div>
                  <div className="text-xs font-semibold">
                    {course.difficulty === "easy"
                      ? "쉬움"
                      : course.difficulty === "medium"
                        ? "보통"
                        : "어려움"}
                  </div>
                </div>
              </div>

              {/* 코스 설명 */}
              <div className="space-y-2">
                <p className="text-gray-700 leading-relaxed">
                  {course.description ||
                    "진관천을 한 바퀴 왕복해 도는 코스입니다. 정기런 때 뛰는 코스이기도 해요! 접근하기 좋아 자주 벙이 열리는 장소입니다. 모두 같이 즐겁게 달려봐요!"}
                </p>
              </div>
            </div>

            {/* 댓글 섹션 */}
            <div className="border-t border-black py-6">
              <CourseCommentsList
                comments={comments}
                loading={loadingComments}
              />
            </div>

            {/* GSRC81 Running crew 팀 사진 섹션 */}
            <div className="border-t border-b border-black py-6">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <img
                  src="/images/gsrc81-team.jpg"
                  alt="GSRC81 Running crew"
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    // 이미지가 없을 경우 기본 이미지나 placeholder 표시
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden"
                    );
                  }}
                />
                <div className="hidden bg-gray-100 h-64 flex items-center justify-center"></div>
                <div className="p-4">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      GSRC81
                    </h3>
                    <p className="text-gray-600 italic">Running crew!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
