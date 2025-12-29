"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-base">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            관리자 대시보드로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-lola-950 mb-8">시스템 설정</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>설정 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              시스템 설정 페이지입니다. 필요한 설정 항목을 추가할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
