"use client";

import { useState, useEffect } from "react";

interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  hasNotch: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    hasNotch: false,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isMobile = /Mobi|Android/i.test(userAgent);

    // CSS environment variables로 safe area 값 가져오기
    const getSafeAreaInset = (side: string): number => {
      if (typeof window === "undefined" || !window.CSS?.supports) return 0;
      
      // CSS env() 함수를 지원하는지 확인
      if (window.CSS.supports("padding-bottom", "env(safe-area-inset-bottom)")) {
        const testElement = document.createElement("div");
        testElement.style.cssText = `
          position: fixed;
          top: -1000px;
          padding-${side}: env(safe-area-inset-${side});
        `;
        document.body.appendChild(testElement);
        
        const computed = window.getComputedStyle(testElement);
        const value = computed.getPropertyValue(`padding-${side}`);
        const pixels = parseInt(value, 10) || 0;
        
        document.body.removeChild(testElement);
        return pixels;
      }
      return 0;
    };

    // iOS 디바이스에서 notch 여부 감지
    const hasNotch = isIOS && (
      // iPhone X 이후 모델들의 safe area 체크
      getSafeAreaInset("bottom") > 0 ||
      // Viewport height vs screen height 비교로 notch 감지
      (window.screen.height - window.innerHeight > 100)
    );

    const safeAreaInsets = {
      top: getSafeAreaInset("top"),
      bottom: getSafeAreaInset("bottom"),
      left: getSafeAreaInset("left"),
      right: getSafeAreaInset("right"),
    };

    setDeviceInfo({
      isIOS,
      isAndroid,
      isMobile,
      hasNotch,
      safeAreaInsets,
    });
  }, []);

  return deviceInfo;
}