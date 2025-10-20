export function MapSkeleton() {
  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        {/* 지도 스켈레톤 */}
        <div className="w-full h-full bg-gray-200 animate-pulse relative">
          {/* 로딩 스피너 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-700">
                지도 로딩 중...
              </p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
            </div>
          </div>

          {/* 컨트롤 스켈레톤 */}
          <div className="absolute top-4 right-4 space-y-2">
            <div className="w-8 h-8 bg-gray-300 rounded shadow animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-300 rounded shadow animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
