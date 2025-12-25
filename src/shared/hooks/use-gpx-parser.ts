/**
 * GPX 파일 파싱 Hook
 * - 비즈니스 로직 분리
 * - 재사용 가능
 * - 테스트 용이
 */

import { useState } from "react";
import { toast } from "sonner";
import { GPX_LIMITS, formatFileSize } from "@/shared/constants/file-limits";
import { FLIGHT_DEFAULTS } from "@/shared/constants/flight-settings";

export interface GPXData {
  name: string;
  distance: number;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
  duration: number;
  elevationGain: number;
  coordinates: Array<{ lat: number; lng: number; ele?: number }>;
}

interface UseGPXParserReturn {
  gpxData: GPXData | null;
  parsing: boolean;
  parseFile: (file: File) => Promise<GPXData | null>;
  reset: () => void;
}

export function useGPXParser(): UseGPXParserReturn {
  const [gpxData, setGpxData] = useState<GPXData | null>(null);
  const [parsing, setParsing] = useState(false);

  const parseFile = async (file: File): Promise<GPXData | null> => {
    // 파일 크기 검증
    if (file.size > GPX_LIMITS.MAX_FILE_SIZE) {
      toast.error(
        `파일 크기는 ${GPX_LIMITS.MAX_FILE_SIZE_MB}MB를 초과할 수 없습니다.\n현재 파일: ${formatFileSize(file.size)}`,
      );
      return null;
    }

    setParsing(true);

    try {
      const parsed = await parseGPXFile(file);
      setGpxData(parsed);
      return parsed;
    } catch (error) {
      console.error("GPX 파싱 에러:", error);
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      toast.error(`GPX 파일 파싱 중 오류가 발생했습니다:\n${errorMessage}`);
      return null;
    } finally {
      setParsing(false);
    }
  };

  const reset = () => {
    setGpxData(null);
  };

  return {
    gpxData,
    parsing,
    parseFile,
    reset,
  };
}

/**
 * GPX 파일 파싱 로직
 * - Pure function으로 분리
 * - 테스트 용이
 */
async function parseGPXFile(file: File): Promise<GPXData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // XML 파싱 에러 체크
        const parserError = xmlDoc.querySelector("parsererror");
        if (parserError) {
          throw new Error("GPX 파일이 손상되었거나 형식이 올바르지 않습니다.");
        }

        // 트랙 포인트 추출
        const trackPoints = Array.from(xmlDoc.querySelectorAll("trkpt"));

        if (trackPoints.length === 0) {
          throw new Error(
            "유효한 GPX 파일이 아닙니다. 트랙 포인트(trkpt)가 없습니다.",
          );
        }

        if (trackPoints.length < GPX_LIMITS.MIN_TRACK_POINTS) {
          throw new Error(
            `트랙 포인트가 너무 적습니다. 최소 ${GPX_LIMITS.MIN_TRACK_POINTS}개 이상 필요 (현재: ${trackPoints.length}개)`,
          );
        }

        // 좌표 배열 생성
        const coordinates = trackPoints.map((point) => ({
          lat: parseFloat(point.getAttribute("lat") || "0"),
          lng: parseFloat(point.getAttribute("lon") || "0"),
          ele: point.querySelector("ele")
            ? parseFloat(point.querySelector("ele")?.textContent || "0")
            : undefined,
        }));

        // 거리 계산
        const totalDistance = calculateTotalDistance(coordinates);

        // 고도 상승 계산
        const elevationGain = calculateElevationGain(coordinates);

        // GPX 파일에서 이름 추출
        const nameElement = xmlDoc.querySelector("name");
        const gpxName =
          nameElement?.textContent || file.name.replace(".gpx", "");

        // 예상 소요시간 계산
        const estimatedDuration = Math.round(
          (totalDistance / FLIGHT_DEFAULTS.ESTIMATION_SPEED) * 60,
        );

        const gpxData: GPXData = {
          name: gpxName,
          distance: Math.round(totalDistance * 100) / 100,
          startPoint: coordinates[0],
          endPoint: coordinates[coordinates.length - 1],
          duration: estimatedDuration,
          elevationGain: Math.round(elevationGain),
          coordinates,
        };

        resolve(gpxData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽는 중 오류가 발생했습니다."));
    };

    reader.readAsText(file);
  });
}

/**
 * Haversine formula를 사용한 거리 계산
 */
function calculateTotalDistance(
  coordinates: Array<{ lat: number; lng: number }>,
): number {
  const R = 6371; // 지구 반경 (km)
  let totalDistance = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const coord1 = coordinates[i - 1];
    const coord2 = coordinates[i];

    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.lat * Math.PI) / 180) *
        Math.cos((coord2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;
  }

  return totalDistance;
}

/**
 * 고도 상승 계산
 */
function calculateElevationGain(
  coordinates: Array<{ lat: number; lng: number; ele?: number }>,
): number {
  let elevationGain = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prevEle = coordinates[i - 1].ele || 0;
    const currEle = coordinates[i].ele || 0;

    if (currEle > prevEle) {
      elevationGain += currEle - prevEle;
    }
  }

  return elevationGain;
}
