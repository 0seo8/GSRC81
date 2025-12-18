/**
 * 지도 로딩 Skeleton UI
 * 실제 지도와 유사한 스타일로 부드러운 로딩 경험 제공
 */
export function MapSkeleton() {
  return (
    <div className="h-screen bg-page-bg flex flex-col overflow-hidden">
      {/* 헤더 Skeleton */}
      <div className="h-14 bg-transparent flex items-center justify-between px-4 z-10">
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {/* 지도 영역 Skeleton */}
        <div className="w-full h-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 relative">
          {/* 지도 그리드 패턴 */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          ></div>

          {/* Pulse 효과 - 부드러운 로딩 표시 */}
          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>

          {/* 중앙 로딩 표시 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white/90 backdrop-blur-sm px-8 py-6 rounded-2xl shadow-lg">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
              <p className="text-sm font-medium text-gray-700">지도 로딩 중</p>
              <p className="text-xs text-gray-500 mt-1">
                코스 정보를 불러오고 있습니다
              </p>
            </div>
          </div>

          {/* 위치 버튼 Skeleton */}
          <div className="absolute top-4 right-4">
            <div className="w-[30px] h-[30px] bg-white rounded-lg shadow-lg border border-gray-200 animate-pulse"></div>
          </div>

          {/* 가상 마커들 (지도 분위기 연출) */}
          <div className="absolute top-1/3 left-1/4 w-6 h-6 bg-blue-400/30 rounded-full animate-pulse"></div>
          <div
            className="absolute top-1/2 right-1/3 w-6 h-6 bg-blue-400/30 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="absolute bottom-1/3 left-1/2 w-6 h-6 bg-blue-400/30 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
