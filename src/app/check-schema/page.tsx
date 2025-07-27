"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface TableInfo {
  table_name: string;
  table_schema: string;
  table_type: string;
  columns?: ColumnInfo[];
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
}

export default function CheckSchemaPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSchema();
  }, []);

  const checkSchema = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. 모든 테이블 목록 조회
      const { data: tablesData, error: tablesError } = await supabase.rpc(
        "get_all_tables"
      );

      if (tablesError) {
        // RPC 함수가 없을 경우 직접 쿼리
        const { data, error } = await supabase
          .from("information_schema.tables")
          .select("table_name, table_schema, table_type")
          .eq("table_schema", "public");

        if (error) {
          throw new Error(`테이블 목록 조회 실패: ${error.message}`);
        }

        setTables(data || []);
      } else {
        setTables(tablesData || []);
      }

      // 2. 각 테이블의 컬럼 정보 조회
      const tablesWithColumns = await Promise.all(
        (tablesData || []).map(async (table: TableInfo) => {
          try {
            const { data: columnsData, error: columnsError } = await supabase
              .from("information_schema.columns")
              .select("column_name, data_type, is_nullable, column_default")
              .eq("table_schema", "public")
              .eq("table_name", table.table_name)
              .order("ordinal_position");

            if (columnsError) {
              console.warn(
                `테이블 ${table.table_name} 컬럼 정보 조회 실패:`,
                columnsError
              );
              return { ...table, columns: [] };
            }

            return { ...table, columns: columnsData || [] };
          } catch (err) {
            console.warn(
              `테이블 ${table.table_name} 컬럼 정보 조회 실패:`,
              err
            );
            return { ...table, columns: [] };
          }
        })
      );

      setTables(tablesWithColumns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const createSchemaFunction = async () => {
    try {
      // 스키마 생성 함수를 만들어서 테이블 목록을 조회
      const { error } = await supabase.rpc("create_schema_function", {
        sql: `
          CREATE OR REPLACE FUNCTION get_all_tables()
          RETURNS TABLE (
            table_name text,
            table_schema text,
            table_type text
          ) AS $$
          BEGIN
            RETURN QUERY
            SELECT 
              t.table_name::text,
              t.table_schema::text,
              t.table_type::text
            FROM information_schema.tables t
            WHERE t.table_schema = 'public'
            ORDER BY t.table_name;
          END;
          $$ LANGUAGE plpgsql;
        `,
      });

      if (error) {
        console.warn("스키마 함수 생성 실패:", error);
      } else {
        console.log("스키마 함수 생성 성공");
        await checkSchema(); // 다시 조회
      }
    } catch (err) {
      console.warn("스키마 함수 생성 중 오류:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">스키마 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          스파베이스 스키마 확인
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={checkSchema}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              스키마 다시 확인
            </button>
            <button
              onClick={createSchemaFunction}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              스키마 함수 생성
            </button>
          </div>
        </div>

        {/* 테이블 목록 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            테이블 목록 ({tables.length}개)
          </h2>

          {tables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">테이블이 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">
                데이터베이스 스키마를 적용해야 합니다.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {tables.map((table) => (
                <div
                  key={table.table_name}
                  className="border border-gray-200 rounded-md p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {table.table_name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {table.table_type}
                    </span>
                  </div>

                  {table.columns && table.columns.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        컬럼 정보
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-2">컬럼명</th>
                              <th className="text-left py-2 px-2">
                                데이터 타입
                              </th>
                              <th className="text-left py-2 px-2">NULL 허용</th>
                              <th className="text-left py-2 px-2">기본값</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.columns.map((column) => (
                              <tr
                                key={column.column_name}
                                className="border-b border-gray-100"
                              >
                                <td className="py-2 px-2 font-medium">
                                  {column.column_name}
                                </td>
                                <td className="py-2 px-2 text-gray-600">
                                  {column.data_type}
                                </td>
                                <td className="py-2 px-2 text-gray-600">
                                  {column.is_nullable}
                                </td>
                                <td className="py-2 px-2 text-gray-600">
                                  {column.column_default || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 스키마 적용 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-6">
          <h3 className="font-medium text-yellow-800 mb-2">스키마 적용 방법</h3>
          <p className="text-yellow-700 text-sm mb-3">
            테이블이 없다면 다음 방법으로 스키마를 적용할 수 있습니다:
          </p>
          <ol className="text-yellow-700 text-sm list-decimal list-inside space-y-1">
            <li>스파베이스 대시보드에서 SQL Editor 열기</li>
            <li>database/schema.sql 파일의 내용을 복사</li>
            <li>SQL Editor에 붙여넣고 실행</li>
            <li>이 페이지를 새로고침하여 확인</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
