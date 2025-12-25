"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { toast } from "sonner";
import { Plane, Clock, Gauge } from "lucide-react";
import { logFlightSettingsUpdate } from "@/shared/lib/audit-log";
import { useSession } from "next-auth/react";

interface FlightSettings {
  speedKmh: number;
  minDuration: number;
  maxDuration: number;
}

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<FlightSettings>({
    speedKmh: 2.5,
    minDuration: 15000,
    maxDuration: 90000,
  });
  const [originalSettings, setOriginalSettings] = useState<FlightSettings>({
    speedKmh: 2.5,
    minDuration: 15000,
    maxDuration: 90000,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("app_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "flight_speed_kmh",
          "flight_min_duration",
          "flight_max_duration",
        ]);

      if (error) throw error;

      if (data && data.length > 0) {
        const newSettings = { ...settings };

        data.forEach((row) => {
          const value =
            typeof row.setting_value === "number"
              ? row.setting_value
              : parseFloat(String(row.setting_value));

          switch (row.setting_key) {
            case "flight_speed_kmh":
              newSettings.speedKmh = value;
              break;
            case "flight_min_duration":
              newSettings.minDuration = value;
              break;
            case "flight_max_duration":
              newSettings.maxDuration = value;
              break;
          }
        });

        setSettings(newSettings);
        setOriginalSettings(newSettings); // 원본 설정 저장
      }
    } catch (error) {
      console.error("설정 로드 실패:", error);
      toast.error("설정을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const supabase = createClient();

      // 각 설정값을 개별적으로 업데이트
      const updates = [
        {
          setting_key: "flight_speed_kmh",
          setting_value: settings.speedKmh,
        },
        {
          setting_key: "flight_min_duration",
          setting_value: settings.minDuration,
        },
        {
          setting_key: "flight_max_duration",
          setting_value: settings.maxDuration,
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("app_settings")
          .update({ setting_value: update.setting_value })
          .eq("setting_key", update.setting_key);

        if (error) throw error;
      }

      // 감사 로그 기록
      if (session?.user?.id && session?.user?.name) {
        await logFlightSettingsUpdate(
          session.user.id,
          session.user.name,
          originalSettings,
          settings,
        );
      }

      toast.success("설정이 저장되었습니다");

      // 페이지 새로고침하여 변경사항 즉시 반영
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("설정 저장 실패:", error);
      toast.error("설정 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lola-950" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-lola-950 mb-8">시스템 설정</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5" />
              비행 모드 설정
            </CardTitle>
            <CardDescription>
              코스 상세 페이지의 비행 애니메이션 속도를 조절할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 비행 속도 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-lola-950">
                <Gauge className="w-4 h-4" />
                비행 속도 (km/h)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="10"
                value={settings.speedKmh}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    speedKmh: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-lola-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lola-500"
              />
              <p className="text-xs text-lola-600">
                권장: 2.5 km/h (느리게) ~ 5 km/h (빠르게)
              </p>
            </div>

            {/* 최소 시간 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-lola-950">
                <Clock className="w-4 h-4" />
                최소 애니메이션 시간 (초)
              </label>
              <input
                type="number"
                step="1"
                min="5"
                max="60"
                value={settings.minDuration / 1000}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minDuration: parseFloat(e.target.value) * 1000,
                  })
                }
                className="w-full px-4 py-2 border border-lola-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lola-500"
              />
              <p className="text-xs text-lola-600">
                짧은 코스의 최소 비행 시간 (기본: 15초)
              </p>
            </div>

            {/* 최대 시간 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-lola-950">
                <Clock className="w-4 h-4" />
                최대 애니메이션 시간 (초)
              </label>
              <input
                type="number"
                step="10"
                min="30"
                max="300"
                value={settings.maxDuration / 1000}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxDuration: parseFloat(e.target.value) * 1000,
                  })
                }
                className="w-full px-4 py-2 border border-lola-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lola-500"
              />
              <p className="text-xs text-lola-600">
                긴 코스의 최대 비행 시간 (기본: 90초, 권장: 180초)
              </p>
            </div>

            {/* 미리보기 */}
            <div className="bg-lola-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium text-lola-950">
                📊 예상 비행 시간
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-lola-600">5km 코스:</span>
                  <span className="ml-2 font-medium text-lola-950">
                    {Math.min(
                      Math.max(
                        Math.round((5 / settings.speedKmh) * 60),
                        settings.minDuration / 1000,
                      ),
                      settings.maxDuration / 1000,
                    )}
                    초
                  </span>
                </div>
                <div>
                  <span className="text-lola-600">10km 코스:</span>
                  <span className="ml-2 font-medium text-lola-950">
                    {Math.min(
                      Math.max(
                        Math.round((10 / settings.speedKmh) * 60),
                        settings.minDuration / 1000,
                      ),
                      settings.maxDuration / 1000,
                    )}
                    초
                  </span>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-lola-950 hover:bg-lola-800 text-white"
              >
                {saving ? "저장 중..." : "설정 저장"}
              </Button>
              <Button
                onClick={loadSettings}
                variant="outline"
                disabled={saving}
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
