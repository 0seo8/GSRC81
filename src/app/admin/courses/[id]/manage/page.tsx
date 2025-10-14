"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedAdminRoute } from "@/components/protected-admin-route";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, MapPin, MessageSquare, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  distance_km: number;
  avg_time_min: number;
  difficulty: "easy" | "medium" | "hard";
  nearest_station: string;
  is_active: boolean;
  created_at: string;
  elevation_gain?: number;
  gpx_data?: {
    version: string;
    points: Array<{ lat: number; lng: number; ele?: number }>;
    bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
    stats: {
      totalDistance: number;
      elevationGain: number;
      estimatedDuration: number;
    };
    metadata?: {
      importedAt: string;
      source: string;
    };
  };
}

interface Comment {
  id: string;
  course_id: string;
  author_nickname: string;
  message: string;
  created_at: string;
}

interface CourseManagePageProps {
  params: Promise<{ id: string }>;
}

export default function CourseManagePage({ params }: CourseManagePageProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<string | null>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    distance_km: "",
    avg_time_min: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    nearest_station: "",
    start_latitude: "",
    start_longitude: "",
    end_latitude: "",
    end_longitude: "",
    elevation_gain: "",
    is_active: true,
  });
  
  const [hasGpxData, setHasGpxData] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

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

      // 코스 정보와 댓글을 병렬로 로드
      const [courseResult, commentsResult] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase
          .from("course_comments")
          .select("*")
          .eq("course_id", courseId)
          .order("created_at", { ascending: false }),
      ]);

      if (courseResult.error) throw courseResult.error;
      if (commentsResult.error) throw commentsResult.error;

      const courseData = courseResult.data;
      setCourse(courseData);
      setComments(commentsResult.data || []);
      
      // GPX 데이터 존재 여부 확인
      setHasGpxData(!!courseData.gpx_data);

      // gpx_data가 있으면 그 데이터를 우선 사용
      const distance = courseData.gpx_data?.stats?.totalDistance || courseData.distance_km;
      const duration = courseData.gpx_data?.stats?.estimatedDuration || courseData.avg_time_min;
      const elevation = courseData.gpx_data?.stats?.elevationGain || courseData.elevation_gain || 0;

      // 폼 데이터 초기화
      setFormData({
        title: courseData.title,
        description: courseData.description || "",
        distance_km: distance.toString(),
        avg_time_min: duration.toString(),
        difficulty: courseData.difficulty,
        nearest_station: courseData.nearest_station || "",
        start_latitude: courseData.start_latitude.toString(),
        start_longitude: courseData.start_longitude.toString(),
        end_latitude: (courseData.end_latitude || courseData.start_latitude).toString(),
        end_longitude: (courseData.end_longitude || courseData.start_longitude).toString(),
        elevation_gain: elevation.toString(),
        is_active: courseData.is_active,
      });
    } catch (error) {
      console.error("Failed to load course data:", error);
      alert("코스 정보를 불러오는 중 오류가 발생했습니다.");
      router.push("/admin/courses");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "코스명을 입력해주세요.";
    }

    if (!formData.distance_km || parseFloat(formData.distance_km) <= 0) {
      newErrors.distance_km = "올바른 거리를 입력해주세요.";
    }

    if (!formData.avg_time_min || parseInt(formData.avg_time_min) <= 0) {
      newErrors.avg_time_min = "올바른 소요시간을 입력해주세요.";
    }

    if (!formData.start_latitude || !formData.start_longitude) {
      newErrors.coordinates = "시작점 좌표를 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        distance_km: parseFloat(formData.distance_km),
        avg_time_min: parseInt(formData.avg_time_min),
        difficulty: formData.difficulty,
        nearest_station: formData.nearest_station.trim(),
        start_latitude: parseFloat(formData.start_latitude),
        start_longitude: parseFloat(formData.start_longitude),
        end_latitude: parseFloat(formData.end_latitude) || parseFloat(formData.start_latitude),
        end_longitude: parseFloat(formData.end_longitude) || parseFloat(formData.start_longitude),
        elevation_gain: parseInt(formData.elevation_gain) || 0,
        is_active: formData.is_active,
      };

      const { error } = await supabase
        .from("courses")
        .update(updateData)
        .eq("id", courseId);

      if (error) throw error;

      alert("코스 정보가 성공적으로 저장되었습니다.");
      await loadCourseData(); // 데이터 새로고침
    } catch (error) {
      console.error("Failed to save course:", error);
      alert("코스 정보 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (
    commentId: string,
    authorNickname: string
  ) => {
    if (!confirm(`${authorNickname}님의 댓글을 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from("course_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      alert("댓글이 삭제되었습니다.");
      await loadCourseData(); // 댓글 목록 새로고침
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  const difficultyOptions = [
    { value: "easy", label: "쉬움" },
    { value: "medium", label: "보통" },
    { value: "hard", label: "어려움" },
  ];

  if (loading) {
    return (
      <ProtectedAdminRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              코스를 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 mb-6">
              요청하신 코스가 존재하지 않거나 삭제되었습니다.
            </p>
            <Link href="/admin/courses">
              <Button>코스 목록으로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info" className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                코스 정보
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                댓글 관리 ({comments.length})
              </TabsTrigger>
            </TabsList>

            {/* 코스 정보 탭 */}
            <TabsContent value="info">
              <Card className="shadow-xl border-0 py-6">
                <CardHeader>
                  <CardTitle>코스 기본 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveCourse} className="space-y-6">
                    {/* GPX 데이터 상태 */}
                    {hasGpxData && course?.gpx_data && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <h3 className="font-medium text-green-900 mb-2">
                          ✅ GPX 데이터 (v{course.gpx_data.version})
                        </h3>
                        <div className="text-sm text-green-700 space-y-1">
                          <p>• 총 {course.gpx_data.points.length}개의 GPS 포인트</p>
                          <p>• 거리: {course.gpx_data.stats.totalDistance.toFixed(3)}km</p>
                          <p>• 고도상승: {course.gpx_data.stats.elevationGain}m</p>
                          <p>• 예상시간: {course.gpx_data.stats.estimatedDuration}분</p>
                        </div>
                      </div>
                    )}
                    
                    {/* 기본 정보 */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          코스명 *
                        </label>
                        <Input
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="예: 은평구 한바퀴 코스"
                          className={errors.title ? "border-red-300" : ""}
                        />
                        {errors.title && (
                          <p className="text-gray-600 text-xs mt-1">
                            {errors.title}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          코스 설명
                        </label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          placeholder="코스에 대한 간단한 설명을 입력해주세요"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          가까운 지하철역
                        </label>
                        <Input
                          value={formData.nearest_station}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nearest_station: e.target.value,
                            })
                          }
                          placeholder="예: 구파발역"
                        />
                      </div>
                    </div>

                    {/* 코스 정보 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        코스 세부 정보
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            거리 (km) *
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.distance_km}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                distance_km: e.target.value,
                              })
                            }
                            placeholder="5.2"
                            className={
                              errors.distance_km ? "border-red-300" : ""
                            }
                          />
                          {errors.distance_km && (
                            <p className="text-gray-600 text-xs mt-1">
                              {errors.distance_km}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            소요시간 (분) *
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.avg_time_min}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                avg_time_min: e.target.value,
                              })
                            }
                            placeholder="30"
                            className={
                              errors.avg_time_min ? "border-red-300" : ""
                            }
                          />
                          {errors.avg_time_min && (
                            <p className="text-gray-600 text-xs mt-1">
                              {errors.avg_time_min}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            고도 상승 (m)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.elevation_gain}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                elevation_gain: e.target.value,
                              })
                            }
                            placeholder="100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          난이도 *
                        </label>
                        <Select
                          value={formData.difficulty}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              difficulty: value as "easy" | "medium" | "hard",
                            })
                          }
                        >
                          <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="난이도 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {difficultyOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 시작점/종료점 좌표 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        경로 좌표
                      </h3>

                      <div className="space-y-4">
                        {/* 시작점 */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">시작점</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-1">
                                위도 (Latitude) *
                              </label>
                              <Input
                                type="number"
                                step="any"
                                value={formData.start_latitude}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    start_latitude: e.target.value,
                                  })
                                }
                                placeholder="37.6361"
                                className={
                                  errors.coordinates ? "border-red-300" : ""
                                }
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-1">
                                경도 (Longitude) *
                              </label>
                              <Input
                                type="number"
                                step="any"
                                value={formData.start_longitude}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    start_longitude: e.target.value,
                                  })
                                }
                                placeholder="126.9185"
                                className={
                                  errors.coordinates ? "border-red-300" : ""
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* 종료점 */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">종료점</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-1">
                                위도 (Latitude)
                              </label>
                              <Input
                                type="number"
                                step="any"
                                value={formData.end_latitude}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    end_latitude: e.target.value,
                                  })
                                }
                                placeholder="37.6361"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-1">
                                경도 (Longitude)
                              </label>
                              <Input
                                type="number"
                                step="any"
                                value={formData.end_longitude}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    end_longitude: e.target.value,
                                  })
                                }
                                placeholder="126.9185"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {errors.coordinates && (
                        <p className="text-gray-600 text-xs">
                          {errors.coordinates}
                        </p>
                      )}
                    </div>

                    {/* 활성화 상태 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        활성화 상태
                      </h3>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_active: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300"
                        />
                        <label
                          htmlFor="is_active"
                          className="text-sm text-gray-700"
                        >
                          코스 활성화 (체크 해제 시 지도에서 숨김)
                        </label>
                      </div>
                    </div>

                    {/* 저장 버튼 */}
                    <div className="flex justify-end pt-6">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-gray-700 hover:bg-gray-800"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            저장 중...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            저장하기
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 댓글 관리 탭 */}
            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>댓글 관리</CardTitle>
                </CardHeader>
                <CardContent>
                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium text-gray-900">
                                  {comment.author_nickname}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    comment.created_at
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-700">{comment.message}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteComment(
                                  comment.id,
                                  comment.author_nickname
                                )
                              }
                              className="text-gray-600 hover:text-gray-700 hover:border-gray-300 ml-4"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        댓글이 없습니다
                      </h3>
                      <p className="text-gray-600">
                        아직 이 코스에 작성된 댓글이 없습니다.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedAdminRoute>
  );
}
