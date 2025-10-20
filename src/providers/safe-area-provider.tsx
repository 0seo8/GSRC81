"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useDeviceDetection } from "@/hooks/use-device-detection";

const SafeAreaContext = createContext({
  isIOS: false,
  safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
});

export function useSafeArea() {
  return useContext(SafeAreaContext);
}

interface SafeAreaProviderProps {
  children: ReactNode;
}

export function SafeAreaProvider({ children }: SafeAreaProviderProps) {
  const { isIOS, safeAreaInsets } = useDeviceDetection();

  // CSS 커스텀 프로퍼티로 safe area 값 설정
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    // CSS 변수 설정
    root.style.setProperty("--safe-area-inset-top", `${safeAreaInsets.top}px`);
    root.style.setProperty(
      "--safe-area-inset-bottom",
      `${safeAreaInsets.bottom}px`,
    );
    root.style.setProperty(
      "--safe-area-inset-left",
      `${safeAreaInsets.left}px`,
    );
    root.style.setProperty(
      "--safe-area-inset-right",
      `${safeAreaInsets.right}px`,
    );

    // iOS 여부도 CSS 변수로 설정
    root.style.setProperty("--is-ios", isIOS ? "1" : "0");

    // body에 iOS 클래스 추가
    if (isIOS) {
      document.body.classList.add("is-ios");
    } else {
      document.body.classList.remove("is-ios");
    }

    return () => {
      // cleanup
      root.style.removeProperty("--safe-area-inset-top");
      root.style.removeProperty("--safe-area-inset-bottom");
      root.style.removeProperty("--safe-area-inset-left");
      root.style.removeProperty("--safe-area-inset-right");
      root.style.removeProperty("--is-ios");
      document.body.classList.remove("is-ios");
    };
  }, [isIOS, safeAreaInsets]);

  return (
    <SafeAreaContext.Provider value={{ isIOS, safeAreaInsets }}>
      {children}
    </SafeAreaContext.Provider>
  );
}
