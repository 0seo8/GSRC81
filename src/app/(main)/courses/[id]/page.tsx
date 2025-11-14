"use client";

import { notFound } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Course } from "@/types";
import { getCourseById } from "@/lib/courses-data";
import { type CoursePhoto } from "@/lib/course-photos";
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
  const [photos, setPhotos] = useState<CoursePhoto[]>([]);

  useEffect(() => {
    async function loadCourse() {
      try {
        const resolvedParams = await params;
        setCourseId(resolvedParams.id);

        const courseData = await getCourseById(resolvedParams.id);
        setCourse(courseData);

        // 댓글과 사진 로드
        if (courseData) {
          loadComments(resolvedParams.id);
          loadPhotos(resolvedParams.id);
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

  async function loadPhotos(courseId: string) {
    try {
      const response = await fetch(`/api/course-photos?course_id=${courseId}`);
      if (response.ok) {
        const photosData = await response.json();
        setPhotos(photosData);
      } else {
        console.error("Failed to fetch photos:", response.status);
      }
    } catch (error) {
      console.error("Failed to load photos:", error);
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
      <div className="min-h-screen" style={{ backgroundColor: "#F5F5F5" }}>
        {/* 상단 지도 영역 - 헤더 공간 확보 */}
        <div style={{ height: "393px" }} className="relative p-4 pt-16">
          <div className="h-full overflow-hidden">
            <CourseDetailMap courseId={courseId} />
          </div>
        </div>

        {/* 하단 컨텐츠 */}
        <div
          className="flex-1"
          style={{
            backgroundColor: "#F5F5F5",
            minHeight: "calc(100vh - 393px)",
          }}
        >
          <div className="overflow-y-auto h-full">
            <div className="max-w-2xl mx-auto px-4 py-6">
              {/* 코스 정보 섹션 */}
              <div className="">
                <div className="mb-6 flex justify-between items-end">
                  <h1 className="text-course-detail-title text-black flex-1">
                    {course.title
                      .split(" ")
                      .map((word, index, array) => {
                        const midIndex = Math.ceil(array.length / 2);
                        if (index === midIndex - 1 && array.length > 1) {
                          return word + "\n";
                        }
                        return word + (index < array.length - 1 ? " " : "");
                      })
                      .join("")
                      .split("\n")
                      .map((line, lineIndex) => (
                        <div key={lineIndex}>{line}</div>
                      ))}
                  </h1>
                  <div className="text-right ml-4">
                    <div className="text-xs font-medium text-black">BY</div>
                    <div className="text-xs font-medium text-black">GSRC81</div>
                  </div>
                </div>

                {/* 통계 정보 */}
                <div className="grid grid-cols-4 gap-4 py-4 border-t border-b border-black">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-black">거리</div>
                    <div className="text-xs font-semibold text-black">
                      {course.distance_km}km
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-black">시간</div>
                    <div className="text-xs font-semibold text-black">
                      약 {course.avg_time_min || 30}분
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-black">고도</div>
                    <div className="text-xs font-semibold text-black">
                      {course.elevation_gain || 32}m
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-black">난이도</div>
                    <div className="text-xs font-semibold text-black">
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
                  <div className="text-course-detail-description text-black py-4">
                    {course.detail_description ||
                      "진관천을 한 바퀴 왕복해 도는 코스입니다. 정기런 때 뛰는 코스이기도 해요! 접근하기 좋아 자주 벙이 열리는 장소입니다. 모두 같이 즐겁게 달려봐요!"}
                  </div>
                </div>
              </div>

              {/* 댓글 섹션 */}
              <div className="border-t border-black py-6">
                <CourseCommentsList
                  comments={comments}
                  loading={loadingComments}
                />
              </div>

              {/* 코스 사진 갤러리 */}
              {photos.length > 0 && (
                <div className="border-t border-b border-black py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="bg-white overflow-hidden ">
                        <Image
                          src={photo.file_url}
                          alt={photo.caption || "코스 사진"}
                          width={400}
                          height={400}
                          className="w-full aspect-square object-cover"
                        />
                        {photo.caption && (
                          <div className="p-3">
                            <p className="text-sm text-gray-600">
                              {photo.caption}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
