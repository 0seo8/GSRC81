"use client";

import { useEffect, useState } from "react";
import { supabase, TABLES } from "@/lib/supabase";

interface ConnectionStatus {
  isConnected: boolean;
  error?: string;
  tables: {
    [key: string]: {
      exists: boolean;
      rowCount?: number;
      error?: string;
    };
  };
}

export default function TestConnectionPage() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    tables: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setLoading(true);

      // 1. 기본 연결 테스트
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .limit(1);

      if (error) {
        throw new Error(`연결 오류: ${error.message}`);
      }

      setStatus((prev) => ({ ...prev, isConnected: true }));

      // 2. 각 테이블 존재 여부 및 행 수 확인
      const tableChecks = await Promise.allSettled(
        Object.entries(TABLES).map(async ([tableName, tableKey]) => {
          try {
            const { count, error: countError } = await supabase
              .from(tableKey)
              .select("*", { count: "exact", head: true });

            if (countError) {
              return {
                tableName,
                tableKey,
                exists: false,
                error: countError.message,
              };
            }

            return {
              tableName,
              tableKey,
              exists: true,
              rowCount: count || 0,
            };
          } catch (err) {
            return {
              tableName,
              tableKey,
              exists: false,
              error: err instanceof Error ? err.message : "알 수 없는 오류",
            };
          }
        })
      );

      const tableResults: ConnectionStatus["tables"] = {};
      tableChecks.forEach((result, index) => {
        const tableName = Object.keys(TABLES)[index];
        if (result.status === "fulfilled") {
          const { tableKey, exists, rowCount, error } = result.value;
          tableResults[tableName] = { exists, rowCount, error };
        } else {
          tableResults[tableName] = {
            exists: false,
            error: result.reason?.message || "Promise rejected",
          };
        }
      });

      setStatus((prev) => ({ ...prev, tables: tableResults }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      }));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">스파베이스 연결을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          스파베이스 연결 상태 확인
        </h1>

        {/* 연결 상태 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">연결 상태</h2>
          <div className="flex items-center space-x-3">
            <div
              className={`w-4 h-4 rounded-full ${
                status.isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span
              className={`font-medium ${
                status.isConnected ? "text-green-600" : "text-red-600"
              }`}
            >
              {status.isConnected ? "연결됨" : "연결 실패"}
            </span>
          </div>
          {status.error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{status.error}</p>
            </div>
          )}
        </div>

        {/* 테이블 상태 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">테이블 상태</h2>
          <div className="space-y-4">
            {Object.entries(status.tables).map(([tableName, tableStatus]) => (
              <div
                key={tableName}
                className="border border-gray-200 rounded-md p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{tableName}</h3>
                    <p className="text-sm text-gray-500">
                      {TABLES[tableName as keyof typeof TABLES]}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        tableStatus.exists ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        tableStatus.exists ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tableStatus.exists ? "존재함" : "존재하지 않음"}
                    </span>
                    {tableStatus.exists &&
                      tableStatus.rowCount !== undefined && (
                        <span className="text-sm text-gray-500">
                          ({tableStatus.rowCount}개 행)
                        </span>
                      )}
                  </div>
                </div>
                {tableStatus.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-xs">{tableStatus.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 재시도 버튼 */}
        <div className="mt-6 text-center">
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "확인 중..." : "다시 확인"}
          </button>
        </div>
      </div>
    </div>
  );
}
