"use client";

import { useState, useEffect } from "react";
import { ProtectedAdminRoute } from "@/components/protected-admin-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Loader2, Database, ArrowRight } from "lucide-react";
import { 
  checkMigrationStatus, 
  migrateAllCourses, 
  migrateSingleCourse 
} from "@/lib/gpx-migration";

export default function MigrationPage() {
  const [status, setStatus] = useState({
    total: 0,
    migrated: 0,
    pending: 0,
    percentage: 0
  });
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const currentStatus = await checkMigrationStatus();
    setStatus(currentStatus);
  };

  const handleMigration = async () => {
    if (!confirm('GPX 데이터 마이그레이션을 시작하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setMigrating(true);
    setResults(null);

    try {
      const migrationResults = await migrateAllCourses();
      setResults(migrationResults);
      await loadStatus();
    } catch (error) {
      console.error('Migration failed:', error);
      setResults({
        success: 0,
        failed: status.pending,
        errors: [`Migration failed: ${error}`]
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              GPX 데이터 마이그레이션
            </h1>
            <p className="text-gray-600 mt-2">
              기존 GPX 데이터를 새로운 통합 JSONB 형식으로 변환합니다
            </p>
          </div>

          {/* 현재 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                마이그레이션 상태
              </CardTitle>
              <CardDescription>
                현재 데이터베이스의 마이그레이션 진행 상황
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <div className="text-2xl font-bold">{status.total}</div>
                  <div className="text-sm text-gray-600">전체 코스</div>
                </div>
                <div className="text-center p-4 bg-green-100 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {status.migrated}
                  </div>
                  <div className="text-sm text-gray-600">완료됨</div>
                </div>
                <div className="text-center p-4 bg-yellow-100 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {status.pending}
                  </div>
                  <div className="text-sm text-gray-600">대기 중</div>
                </div>
              </div>

              {/* 진행률 바 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>진행률</span>
                  <span className="font-medium">{status.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${status.percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 마이그레이션 설명 */}
          <Card>
            <CardHeader>
              <CardTitle>마이그레이션 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">변경 사항:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>gpx_coordinates (TEXT) → gpx_data (JSONB)</li>
                  <li>course_points 테이블 데이터 통합</li>
                  <li>거리 소수점 3자리 정밀도</li>
                  <li>시간 형식 개선 (90분 → 1시간 30분)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">새로운 구조:</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "version": "1.1",
  "points": [{"lat": 37.1, "lng": 127.1, "ele": 50}],
  "bounds": {"minLat": 37.1, "maxLat": 37.2, ...},
  "stats": {
    "totalDistance": 14.567,
    "elevationGain": 234,
    "estimatedDuration": 90
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* 실행 결과 */}
          {results && (
            <Card className={results.failed > 0 ? 'border-red-500' : 'border-green-500'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.failed > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  마이그레이션 결과
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded">
                    <div className="text-lg font-semibold text-green-700">
                      {results.success}
                    </div>
                    <div className="text-sm text-gray-600">성공</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <div className="text-lg font-semibold text-red-700">
                      {results.failed}
                    </div>
                    <div className="text-sm text-gray-600">실패</div>
                  </div>
                </div>

                {results.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">오류 내역:</h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      {results.errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 실행 버튼 */}
          <Card>
            <CardContent className="pt-6">
              {status.pending > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">
                          마이그레이션 필요
                        </p>
                        <p className="text-yellow-600 mt-1">
                          {status.pending}개의 코스가 마이그레이션이 필요합니다.
                          실행 전 데이터베이스 백업을 권장합니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleMigration}
                    disabled={migrating}
                    className="w-full"
                    size="lg"
                  >
                    {migrating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        마이그레이션 진행 중...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        마이그레이션 시작
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-medium text-green-700">
                    모든 코스가 마이그레이션되었습니다
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    추가 작업이 필요하지 않습니다
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}