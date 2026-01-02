"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { logCourseDelete } from "@/shared/lib/audit-log";
import { useSession, signOut } from "next-auth/react";
import { adminDeleteCourseAction } from "@/app/actions/admin-courses";

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
  const router = useRouter();
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalCourses: 0,
    totalComments: 0,
    activeUsers: 0,
  });
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null);

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

      // 통계 데이터 로드 (API 사용 - RLS 우회)
      const statsResponse = await fetch("/api/admin/stats");
      if (!statsResponse.ok) {
        throw new Error("Failed to fetch stats");
      }
      const statsData = await statsResponse.json();

      setCourses(coursesData || []);
      setStats({
        totalCourses: statsData.totalCourses || 0,
        totalComments: statsData.totalComments || 0,
        activeUsers: statsData.activeUsers || 0,
      });
    } catch (error) {
      console.error("Dashboard data load error:", error);
      toast.error("대시보드 데이터를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // NextAuth 세션 로그아웃 (카카오 로그인 기반)
    await signOut({ redirect: false });
    router.push("/login");
  };

  const handleDeleteCourse = async (course: Course) => {
    if (
      !confirm(
        `"${course.title}" 코스를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }

    try {
      setDeletingCourse(course.id);

      // Server Action을 사용하여 코스 삭제 (RLS 우회)
      const result = await adminDeleteCourseAction(course.id);

      if (!result.success) {
        throw new Error(result.error || "코스 삭제에 실패했습니다");
      }

      // 감사 로그 기록
      if (session?.user?.id && session?.user?.name) {
        await logCourseDelete(session.user.id, session.user.name, course.id, {
          title: course.title,
          distance_km: course.distance_km,
          difficulty: course.difficulty,
        });
      }

      toast.success("코스가 삭제되었습니다");

      // 대시보드 데이터 다시 로드
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error(
        error instanceof Error ? error.message : "코스 삭제에 실패했습니다",
      );
    } finally {
      setDeletingCourse(null);
    }
  };

  return (
    <div className="min-h-screen bg-base">
      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 페이지 제목 - 모바일 */}
        <h1 className="text-2xl font-bold text-lola-950 mb-6 md:hidden">
          관리자 대시보드
        </h1>

        {/* 통계 카드 - 모바일 미니 버전 */}
        <div className="md:hidden grid grid-cols-3 gap-2 mb-6">
          <MiniStatCard label="코스" value={stats.totalCourses} />
          <MiniStatCard label="댓글" value={stats.totalComments} />
          <MiniStatCard label="사용자" value={stats.activeUsers} />
        </div>

        {/* 통계 카드 - 데스크톱 */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Map className="w-6 h-6 text-lola-600" />}
            label="총 코스"
            value={stats.totalCourses}
            iconBg="bg-lola-100"
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-lola-700" />}
            label="총 댓글"
            value={stats.totalComments}
            iconBg="bg-lola-200"
          />
          <StatCard
            icon={<MapPin className="w-6 h-6 text-lola-800" />}
            label="활성 사용자"
            value={stats.activeUsers}
            iconBg="bg-lola-300"
          />
        </div>

        {/* 모바일 메뉴 리스트 */}
        <div className="block md:hidden space-y-4 mb-8">
          <MenuCard href="/admin/courses" label="코스 관리" />
          <MenuCard href="/admin/users" label="사용자 관리" />
          <MenuCard href="/admin/password" label="비밀번호 관리" />
          <MenuCard href="/admin/settings" label="시스템 설정" />
          <div className="bg-white rounded-lg border border-lola-200 p-4 flex items-center justify-between">
            <span className="text-base font-medium text-lola-950">
              버전정보
            </span>
            <span className="text-lola-700 text-base font-medium">1.0.0</span>
          </div>
          <Button
            className="w-full bg-lola-200 hover:bg-lola-300 text-lola-700 font-medium py-3 rounded-lg border-0"
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
                href="/admin/users"
                icon={<Users className="w-4 h-4 mr-2" />}
                label="사용자 관리"
              />
              <ActionButton
                href="/admin/password"
                icon={<Lock className="w-4 h-4 mr-2" />}
                label="앱 비밀번호 변경"
              />
              <ActionButton
                href="/admin/settings"
                icon={<Settings className="w-4 h-4 mr-2" />}
                label="시스템 설정"
              />
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-track-primary mx-auto"></div>
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <CourseRow
                      key={course.id}
                      course={course}
                      onDelete={handleDeleteCourse}
                      isDeleting={deletingCourse === course.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-lola-400 mx-auto mb-4" />
                  <p className="text-lola-600">등록된 코스가 없습니다</p>
                  <p className="text-sm text-lola-500 mt-1">
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
            <p className="text-sm text-lola-600">{label}</p>
            <p className="text-2xl font-semibold text-lola-950">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 모바일 미니 통계 카드 컴포넌트
interface MiniStatCardProps {
  label: string;
  value: number;
}

function MiniStatCard({ label, value }: MiniStatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-lola-200 p-3 text-center">
      <p className="text-2xl font-bold text-lola-950 mb-1">{value}</p>
      <p className="text-xs text-lola-600">{label}</p>
    </div>
  );
}

// 모바일 메뉴 카드 컴포넌트
interface MenuCardProps {
  href?: string;
  label: string;
}

function MenuCard({ href, label }: MenuCardProps) {
  const content = (
    <div className="bg-white rounded-lg border border-lola-200 p-4 flex items-center justify-between cursor-pointer hover:bg-lola-50">
      <span className="text-base font-medium text-lola-950">{label}</span>
      <ChevronRight className="text-lola-400 text-lg" />
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
  onDelete: (course: Course) => Promise<void>;
  isDeleting: boolean;
}

function CourseRow({ course, onDelete, isDeleting }: CourseRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-lola-50 rounded-lg">
      <div>
        <p className="font-medium text-lola-950">{course.title}</p>
        <p className="text-sm text-lola-600">
          {course.distance_km}km · {course.difficulty}
        </p>
      </div>
      <div className="flex space-x-1">
        <Link href={`/admin/courses/${course.id}/manage`}>
          <Button size="sm" variant="ghost" disabled={isDeleting}>
            <Edit className="w-4 h-4" />
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          className="text-lola-600 hover:text-lola-700 hover:bg-lola-100"
          onClick={() => onDelete(course)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-lola-600 border-t-transparent" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
