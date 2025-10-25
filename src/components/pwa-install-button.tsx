"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // PWA가 이미 설치되었는지 확인
    const isInStandaloneMode = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const isIOSStandalone =
      "standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true;

    if (isInStandaloneMode || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // 앱이 설치된 후 이벤트 리스너
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 사용자가 이미 설치 프롬프트를 본 경우 확인
    const hasSeenPrompt = localStorage.getItem("pwa-install-prompt-seen");
    if (hasSeenPrompt && !deferredPrompt) {
      // 일정 시간 후 다시 보여주기 (7일)
      const lastSeen = parseInt(hasSeenPrompt);
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - lastSeen > weekInMs) {
        localStorage.removeItem("pwa-install-prompt-seen");
      }
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("PWA 설치 승인됨");
      } else {
        console.log("PWA 설치 거부됨");
      }

      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      localStorage.setItem("pwa-install-prompt-seen", Date.now().toString());
    } catch (error) {
      console.error("PWA 설치 오류:", error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-prompt-seen", Date.now().toString());
  };

  // 이미 설치되었거나 프롬프트가 없으면 표시하지 않음
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  GSRC81 MAPS 설치
                </h3>
                <p className="text-xs text-gray-600">
                  홈 화면에 추가하여 앱처럼 사용하세요
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-black hover:bg-gray-800 text-white"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              설치
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="px-4"
            >
              나중에
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
