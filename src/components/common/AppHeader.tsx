"use client";

import { Button } from "@/components/ui/button";
import { MapPin, LogOut, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface AppHeaderProps {
  showCaptureButton?: boolean;
  showCaptureHelper?: boolean;
  onToggleCapture?: () => void;
}

export function AppHeader({
  showCaptureButton = false,
  showCaptureHelper = false,
  onToggleCapture,
}: AppHeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const handleLogoClick = () => {
    router.push("/map");
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleLogoClick}
        >
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              GSRC81 Maps
            </h1>
            <p className="text-xs text-gray-500">
              구파발 러너 매퍼
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showCaptureButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCapture}
              className="text-gray-600 hover:text-blue-600"
              title="디자이너 도구 토글"
            >
              <Camera className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}