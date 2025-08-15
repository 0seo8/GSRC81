"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedAdminRoute } from "@/components/protected-admin-route";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Save,
  Key,
  AlertCircle,
  CheckCircle,
  Copy,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface AccessLink {
  id: string;
  access_code: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export default function PasswordManagePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessLinks, setAccessLinks] = useState<AccessLink[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  useEffect(() => {
    loadAccessLinks();
  }, []);

  const loadAccessLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("access_links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccessLinks(data || []);
    } catch (error) {
      console.error("Failed to load access links:", error);
      showMessage("접근 링크 정보를 불러오는 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType(null);
    }, 5000);
  };

  const generateRandomPassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
    setConfirmPassword(result);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // 폼 검증
    if (!currentPassword) {
      showMessage("현재 비밀번호를 입력해주세요.", "error");
      return;
    }

    if (newPassword.length < 4) {
      showMessage("새 비밀번호는 최소 4자 이상이어야 합니다.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.", "error");
      return;
    }

    try {
      setSaving(true);

      // 실시간으로 데이터베이스에서 현재 비밀번호 확인
      const { data: currentAccessLinks, error: fetchError } = await supabase
        .from("access_links")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      if (!currentAccessLinks || currentAccessLinks.length === 0) {
        showMessage("접근 링크 정보가 없습니다.", "error");
        return;
      }

      if (currentPassword !== currentAccessLinks[0].password_hash) {
        showMessage("현재 비밀번호가 올바르지 않습니다.", "error");
        return;
      }

      // 새 비밀번호를 평문으로 저장 (현재 구조에 맞춤)
      const { error: updateError } = await supabase
        .from("access_links")
        .update({
          password_hash: newPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("is_active", true); // 활성화된 레코드만 업데이트

      if (updateError) throw updateError;

      showMessage(
        "비밀번호가 성공적으로 변경되었습니다. 모든 사용자가 새 비밀번호로 다시 로그인해야 합니다.",
        "success"
      );

      // 폼 초기화
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // 데이터 새로고침
      await loadAccessLinks();
    } catch (error: unknown) {
      console.error("Password change error:", error);
      showMessage(
        (error as Error).message || "비밀번호 변경 중 오류가 발생했습니다.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (accessCode: string) => {
    // 완전한 앱 링크 생성
    const baseUrl = window.location.origin;
    const fullLink = `${baseUrl}?access=${accessCode}`;

    navigator.clipboard.writeText(fullLink).then(() => {
      showMessage("앱 링크가 클립보드에 복사되었습니다.", "success");
    });
  };

  if (loading) {
    return (
      <ProtectedAdminRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">비밀번호 정보를 불러오는 중...</p>
          </div>
        </div>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 메인 콘텐츠 */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 비밀번호 변경 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-gray-600" />
                  비밀번호 변경
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* 현재 비밀번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      현재 비밀번호 *
                    </label>
                    <div className="relative">
                      <Input
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
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      새 비밀번호 *
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="새 비밀번호를 입력하세요"
                        required
                        minLength={4}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1"
                          onClick={generateRandomPassword}
                          title="랜덤 비밀번호 생성"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1"
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
                  </div>

                  {/* 비밀번호 확인 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      새 비밀번호 확인 *
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="새 비밀번호를 다시 입력하세요"
                      required
                    />
                  </div>

                  {/* 안내 메시지 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex">
                      <AlertCircle className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-1">
                          비밀번호 변경 시 주의사항:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>비밀번호는 최소 4자 이상이어야 합니다</li>
                          <li>
                            변경 후 모든 크루원이 새 비밀번호로 다시 로그인해야
                            합니다
                          </li>
                          <li>
                            변경된 비밀번호는 크루원들에게 별도로 전달해주세요
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 저장 버튼 */}
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gray-700 hover:bg-gray-800"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        변경 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        비밀번호 변경
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* 현재 접근 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2 text-gray-600" />
                  현재 접근 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      활성화된 접근 링크
                    </label>
                    {accessLinks.length > 0 ? (
                      <div className="space-y-2">
                        {accessLinks.map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-mono text-sm">
                                {link.access_code}
                              </p>
                              <p className="text-xs text-gray-500">
                                마지막 업데이트:{" "}
                                {new Date(link.updated_at).toLocaleString()}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(link.access_code)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Key className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>등록된 접근 링크가 없습니다</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex">
                      <AlertCircle className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-1">크루원 접근 방법:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>위의 접근 코드를 크루원들에게 공유</li>
                          <li>크루원이 앱 실행 시 접근 코드 입력</li>
                          <li>설정된 비밀번호로 로그인</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 메시지 표시 */}
          {message && (
            <div
              className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg ${
                messageType === "success"
                  ? "bg-gray-100 text-gray-800 border border-gray-300"
                  : "bg-gray-200 text-gray-800 border border-gray-400"
              }`}
            >
              <div className="flex items-center">
                {messageType === "success" ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                <p className="text-sm">{message}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedAdminRoute>
  );
}
