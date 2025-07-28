"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Download, RotateCcw, X } from "lucide-react";

interface MapCaptureHelperProps {
  map: mapboxgl.Map | null;
  onClose?: () => void;
}

export function MapCaptureHelper({ map, onClose }: MapCaptureHelperProps) {
  const [currentZoom, setCurrentZoom] = useState<number>(0);
  const [currentCenter, setCurrentCenter] = useState<[number, number]>([0, 0]);
  const [captureInfo, setCaptureInfo] = useState<string>("");

  // 지도 정보 업데이트
  useEffect(() => {
    if (!map) return;

    const updateMapInfo = () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      setCurrentZoom(zoom);
      setCurrentCenter([center.lng, center.lat]);
    };

    // 초기 정보 설정
    updateMapInfo();

    // 지도 이동/줌 시 정보 업데이트
    map.on("moveend", updateMapInfo);
    map.on("zoomend", updateMapInfo);

    return () => {
      map.off("moveend", updateMapInfo);
      map.off("zoomend", updateMapInfo);
    };
  }, [map]);

  // 고정된 줌 범위
  const ZOOM_RANGE = {
    min: 10,
    max: 16,
    default: 12,
  };

  const resetToDefault = () => {
    if (!map) return;

    map.flyTo({
      center: [126.9227, 37.6176],
      zoom: ZOOM_RANGE.default,
      duration: 1000,
    });

    setCaptureInfo("기본 설정으로 복원됨");
  };

  const captureMapInfo = () => {
    const bounds = map?.getBounds();
    const info = {
      zoom: currentZoom,
      center: currentCenter,
      bounds: bounds
        ? {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          }
        : null,
      timestamp: new Date().toISOString(),
      containerSize: {
        width: map?.getContainer().clientWidth,
        height: map?.getContainer().clientHeight,
      },
    };

    // 콘솔에 출력
    console.log("=== 지도 캡처 정보 ===");
    console.log(JSON.stringify(info, null, 2));

    // 클립보드에 복사
    navigator.clipboard.writeText(JSON.stringify(info, null, 2));

    setCaptureInfo(
      `캡처 완료! 줌: ${currentZoom.toFixed(
        2
      )}, 중심: [${currentCenter[0].toFixed(4)}, ${currentCenter[1].toFixed(
        4
      )}]`
    );
  };

  const downloadCapture = () => {
    if (!map) return;

    setCaptureInfo("이미지 생성 중...");

    // 약간의 지연 후 캡처 (지도가 완전히 렌더링되도록)
    setTimeout(() => {
      try {
        const canvas = map.getCanvas();

        // 직접 toDataURL 사용
        const dataURL = canvas.toDataURL("image/png", 1.0);

        if (dataURL === "data:,") {
          setCaptureInfo("빈 이미지가 생성되었습니다. 다시 시도해주세요.");
          return;
        }

        const link = document.createElement("a");
        link.download = `gsrc81-map-zoom${currentZoom.toFixed(
          0
        )}-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setCaptureInfo("이미지 다운로드 완료!");
      } catch (error) {
        console.error("이미지 캡처 오류:", error);
        setCaptureInfo("캡처 실패! 브라우저 호환성 문제일 수 있습니다.");
      }
    }, 500); // 500ms 대기
  };

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          디자이너 캡처 도구
        </h3>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 현재 지도 정보 */}
      <div className="mb-4 p-2 bg-gray-50 rounded text-xs">
        <div>줌: {currentZoom.toFixed(2)}</div>
        <div>
          중심: [{currentCenter[0].toFixed(4)}, {currentCenter[1].toFixed(4)}]
        </div>
        <div className="text-green-600 mt-1">{captureInfo}</div>
      </div>

      {/* 줌 범위 안내 */}
      <div className="mb-4 p-3 bg-blue-50 rounded text-xs">
        <div className="font-medium text-blue-800 mb-2">🔒 고정 줌 범위</div>
        <div className="text-blue-700">
          <div>최소: {ZOOM_RANGE.min} (서울 전체)</div>
          <div>기본: {ZOOM_RANGE.default} (은평구 중심)</div>
          <div>최대: {ZOOM_RANGE.max} (상세 지역)</div>
        </div>
        <div className="mt-2 text-blue-600 font-medium">
          → 이 범위에서만 사용자가 줌 가능
        </div>
      </div>

      {/* 간단한 액션 */}
      <div className="space-y-2">
        <Button
          onClick={captureMapInfo}
          size="sm"
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          <Camera className="w-3 h-3 mr-1" />
          좌표 정보 복사
        </Button>

        <Button
          onClick={downloadCapture}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Download className="w-3 h-3 mr-1" />
          이미지 다운로드
        </Button>

        <Button
          onClick={resetToDefault}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          기본값 복원
        </Button>
      </div>

      {/* 사용법 */}
      <div className="mt-4 p-2 bg-green-50 rounded text-xs text-green-700">
        <div className="font-medium mb-1">💡 디자이너 안내:</div>
        <div className="space-y-1 text-xs">
          <div>1. 줌 10~16 범위에서만 작동</div>
          <div>2. "이미지 다운로드"로 스크린샷</div>
          <div>3. "좌표 정보 복사"로 위치 데이터</div>
          <div>4. 모든 줌에서 동일하게 보이도록 제작</div>
        </div>
      </div>
    </div>
  );
}
