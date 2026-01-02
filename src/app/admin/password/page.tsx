"use client";

import { useState, useEffect } from "react";
import { ProtectedAdminRoute } from "@/shared/components/common/protected-admin-route";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import {
  Key,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  adminGetAccessCodesAction,
  adminUpdateAccessCodeAction,
  adminCreateAccessCodeAction,
  adminDeleteAccessCodeAction,
  adminToggleAccessCodeAction,
} from "@/app/actions/admin-access";

interface AccessCode {
  id: string;
  code: string;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AccessCodeManagePage() {
  const [loading, setLoading] = useState(true);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null,
  );

  // 새 코드 생성 상태
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAccessCodes();
  }, []);

  const loadAccessCodes = async () => {
    try {
      setLoading(true);
      const result = await adminGetAccessCodesAction();

      if (!result.success) {
        throw new Error(
          result.error || "접근 코드 정보를 불러오는데 실패했습니다",
        );
      }

      setAccessCodes(result.data || []);
    } catch (error) {
      console.error("Failed to load access codes:", error);
      showMessage("접근 코드 정보를 불러오는 중 오류가 발생했습니다.", "error");
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

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCode.trim()) {
      showMessage("접근 코드를 입력해주세요.", "error");
      return;
    }

    try {
      setCreating(true);
      const result = await adminCreateAccessCodeAction(
        newCode.trim(),
        newDescription.trim() || undefined,
      );

      if (!result.success) {
        showMessage(result.error || "접근 코드 생성에 실패했습니다.", "error");
        return;
      }

      showMessage("새 접근 코드가 생성되었습니다.", "success");
      setNewCode("");
      setNewDescription("");
      setShowCreateForm(false);
      await loadAccessCodes();
    } catch (error) {
      console.error("Failed to create access code:", error);
      showMessage("접근 코드 생성 중 오류가 발생했습니다.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCode = async (codeId: string) => {
    if (!editingCode.trim()) {
      showMessage("접근 코드를 입력해주세요.", "error");
      return;
    }

    try {
      setSaving(true);
      const result = await adminUpdateAccessCodeAction(
        codeId,
        editingCode.trim(),
      );

      if (!result.success) {
        showMessage(result.error || "접근 코드 변경에 실패했습니다.", "error");
        return;
      }

      showMessage("접근 코드가 변경되었습니다.", "success");
      setEditingId(null);
      setEditingCode("");
      await loadAccessCodes();
    } catch (error) {
      console.error("Failed to update access code:", error);
      showMessage("접근 코드 변경 중 오류가 발생했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCode = async (codeId: string, code: string) => {
    if (
      !confirm(
        `"${code}" 코드를 삭제하시겠습니까?\n\n이 코드로 가입한 사용자는 영향받지 않습니다.`,
      )
    ) {
      return;
    }

    try {
      const result = await adminDeleteAccessCodeAction(codeId);

      if (!result.success) {
        showMessage(result.error || "접근 코드 삭제에 실패했습니다.", "error");
        return;
      }

      showMessage("접근 코드가 삭제되었습니다.", "success");
      await loadAccessCodes();
    } catch (error) {
      console.error("Failed to delete access code:", error);
      showMessage("접근 코드 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  const handleToggleActive = async (codeId: string, currentStatus: boolean) => {
    try {
      const result = await adminToggleAccessCodeAction(codeId, !currentStatus);

      if (!result.success) {
        showMessage(result.error || "상태 변경에 실패했습니다.", "error");
        return;
      }

      showMessage(
        currentStatus
          ? "접근 코드가 비활성화되었습니다."
          : "접근 코드가 활성화되었습니다.",
        "success",
      );
      await loadAccessCodes();
    } catch (error) {
      console.error("Failed to toggle access code:", error);
      showMessage("상태 변경 중 오류가 발생했습니다.", "error");
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      showMessage("접근 코드가 클립보드에 복사되었습니다.", "success");
    });
  };

  const startEditing = (code: AccessCode) => {
    setEditingId(code.id);
    setEditingCode(code.code);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingCode("");
  };

  if (loading) {
    return (
      <ProtectedAdminRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">접근 코드 정보를 불러오는 중...</p>
          </div>
        </div>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              접근 코드 관리
            </h1>
            <p className="text-gray-600">
              크루원들이 앱에 가입할 때 사용하는 접근 코드를 관리합니다.
            </p>
          </div>

          <div className="space-y-6">
            {/* 새 코드 생성 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Plus className="w-5 h-5 mr-2 text-gray-600" />새 접근
                      코드 생성
                    </CardTitle>
                    <CardDescription>
                      새로운 크루원을 위한 접근 코드를 생성합니다.
                    </CardDescription>
                  </div>
                  {!showCreateForm && (
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />새 코드 생성
                    </Button>
                  )}
                </div>
              </CardHeader>
              {showCreateForm && (
                <CardContent>
                  <form onSubmit={handleCreateCode} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        접근 코드 *
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={newCode}
                          onChange={(e) =>
                            setNewCode(e.target.value.toUpperCase())
                          }
                          placeholder="예: CREW2024"
                          maxLength={20}
                          className="font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewCode(generateRandomCode())}
                          title="랜덤 코드 생성"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설명 (선택)
                      </label>
                      <Input
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="예: 2024년 신규 크루원용"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={creating}>
                        {creating ? "생성 중..." : "생성"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewCode("");
                          setNewDescription("");
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  </form>
                </CardContent>
              )}
            </Card>

            {/* 기존 코드 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2 text-gray-600" />
                  등록된 접근 코드
                </CardTitle>
                <CardDescription>
                  현재 등록된 모든 접근 코드 목록입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accessCodes.length > 0 ? (
                  <div className="space-y-3">
                    {accessCodes.map((code) => (
                      <div
                        key={code.id}
                        className={`p-4 rounded-lg border ${
                          code.is_active
                            ? "bg-white border-gray-200"
                            : "bg-gray-50 border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {editingId === code.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingCode}
                                  onChange={(e) =>
                                    setEditingCode(e.target.value.toUpperCase())
                                  }
                                  className="font-mono max-w-xs"
                                  maxLength={20}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateCode(code.id)}
                                  disabled={saving}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-lg font-semibold">
                                    {code.code}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full ${
                                      code.is_active
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {code.is_active ? "활성" : "비활성"}
                                  </span>
                                </div>
                                {code.description && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {code.description}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  생성일:{" "}
                                  {new Date(
                                    code.created_at,
                                  ).toLocaleDateString()}
                                  {code.expires_at && (
                                    <>
                                      {" "}
                                      · 만료일:{" "}
                                      {new Date(
                                        code.expires_at,
                                      ).toLocaleDateString()}
                                    </>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                          {editingId !== code.id && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(code.code)}
                                title="코드 복사"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(code)}
                                title="코드 수정"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleToggleActive(code.id, code.is_active)
                                }
                                title={code.is_active ? "비활성화" : "활성화"}
                              >
                                {code.is_active ? (
                                  <X className="w-4 h-4 text-orange-500" />
                                ) : (
                                  <Check className="w-4 h-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleDeleteCode(code.id, code.code)
                                }
                                title="삭제"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      등록된 접근 코드가 없습니다.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      새 접근 코드를 생성해주세요.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 안내 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-gray-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-2">접근 코드 사용 안내</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>
                        크루원은 최초 1회 접근 코드를 입력하여 가입합니다.
                      </li>
                      <li>
                        코드를 변경해도 이미 가입한 사용자는 영향받지 않습니다.
                      </li>
                      <li>코드를 비활성화하면 신규 가입이 차단됩니다.</li>
                      <li>여러 코드를 만들어 그룹별로 관리할 수 있습니다.</li>
                    </ul>
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
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
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
