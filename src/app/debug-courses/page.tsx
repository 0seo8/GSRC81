"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function DebugCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
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
        .eq("is_active", true);

      if (error) throw error;

      setCourses(data || []);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          코스 디버그 페이지
        </h1>

        <Button onClick={loadCourses} disabled={loading} className="mb-6">
          {loading ? "로딩 중..." : "코스 다시 로드"}
        </Button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            등록된 코스 목록 ({courses.length}개)
          </h2>

          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map((course, index) => (
                <div
                  key={course.id}
                  className="border border-gray-200 rounded-md p-4"
                >
                  <h3 className="font-medium text-gray-900 mb-2">
                    #{index + 1} {course.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">ID:</span> {course.id}
                    </div>
                    <div>
                      <span className="font-medium">제목:</span> {course.title}
                    </div>
                    <div>
                      <span className="font-medium">설명:</span>{" "}
                      {course.description || "없음"}
                    </div>
                    <div>
                      <span className="font-medium">거리:</span>{" "}
                      {course.distance_km}km
                    </div>
                    <div>
                      <span className="font-medium">난이도:</span>{" "}
                      {course.difficulty}
                    </div>
                    <div>
                      <span className="font-medium">소요시간:</span>{" "}
                      {course.avg_time_min || "미설정"}분
                    </div>
                    <div>
                      <span className="font-medium">시작 위도:</span>{" "}
                      {course.start_latitude}
                    </div>
                    <div>
                      <span className="font-medium">시작 경도:</span>{" "}
                      {course.start_longitude}
                    </div>
                    <div>
                      <span className="font-medium">가까운 역:</span>{" "}
                      {course.nearest_station || "미설정"}
                    </div>
                    <div>
                      <span className="font-medium">활성화:</span>{" "}
                      {course.is_active ? "예" : "아니오"}
                    </div>
                    <div>
                      <span className="font-medium">등록일:</span>{" "}
                      {new Date(course.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="font-medium">Raw JSON:</span>
                    <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
                      {JSON.stringify(course, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">등록된 코스가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
