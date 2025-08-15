export function MapError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 text-gray-400 mx-auto mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          지도 로딩 오류
        </h2>
        <p className="text-gray-600">
          지도를 불러오는 중 문제가 발생했습니다.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}