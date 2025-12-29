"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Users,
  Shield,
  ShieldOff,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  kakao_user_id: string;
  kakao_nickname: string;
  kakao_profile_url: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { data: session, update: updateSession } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [filter, setFilter] = useState<"all" | "admin" | "user">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    user: User | null;
    action: "grant" | "revoke" | "delete" | null;
  }>({
    isOpen: false,
    user: null,
    action: null,
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (filter !== "all") {
        params.append("filter", filter);
      }

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load users");
      }

      // 디버깅: API 응답 확인
      console.log("👥 [Admin Users] API 응답:", result.data);
      console.log("🖼️ [Admin Users] 첫 번째 사용자 프로필:", {
        nickname: result.data[0]?.kakao_nickname,
        profileUrl: result.data[0]?.kakao_profile_url,
      });

      setUsers(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("사용자 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filter, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleToggleAdmin = async (user: User, action: "grant" | "revoke") => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update admin status");
      }

      toast.success(result.message);

      // 사용자 목록에서 해당 사용자의 is_admin 상태를 즉시 업데이트
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === user.id ? { ...u, is_admin: action === "grant" } : u,
        ),
      );

      setConfirmDialog({ isOpen: false, user: null, action: null });

      // 변경된 사용자가 현재 로그인한 사용자인 경우 세션 갱신
      if (session?.user?.id === user.kakao_user_id) {
        await updateSession();
        toast.info("세션이 업데이트되었습니다. 페이지를 새로고침해주세요.");
      }
    } catch (error: unknown) {
      console.error("Failed to toggle admin:", error);
      const message =
        error instanceof Error
          ? error.message
          : "관리자 권한 변경에 실패했습니다";
      toast.error(message);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user");
      }

      toast.success(result.message);

      // 사용자 목록에서 해당 사용자 제거
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));

      setConfirmDialog({ isOpen: false, user: null, action: null });

      // 페이지네이션 정보 업데이트
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
      }));
    } catch (error: unknown) {
      console.error("Failed to delete user:", error);
      const message =
        error instanceof Error ? error.message : "사용자 삭제에 실패했습니다";
      toast.error(message);
    }
  };

  const openConfirmDialog = (
    user: User,
    action: "grant" | "revoke" | "delete",
  ) => {
    setConfirmDialog({ isOpen: true, user, action });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, user: null, action: null });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            관리자 대시보드로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-gray-600 mt-2">
            사용자 목록을 확인하고 관리자 권한을 부여할 수 있습니다
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="닉네임으로 검색..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-2" />
                    검색
                  </Button>
                </div>
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => {
                    setFilter("all");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  전체
                </Button>
                <Button
                  variant={filter === "admin" ? "default" : "outline"}
                  onClick={() => {
                    setFilter("admin");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  관리자만
                </Button>
                <Button
                  variant={filter === "user" ? "default" : "outline"}
                  onClick={() => {
                    setFilter("user");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  일반 사용자
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>
              사용자 목록
              {!loading && (
                <span className="text-gray-500 text-base font-normal ml-2">
                  (총 {pagination.total}명)
                </span>
              )}
            </CardTitle>
            <CardDescription>
              관리자 권한을 부여하거나 해제할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : users.length > 0 ? (
              <>
                <div className="space-y-3">
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      currentUserId={session?.user?.id}
                      onToggleAdmin={openConfirmDialog}
                      onDeleteUser={openConfirmDialog}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">사용자가 없습니다</p>
                {search && (
                  <p className="text-sm text-gray-500 mt-1">
                    다른 검색어로 시도해보세요
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && confirmDialog.user && confirmDialog.action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {confirmDialog.action === "grant"
                ? "관리자 권한 부여"
                : confirmDialog.action === "revoke"
                  ? "관리자 권한 해제"
                  : "사용자 삭제"}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmDialog.action === "delete" ? (
                <>
                  <strong>{confirmDialog.user.kakao_nickname}</strong>님의
                  계정을 삭제하시겠습니까?
                  <br />
                  <span className="text-red-600 text-sm font-medium">
                    ⚠️ 이 작업은 되돌릴 수 없습니다.
                  </span>
                </>
              ) : (
                <>
                  <strong>{confirmDialog.user.kakao_nickname}</strong>님을{" "}
                  {confirmDialog.action === "grant"
                    ? "관리자로 지정"
                    : "일반 사용자로 변경"}
                  하시겠습니까?
                </>
              )}
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeConfirmDialog}>
                취소
              </Button>
              <Button
                variant={
                  confirmDialog.action === "delete" ? "destructive" : "default"
                }
                onClick={() => {
                  if (confirmDialog.action === "delete") {
                    handleDeleteUser(confirmDialog.user!);
                  } else {
                    handleToggleAdmin(
                      confirmDialog.user!,
                      confirmDialog.action as "grant" | "revoke",
                    );
                  }
                }}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// User Row Component
interface UserRowProps {
  user: User;
  currentUserId?: string;
  onToggleAdmin: (user: User, action: "grant" | "revoke") => void;
  onDeleteUser: (user: User, action: "delete") => void;
}

function UserRow({
  user,
  currentUserId,
  onToggleAdmin,
  onDeleteUser,
}: UserRowProps) {
  const [imageError, setImageError] = React.useState(false);
  const isCurrentUser = currentUserId === user.kakao_user_id;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {/* Profile Image */}
        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          {user.kakao_profile_url && !imageError ? (
            <Image
              src={user.kakao_profile_url}
              alt={user.kakao_nickname}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
              onError={() => {
                console.error("이미지 로드 실패:", user.kakao_profile_url);
                setImageError(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Users className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">
              {user.kakao_nickname}
            </p>
            {user.is_admin && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Shield className="w-3 h-3 mr-1" />
                관리자
              </span>
            )}
            {!user.is_active && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                비활성
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            가입일: {new Date(user.created_at).toLocaleDateString("ko-KR")}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="ml-4 flex gap-2">
        {user.is_admin ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleAdmin(user, "revoke")}
            className="text-gray-600"
          >
            <ShieldOff className="w-4 h-4 mr-2" />
            관리자 해제
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => onToggleAdmin(user, "grant")}
          >
            <Shield className="w-4 h-4 mr-2" />
            관리자 지정
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDeleteUser(user, "delete")}
          disabled={isCurrentUser}
          title={
            isCurrentUser ? "자기 자신을 삭제할 수 없습니다" : "사용자 삭제"
          }
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
