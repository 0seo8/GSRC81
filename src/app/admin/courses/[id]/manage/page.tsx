"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Noto_Sans } from "next/font/google";
import { ProtectedAdminRoute } from "@/shared/components/common/protected-admin-route";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Edit,
  Save,
  X,
  Trash2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { CourseDetailMapWrapper } from "@/features/map/components/course-detail-map-wrapper";
import { CourseCommentsList } from "@/features/courses/components/course-comments-list";
import { splitTitleAtMidpoint } from "@/shared/lib/utils/text";
import { DEFAULT_COURSE_DESCRIPTION, DIFFICULTY_LABELS } from "@/core/config/course";
import ImageUploader from "@/shared/components/common/ImageUploader";
import type { CoursePhoto } from "@/shared/lib/course-photos";
import type { CourseComment } from "@/shared/lib/comments";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

interface Course {
  id: string;
  title: string;
  description: string;
  detail_description?: string;
  start_latitude: number;
  start_longitude: number;
  distance_km: number;
  avg_time_min: number;
  difficulty: "easy" | "medium" | "hard";
  elevation_gain?: number;
  is_active: boolean;
  created_at: string;
  category_id?: string;
}

interface CourseManagePageProps {
  params: Promise<{ id: string }>;
}

export default function CourseManagePage({ params }: CourseManagePageProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [photos, setPhotos] = useState<CoursePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // 편집 모드 상태
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingStats, setEditingStats] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  // 폼 데이터
  const [titleForm, setTitleForm] = useState("");
  const [statsForm, setStatsForm] = useState({
    distance_km: "",
    avg_time_min: "",
    elevation_gain: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
  });
  const [descriptionForm, setDescriptionForm] = useState("");

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setCourseId(resolvedParams.id);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCourseData = async () => {
    try {
      setLoading(true);

      const [courseResult, commentsResult, photosResult] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase
          .from("course_comments")
          .select("*")
          .eq("course_id", courseId)
          .order("created_at", { ascending: false }),
        fetch(`/api/course-photos?course_id=${courseId}`).then((res) =>
          res.json()
        ),
      ]);

      if (courseResult.error) throw courseResult.error;

      const courseData = courseResult.data;
      setCourse(courseData);
      setComments(commentsResult.data || []);
      setPhotos(Array.isArray(photosResult) ? photosResult : []);

      // 폼 데이터 초기화
      setTitleForm(courseData.title);
      setStatsForm({
        distance_km: courseData.distance_km.toString(),
        avg_time_min: courseData.avg_time_min.toString(),
        elevation_gain: (courseData.elevation_gain || 0).toString(),
        difficulty: courseData.difficulty,
      });
      setDescriptionForm(courseData.detail_description || courseData.description || "");
    } catch (error) {
      console.error("Failed to load course data:", error);
      toast.error("코스 정보를 불러오는데 실패했습니다");
      router.push("/admin/courses");
    } finally {
      setLoading(false);
    }
  };

  // 제목 저장
  const handleSaveTitle = async () => {
    if (!titleForm.trim()) {
      toast.error("코스 이름을 입력해주세요");
      return;
    }

    try {
      const { error } = await supabase
        .from("courses")
        .update({ title: titleForm.trim() })
        .eq("id", courseId);

      if (error) throw error;

      toast.success("코스 이름이 업데이트되었습니다");
      setEditingTitle(false);
      await loadCourseData();
    } catch (error) {
      console.error("Failed to save title:", error);
      toast.error("저장에 실패했습니다");
    }
  };

  // 통계 저장
  const handleSaveStats = async () => {
    if (
      !statsForm.distance_km ||
      !statsForm.avg_time_min ||
      parseFloat(statsForm.distance_km) <= 0 ||
      parseInt(statsForm.avg_time_min) <= 0
    ) {
      toast.error("올바른 값을 입력해주세요");
      return;
    }

    try {
      const { error } = await supabase
        .from("courses")
        .update({
          distance_km: parseFloat(statsForm.distance_km),
          avg_time_min: parseInt(statsForm.avg_time_min),
          elevation_gain: parseInt(statsForm.elevation_gain) || 0,
          difficulty: statsForm.difficulty,
        })
        .eq("id", courseId);

      if (error) throw error;

      toast.success("코스 통계가 업데이트되었습니다");
      setEditingStats(false);
      await loadCourseData();
    } catch (error) {
      console.error("Failed to save stats:", error);
      toast.error("저장에 실패했습니다");
    }
  };

  // 설명 저장
  const handleSaveDescription = async () => {
    try {
      const { error } = await supabase
        .from("courses")
        .update({ detail_description: descriptionForm.trim() })
        .eq("id", courseId);

      if (error) throw error;

      toast.success("코스 설명이 업데이트되었습니다");
      setEditingDescription(false);
      await loadCourseData();
    } catch (error) {
      console.error("Failed to save description:", error);
      toast.error("저장에 실패했습니다");
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string, authorNickname: string) => {
    const confirmed = window.confirm(
      `${authorNickname}님의 댓글을 삭제하시겠습니까?`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("course_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast.success("댓글이 삭제되었습니다");
      await loadCourseData();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("댓글 삭제에 실패했습니다");
    }
  };

  // 사진 업로드
  const handlePhotoUpload = async (url: string) => {
    if (!courseId) return;

    try {
      const response = await fetch("/api/course-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          file_url: url,
          caption: "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "사진 저장에 실패했습니다.");
      }

      toast.success("사진이 업로드되었습니다");
      await loadCourseData();
    } catch (error) {
      console.error("사진 업로드 실패:", error);
      toast.error("사진 업로드에 실패했습니다");
    }
  };

  // 사진 삭제
  const handleDeletePhoto = async (photoId: string) => {
    const confirmed = window.confirm("이 사진을 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/course-photos?photo_id=${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "사진 삭제에 실패했습니다.");
      }

      toast.success("사진이 삭제되었습니다");
      await loadCourseData();
    } catch (error) {
      console.error("사진 삭제 실패:", error);
      toast.error("사진 삭제에 실패했습니다");
    }
  };

  if (loading) {
    return (
      <ProtectedAdminRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">코스 정보를 불러오는 중...</p>
          </div>
        </div>
      </ProtectedAdminRoute>
    );
  }

  if (!course) {
    return (
      <ProtectedAdminRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              코스를 찾을 수 없습니다
            </h2>
            <Link href="/admin/courses">
              <Button>코스 목록으로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </ProtectedAdminRoute>
    );
  }

  const [firstLine, secondLine] = splitTitleAtMidpoint(course.title);

  return (
    <ProtectedAdminRoute>
      <div className={`min-h-screen bg-page-bg ${notoSans.className}`}>
        {/* 상단 네비게이션 */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/admin/courses" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              코스 목록으로
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">코스 관리</h1>
          </div>
        </div>

        {/* 지도 영역 */}
        <div className="w-full h-map-height pt-14 p-2.5">
          <CourseDetailMapWrapper courseId={courseId!} />
        </div>

        {/* 하단 컨텐츠 */}
        <div
          className="flex-1 bg-page-bg"
          style={{ minHeight: "calc(100vh - 393px)" }}
        >
          <div className="overflow-y-auto h-full">
            <div className="max-w-2xl mx-auto px-[0.625rem] py-5">
              {/* 코스 이름 + 작성자 섹션 */}
              <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  {!editingTitle ? (
                    <>
                      <h1 className="text-course-detail-title text-black flex-1">
                        <div>{firstLine}</div>
                        {secondLine && <div>{secondLine}</div>}
                      </h1>
                      <div className="flex items-start gap-2">
                        <div className="text-right">
                          <div className="text-xs font-medium text-black">BY</div>
                          <div className="text-xs font-medium text-black">GSRC81</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTitle(true)}
                          className="ml-2"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1">
                      <Input
                        value={titleForm}
                        onChange={(e) => setTitleForm(e.target.value)}
                        className="text-lg font-bold mb-2"
                        placeholder="코스 이름"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveTitle}>
                          <Save className="w-3 h-3 mr-1" />
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTitleForm(course.title);
                            setEditingTitle(false);
                          }}
                        >
                          <X className="w-3 h-3 mr-1" />
                          취소
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 통계 섹션 */}
              <div className="border-t border-black">
                {!editingStats ? (
                  <div className="relative">
                    <div className="grid grid-cols-4 gap-4 px-2 pt-4 pb-5 border-b border-black">
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">거리</div>
                        <div className="text-sm font-semibold text-black">
                          {course.distance_km}km
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">시간</div>
                        <div className="text-sm font-semibold text-black">
                          약 {course.avg_time_min}분
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">고도</div>
                        <div className="text-sm font-semibold text-black">
                          {course.elevation_gain || 0}m
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">난이도</div>
                        <div className="text-sm font-semibold text-black">
                          {DIFFICULTY_LABELS[course.difficulty]}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingStats(true)}
                      className="absolute top-2 right-2"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="px-2 pt-4 pb-5 border-b border-black space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          거리 (km)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={statsForm.distance_km}
                          onChange={(e) =>
                            setStatsForm({ ...statsForm, distance_km: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          시간 (분)
                        </label>
                        <Input
                          type="number"
                          value={statsForm.avg_time_min}
                          onChange={(e) =>
                            setStatsForm({ ...statsForm, avg_time_min: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          고도 (m)
                        </label>
                        <Input
                          type="number"
                          value={statsForm.elevation_gain}
                          onChange={(e) =>
                            setStatsForm({ ...statsForm, elevation_gain: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          난이도
                        </label>
                        <Select
                          value={statsForm.difficulty}
                          onValueChange={(value) =>
                            setStatsForm({
                              ...statsForm,
                              difficulty: value as "easy" | "medium" | "hard",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveStats}>
                        <Save className="w-3 h-3 mr-1" />
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setStatsForm({
                            distance_km: course.distance_km.toString(),
                            avg_time_min: course.avg_time_min.toString(),
                            elevation_gain: (course.elevation_gain || 0).toString(),
                            difficulty: course.difficulty,
                          });
                          setEditingStats(false);
                        }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        취소
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 코스 설명 섹션 */}
              <div className="border-b border-black py-5">
                <div className="relative px-2">
                  {!editingDescription ? (
                    <>
                      <p className="text-course-detail-description text-black">
                        {course.detail_description || DEFAULT_COURSE_DESCRIPTION}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingDescription(true)}
                        className="absolute top-0 right-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        value={descriptionForm}
                        onChange={(e) => setDescriptionForm(e.target.value)}
                        rows={6}
                        placeholder="코스 설명을 입력하세요"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveDescription}>
                          <Save className="w-3 h-3 mr-1" />
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDescriptionForm(
                              course.detail_description || course.description || ""
                            );
                            setEditingDescription(false);
                          }}
                        >
                          <X className="w-3 h-3 mr-1" />
                          취소
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 댓글 섹션 */}
              <div className="border-b border-black py-6">
                <div className="relative">
                  <CourseCommentsList
                    comments={comments}
                    loading={false}
                    onDeleteComment={handleDeleteComment}
                    isAdmin={true}
                  />
                </div>
              </div>

              {/* 사진 갤러리 섹션 */}
              <div className="py-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-black mb-2">
                    코스 사진 ({photos.length})
                  </h3>
                  <ImageUploader
                    onUpload={handlePhotoUpload}
                    bucket="course-photos"
                    currentUrl=""
                  />
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {photos.map((photo, index) => (
                      <div key={photo.id} className="bg-white overflow-hidden relative group">
                        <Image
                          src={photo.file_url}
                          alt={photo.caption || "코스 사진"}
                          width={400}
                          height={400}
                          className="w-full aspect-square object-cover"
                          loading={index < 3 ? "eager" : "lazy"}
                          priority={index < 3}
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="bg-white hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {photo.caption && (
                          <div className="p-3">
                            <p className="text-sm text-gray-600">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}