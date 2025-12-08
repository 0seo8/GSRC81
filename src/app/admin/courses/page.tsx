"use client";

import { useState, useEffect } from "react";
import { ProtectedAdminRoute } from "@/shared/components/common/protected-admin-route";
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
  Plus,
  Edit,
  Trash2,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import {
  CourseV2,
  getDistance,
  getDuration,
} from "@/types/unified";
import { toast } from "sonner";
import {
  getDifficultyLabel,
  getDifficultyColor,
  EMPTY_COURSE_MESSAGE,
} from "@/core/config/course";
import {
  ERROR_MESSAGES,
  CONFIRM_MESSAGES,
  LOADING_MESSAGES,
} from "@/core/config/messages";

export default function CoursesManagePage() {
  const [courses, setCourses] = useState<CourseV2[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Admin: 코스 로딩 오류:", error);
        throw error;
      }

      setCourses(data || []);
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast.error(ERROR_MESSAGES.COURSE_LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (course: CourseV2) => {
    const confirmed = window.confirm(
      CONFIRM_MESSAGES.DELETE_COURSE(course.title),
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", course.id);

      if (error) throw error;

      toast.success("코스가 삭제되었습니다");
      loadCourses();
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error(ERROR_MESSAGES.COURSE_DELETE_FAILED);
    }
  };

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 새 코스 등록 버튼 */}
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">코스 관리</h1>
            <Link href="/admin/courses/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                새 코스 등록
              </Button>
            </Link>
          </div>

          {/* 코스 목록 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {LOADING_MESSAGES.LOADING_COURSES}
              </p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </ProtectedAdminRoute>
  );
}

// 코스 카드 컴포넌트
interface CourseCardProps {
  course: CourseV2;
  onDelete: (course: CourseV2) => Promise<void>;
}

function CourseCard({ course, onDelete }: CourseCardProps) {
  return (
    <Card className="shadow-xl border-0 py-6 gap-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{course.title}</CardTitle>
            <CardDescription>
              {course.gpx_data.metadata?.nearestStation &&
                `${course.gpx_data.metadata.nearestStation} 인근`}
            </CardDescription>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}
          >
            {getDifficultyLabel(course.difficulty)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {course.description || "설명이 없습니다."}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-500">거리</span>
            <p className="font-medium">{getDistance(course).toFixed(2)}km</p>
          </div>
          <div>
            <span className="text-gray-500">소요시간</span>
            <p className="font-medium">{getDuration(course)}</p>
          </div>
        </div>

        <div className="text-xs text-gray-400 mb-4">
          등록일: {new Date(course.created_at).toLocaleDateString()}
        </div>

        <div className="flex space-x-2">
          <Link href={`/admin/courses/${course.id}/manage`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full">
              <Edit className="w-4 h-4 mr-1" />
              관리
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(course)}
            className="text-red-600 hover:text-red-700 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 빈 상태 컴포넌트
function EmptyState() {
  return (
    <div className="text-center py-12">
      <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {EMPTY_COURSE_MESSAGE.title}
      </h3>
      <p className="text-gray-600 mb-6">
        GPX 파일을 업로드하여 첫 번째 러닝 코스를 등록해보세요
      </p>
      <Link href="/admin/courses/new">
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          GPX로 첫 코스 등록하기
        </Button>
      </Link>
    </div>
  );
}
