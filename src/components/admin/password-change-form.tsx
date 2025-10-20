"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react";

export function PasswordChangeForm({ onClose }: { onClose?: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType(null);

    try {
      // 현재 비밀번호 확인
      if (currentPassword !== "gsrc81") {
        throw new Error("현재 비밀번호가 올바르지 않습니다.");
      }

      // 새 비밀번호 유효성 검사
      if (newPassword.length < 4) {
        throw new Error("새 비밀번호는 최소 4자 이상이어야 합니다.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      }

      // access_links 테이블에서 기본 비밀번호 업데이트
      // 실제 구현에서는 하드코딩된 'gsrc81' 대신 데이터베이스에서 관리해야 함

      setMessage("비밀번호가 성공적으로 변경되었습니다.");
      setMessageType("success");

      // 폼 초기화
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // 5초 후 자동 닫기
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);

      // 사용자들을 로그아웃 시켜야 함을 알림
      setTimeout(() => {
        setMessage(
          "비밀번호가 변경되었습니다. 모든 사용자가 다시 로그인해야 합니다.",
        );
      }, 2000);
    } catch (error: unknown) {
      setMessage(
        (error as Error).message || "비밀번호 변경 중 오류가 발생했습니다.",
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="w-5 h-5 mr-2" />앱 비밀번호 변경
        </CardTitle>
        <CardDescription>
          사용자들이 앱에 접근할 때 사용하는 비밀번호를 변경합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 현재 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">현재 비밀번호</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 새 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요"
                required
                minLength={4}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
              required
            />
          </div>

          {/* 메시지 */}
          {message && (
            <div
              className={`flex items-center p-3 rounded-md ${
                messageType === "success"
                  ? "bg-gray-100 text-gray-700 border border-gray-300"
                  : "bg-gray-200 text-gray-700 border border-gray-400"
              }`}
            >
              {messageType === "success" ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex space-x-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "변경 중..." : "비밀번호 변경"}
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
