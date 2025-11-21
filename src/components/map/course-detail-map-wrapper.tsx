"use client";

import dynamic from "next/dynamic";

// 클라이언트 컴포넌트에서만 dynamic import with ssr: false 사용 가능
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

interface CourseDetailMapWrapperProps {
  courseId: string;
}

export function CourseDetailMapWrapper({
  courseId,
}: CourseDetailMapWrapperProps) {
  return <CourseDetailMap courseId={courseId} />;
}
