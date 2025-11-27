"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAdmin } from "@/features/admin/context/AdminContext";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Settings,
  Users,
  Map,
  Lock,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  distance_km: number;
  difficulty: string;
  created_at: string;
}

interface AdminStats {
  totalCourses: number;
  totalComments: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const { adminLogout } = useAdmin();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
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
      const [
        { count: courseCount },
        { count: commentCount },
        { count: userCount },
      ] = await Promise.all([
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase
          .from("course_comments")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("access_links")
          .select("*", { count: "exact", head: true })
          .eq("verified", true),
      ]);

      setCourses(coursesData || []);
      setStats({
        totalCourses: courseCount || 0,
        totalComments: commentCount || 0,
        activeUsers: userCount || 0,
      });
    } catch (error) {
      console.error("Dashboard data load error:", error);
      toast.error("대시보드 데이터를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 통계 카드 - 데스크톱에서만 표시 */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Map className="w-6 h-6 text-gray-600" />}
            label="총 코스"
            value={stats.totalCourses}
            iconBg="bg-gray-100"
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-gray-700" />}
            label="총 댓글"
            value={stats.totalComments}
            iconBg="bg-gray-200"
          />
          <StatCard
            icon={<MapPin className="w-6 h-6 text-gray-800" />}
            label="활성 사용자"
            value={stats.activeUsers}
            iconBg="bg-gray-300"
          />
        </div>

        {/* 모바일 메뉴 리스트 */}
        <div className="block md:hidden space-y-4 mb-8">
          <MenuCard href="/admin/courses" label="코스 관리" />
          <MenuCard href="/admin/password" label="비밀번호 관리" />
          <MenuCard label="시스템 설정" />
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <span className="text-base font-medium text-gray-900">
              버전정보
            </span>
            <span className="text-gray-700 text-base font-medium">1.0.0</span>
          </div>
          <Button
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg border-0"
            variant="ghost"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </div>

        {/* 데스크톱 레이아웃 */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 빠른 작업 */}
          <Card>
            <CardHeader>
              <CardTitle>빠른 작업</CardTitle>
              <CardDescription>자주 사용하는 관리 기능</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActionButton
                href="/admin/courses"
                icon={<Plus className="w-4 h-4 mr-2" />}
                label="새 코스 등록"
              />
              <ActionButton
                href="/admin/courses"
                icon={<Edit className="w-4 h-4 mr-2" />}
                label="코스 관리"
              />
              <ActionButton
                href="/admin/password"
                icon={<Lock className="w-4 h-4 mr-2" />}
                label="앱 비밀번호 변경"
              />
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
                    <CourseRow key={course.id} course={course} />
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
  );
}

// 통계 카드 컴포넌트
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconBg: string;
}

function StatCard({ icon, label, value, iconBg }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-2 ${iconBg} rounded-lg`}>{icon}</div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 모바일 메뉴 카드 컴포넌트
interface MenuCardProps {
  href?: string;
  label: string;
}

function MenuCard({ href, label }: MenuCardProps) {
  const content = (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
      <span className="text-base font-medium text-gray-900">{label}</span>
      <ChevronRight className="text-gray-400 text-lg" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// 빠른 작업 버튼 컴포넌트
interface ActionButtonProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function ActionButton({ href, icon, label, onClick }: ActionButtonProps) {
  if (href) {
    return (
      <Link href={href} className="block">
        <Button className="w-full justify-start" variant="outline">
          {icon}
          {label}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      className="w-full justify-start"
      variant="outline"
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}

// 코스 행 컴포넌트
interface CourseRowProps {
  course: Course;
}

function CourseRow({ course }: CourseRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{course.title}</p>
        <p className="text-sm text-gray-600">
          {course.distance_km}km · {course.difficulty}
        </p>
      </div>
      <div className="flex space-x-1">
        <Link href={`/admin/courses/${course.id}/manage`}>
          <Button size="sm" variant="ghost">
            <Edit className="w-4 h-4" />
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          className="text-gray-600 hover:text-gray-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
