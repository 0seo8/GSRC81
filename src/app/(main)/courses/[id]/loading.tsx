import { Noto_Sans } from "next/font/google";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * 코스 상세 페이지 로딩 UI
 * 실제 페이지와 유사한 skeleton으로 부드러운 전환 제공
 */
export default function CourseDetailLoading() {
  return (
    <div className={`min-h-screen bg-page-bg ${notoSans.className}`}>
      {/* 헤더 Skeleton */}
      <div className="fixed top-0 left-0 right-0 bg-transparent h-14 z-50 flex items-center justify-between px-4">
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>

      {/* 지도 영역 Skeleton */}
      <div className="w-full h-map-height pt-14 p-2.5">
        <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse relative overflow-hidden">
          {/* 지도 패턴 */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300"></div>

          {/* 지도 컨트롤 버튼들 */}
          <div className="absolute bottom-4 right-4 space-y-2">
            <div className="w-10 h-10 bg-white/80 rounded-lg shadow-lg"></div>
            <div className="w-10 h-10 bg-white/80 rounded-lg shadow-lg"></div>
          </div>
        </div>
      </div>

      {/* 하단 컨텐츠 Skeleton */}
      <div
        className="flex-1 bg-page-bg"
        style={{ minHeight: "calc(100vh - 393px)" }}
      >
        <div className="overflow-y-auto h-full">
          <div className="max-w-2xl mx-auto px-5 py-5 space-y-6">
            {/* 제목 Skeleton */}
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>

            {/* 통계 Skeleton */}
            <div className="grid grid-cols-4 gap-4 py-4 border-b border-black">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* 설명 Skeleton */}
            <div className="space-y-2 py-5 border-b border-black">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
            </div>

            {/* 댓글 Skeleton */}
            <div className="space-y-4 py-6 border-b border-black">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
