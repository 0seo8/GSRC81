import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FLIGHT_CONFIG } from "@/features/map/components/trail-map/constants";

export interface FlightSettings {
  speedKmh: number;
  minDuration: number;
  maxDuration: number;
}

/**
 * 비행 모드 설정을 DB에서 가져오는 Hook
 * 기본값은 constants.ts의 FLIGHT_CONFIG 사용
 */
export function useFlightSettings() {
  const [settings, setSettings] = useState<FlightSettings>({
    speedKmh: FLIGHT_CONFIG.FLIGHT_SPEED_KMH,
    minDuration: FLIGHT_CONFIG.MIN_TOTAL_DURATION,
    maxDuration: FLIGHT_CONFIG.MAX_TOTAL_DURATION,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("app_settings")
          .select("setting_key, setting_value")
          .in("setting_key", [
            "flight_speed_kmh",
            "flight_min_duration",
            "flight_max_duration",
          ]);

        if (error) {
          console.error("❌ 비행 설정 로드 실패:", error);
          return;
        }

        if (!data || data.length === 0) {
          console.warn("⚠️ 비행 설정이 없습니다. 기본값 사용");
          return;
        }

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
        console.log("✅ 비행 설정 로드 완료:", newSettings);
      } catch (error) {
        console.error("❌ 비행 설정 로드 에러:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, loading };
}
