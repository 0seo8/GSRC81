"use client";

import { useEffect, useState } from "react";

/**
 * 지도 로딩 Skeleton UI
 * GSRC81 디자인 시스템 준수:
 * - 배경: #E8E4DF (베이지)
 * - 강조: #000000 (순수 검정)
 * - 프로그레스: 카테고리 색상 (Neon Yellow #E8FF00)
 *
 * React 19 최적화:
 * - 프로그레스 바로 진행 상황 시각화
 * - 실제 데이터 로딩 시간을 예측하여 자연스러운 UX 제공
 */
export function MapSkeleton() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 프로그레스 바 애니메이션: 0 → 90% (실제 로딩이 완료되면 100%로)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        // 비선형 증가: 처음에는 빠르게, 나중에는 느리게
        const increment = Math.max(1, (90 - prev) / 10);
        return Math.min(90, prev + increment);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "#E8E4DF" }}
    >
      {/* 상단 프로그레스 바 - GSRC81 브랜드 색상 */}
      <div
        className="h-1 relative overflow-hidden"
        style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: "#E8FF00", // Neon Yellow (진관동 러닝 색상)
          }}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>
      </div>

      {/* 헤더 Skeleton */}
      <div className="h-14 bg-transparent flex items-center justify-between px-4 z-10">
        <div
          className="w-20 h-8 rounded animate-pulse"
          style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
        ></div>
        <div
          className="w-8 h-8 rounded-full animate-pulse"
          style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
        ></div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {/* 지도 영역 Skeleton - Mapbox Light 스타일과 유사 */}
        <div
          className="w-full h-full relative"
          style={{ backgroundColor: "#EDE9E4" }}
        >
          {/* 지도 그리드 패턴 */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.05) 0.0625rem, transparent 0.0625rem),
                linear-gradient(90deg, rgba(0,0,0,0.05) 0.0625rem, transparent 0.0625rem)
              `,
              backgroundSize: "3.125rem 3.125rem",
            }}
          ></div>

          {/* 중앙 로딩 표시 - 디자인 시스템 준수 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="text-center px-8 py-6 backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: "24px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              }}
            >
              {/* 스피너 - 순수 검정 */}
              <div
                className="animate-spin rounded-full h-10 w-10 border-2 mx-auto mb-3"
                style={{
                  borderColor: "rgba(0,0,0,0.1)",
                  borderTopColor: "#000000",
                }}
              ></div>
              {/* 텍스트 - Bold, 순수 검정 */}
              <p
                className="text-sm font-bold mb-1"
                style={{ color: "#000000" }}
              >
                지도 로딩 중
              </p>
              <p
                className="text-xs font-medium"
                style={{ color: "rgba(0,0,0,0.6)" }}
              >
                코스 정보를 불러오고 있습니다
              </p>
              {/* 프로그레스 퍼센티지 - Neon Yellow */}
              <div
                className="mt-3 text-xs font-black"
                style={{ color: "#000000" }}
              >
                {Math.round(progress)}%
              </div>
            </div>
          </div>

          {/* 위치 버튼 Skeleton */}
          <div className="absolute top-4 right-4">
            <div
              className="w-8 h-8 rounded-lg shadow-lg animate-pulse"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            ></div>
          </div>

          {/* 가상 마커들 - 검정 핀 스타일 */}
          <div
            className="absolute top-1/3 left-1/4 w-6 h-6 rounded-full animate-pulse"
            style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
          ></div>
          <div
            className="absolute top-1/2 right-1/3 w-6 h-6 rounded-full animate-pulse"
            style={{
              backgroundColor: "rgba(0,0,0,0.2)",
              animationDelay: "0.2s",
            }}
          ></div>
          <div
            className="absolute bottom-1/3 left-1/2 w-6 h-6 rounded-full animate-pulse"
            style={{
              backgroundColor: "rgba(0,0,0,0.2)",
              animationDelay: "0.4s",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
