"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Settings,
  LogOut,
  Users,
  Map,
  Lock,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  distance_km: number;
  difficulty: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { adminLogout } = useAdmin();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalComments: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 코스 데이터 로드
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (coursesError) throw coursesError;

      // 통계 데이터 로드
      const [{ count: courseCount }, { count: commentCount }] =
        await Promise.all([
          supabase.from("courses").select("*", { count: "exact", head: true }),
          supabase
            .from("course_comments")
            .select("*", { count: "exact", head: true }),
        ]);

      setCourses(coursesData || []);
      setStats({
        totalCourses: courseCount || 0,
        totalComments: commentCount || 0,
        activeUsers: 5, // 임시 값
      });
    } catch (error) {
      console.error("Dashboard data load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
  };

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* 데스크톱용 통계 카드 */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Map className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">총 코스</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalCourses}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-200 rounded-lg">
                    <Users className="w-6 h-6 text-gray-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">총 댓글</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalComments}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-300 rounded-lg">
                    <MapPin className="w-6 h-6 text-gray-800" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">활성 사용자</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.activeUsers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 모바일용 메뉴 리스트 */}
          <div className="block md:hidden space-y-4">
            {/* 코스 관리 */}
            <div
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => router.push("/admin/courses")}
            >
              <span className="text-base font-medium text-gray-900">
                코스 관리
              </span>
              <span className="text-gray-400 text-lg">›</span>
            </div>

            {/* 비밀번호 관리 */}
            <div
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => router.push("/admin/password")}
            >
              <span className="text-base font-medium text-gray-900">
                비밀번호 관리
              </span>
              <span className="text-gray-400 text-lg">›</span>
            </div>

            {/* 시스템 설정 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
              <span className="text-base font-medium text-gray-900">
                시스템 설정
              </span>
              <span className="text-gray-400 text-lg">›</span>
            </div>

            {/* 버전정보 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <span className="text-base font-medium text-gray-900">
                버전정보
              </span>
              <span className="text-gray-700 text-base font-medium">1.0.0</span>
            </div>

            {/* 로그아웃 버튼 */}
            <Button
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg border-0"
              variant="ghost"
              onClick={handleLogout}
            >
              로그아웃
            </Button>
          </div>

          <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 빠른 작업 */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 작업</CardTitle>
                <CardDescription>자주 사용하는 관리 기능</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push("/admin/courses")}
                >
                  <Plus className="w-4 h-4 mr-2" />새 코스 등록
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push("/admin/courses")}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  코스 관리
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push("/admin/password")}
                >
                  <Lock className="w-4 h-4 mr-2" />앱 비밀번호 변경
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  시스템 설정
                </Button>
              </CardContent>
            </Card>

            {/* 최근 코스 */}
            <Card>
              <CardHeader>
                <CardTitle>최근 등록된 코스</CardTitle>
                <CardDescription>최근에 추가된 러닝 코스 목록</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : courses.length > 0 ? (
                  <div className="space-y-3">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {course.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {course.distance_km}km · {course.difficulty}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">등록된 코스가 없습니다</p>
                    <p className="text-sm text-gray-500 mt-1">
                      새로운 러닝 코스를 등록해보세요
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedAdminRoute>
  );
}
