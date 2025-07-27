"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SimpleTestPage() {
  const [status, setStatus] = useState<string>("확인 중...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus("연결 테스트 중...");

      // 1. 기본 연결 테스트 (app_settings 테이블이 없을 수 있으므로 다른 방법 사용)
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .limit(1);

      if (error) {
        throw new Error(`연결 오류: ${error.message}`);
      }

      setStatus("연결 성공!");

      // 2. 테이블 목록 확인
      const { data: tables, error: tablesError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public");

      if (tablesError) {
        console.warn("테이블 목록 조회 실패:", tablesError);
      } else {
        console.log("현재 테이블 목록:", tables);
        setStatus(`연결 성공! (테이블 ${tables?.length || 0}개 발견)`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류";
      setError(errorMessage);
      setStatus("연결 실패");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          스파베이스 연결 테스트
        </h1>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-700 mb-2">
              상태: {status}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          <button
            onClick={testConnection}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            다시 테스트
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>스키마가 적용되지 않았다면</p>
            <p>스파베이스 대시보드에서 SQL Editor를 열고</p>
            <p>database/schema.sql 파일을 실행하세요</p>
          </div>
        </div>
      </div>
    </div>
  );
}
