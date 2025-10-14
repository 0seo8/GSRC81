"use client";

import dynamic from "next/dynamic";

const TrailMapV2 = dynamic(() => import("@/components/map/trail-map-v2"), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] md:h-[80vh] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
        <p className="text-gray-600">지도를 불러오는 중...</p>
      </div>
    </div>
  ),
});

interface CourseDetailMapClientProps {
  courseId: string;
}

export function CourseDetailMapClient({ courseId }: CourseDetailMapClientProps) {
  return <TrailMapV2 courseId={courseId} />;
}