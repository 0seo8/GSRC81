"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Noto_Sans } from "next/font/google";
import { ProtectedAdminRoute } from "@/shared/components/common/protected-admin-route";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { GPXUploadForm } from "@/features/admin/components/GPX-upload-form";
import { DuplicateCourseModal } from "@/features/admin/components/duplicate-course-modal";
import { supabase } from "@/shared/lib/supabase";
import { GPXDataSchema } from "@/core/validation/gpx";
import { UnifiedGPXData } from "@/types/unified";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/core/config/messages";
import { logCourseCreate } from "@/shared/lib/audit-log";
import { useSession } from "next-auth/react";
import {
  checkForDuplicates,
  type CourseForDuplicateCheck,
  type DuplicateCheckResult,
} from "@/shared/lib/utils/gpx-duplicate-checker";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function NewCoursePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [duplicateCheck, setDuplicateCheck] =
    useState<DuplicateCheckResult | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState<{
    formData: FormData;
    gpxData: unknown;
  } | null>(null);

  const handleGPXSubmit = async (
    formData: FormData,
    gpxData: unknown,
    skipDuplicateCheck = false,
  ) => {
    try {
      setSubmitting(true);

      // Zod로 GPX 데이터 검증
      const validatedGPX = GPXDataSchema.parse(gpxData);

      const { startPoint, coordinates, distance, duration, elevationGain } =
        validatedGPX;

      // 중복 검사 (skipDuplicateCheck가 false일 때만)
      if (!skipDuplicateCheck) {
        // 기존 코스 조회
        const { data: existingCourses, error: queryError } = await supabase
          .from("courses")
          .select(
            "id, title, start_latitude, start_longitude, distance_km, avg_time_min, difficulty, gpx_data",
          )
          .eq("is_active", true);

        if (queryError) {
          console.error("Failed to query existing courses:", queryError);
        } else if (existingCourses && existingCourses.length > 0) {
          // 중복 검사 수행
          const newCourseForCheck: CourseForDuplicateCheck = {
            id: "new",
            title: formData.get("title") as string,
            start_latitude: startPoint.lat,
            start_longitude: startPoint.lng,
            distance_km:
              parseFloat(formData.get("distance_km") as string) || distance,
            avg_time_min:
              parseInt(formData.get("avg_time_min") as string) || duration,
            difficulty: formData.get("difficulty") as string,
            gpx_data: {
              points: coordinates,
            },
          };

          const duplicateResult = checkForDuplicates(
            newCourseForCheck,
            existingCourses as CourseForDuplicateCheck[],
          );

          // 중복 발견 시
          if (duplicateResult.proceed === false) {
            // 완전 동일 - 등록 차단
            setDuplicateCheck(duplicateResult);
            setPendingSubmit(null);
            setSubmitting(false);
            return;
          } else if (duplicateResult.proceed === "CONFIRM") {
            // 유사 - 사용자 확인 필요
            setDuplicateCheck(duplicateResult);
            setPendingSubmit({ formData, gpxData });
            setSubmitting(false);
            return;
          }
        }
      }

      // 통계 계산
      const bounds = {
        minLat: Math.min(...coordinates.map((c) => c.lat)),
        maxLat: Math.max(...coordinates.map((c) => c.lat)),
        minLng: Math.min(...coordinates.map((c) => c.lng)),
        maxLng: Math.max(...coordinates.map((c) => c.lng)),
      };

      // vFinal 표준화된 GPX 데이터 구조
      const normalizedGpxData: UnifiedGPXData = {
        version: "1.1" as const,
        points: coordinates,
        bounds,
        stats: {
          totalDistance: distance,
          elevationGain: elevationGain || 0,
          estimatedDuration: duration,
        },
        metadata: {
          startPoint: {
            lat: startPoint.lat,
            lng: startPoint.lng,
          },
          endPoint: {
            lat: coordinates[coordinates.length - 1].lat,
            lng: coordinates[coordinates.length - 1].lng,
          },
        },
      };

      const courseData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        start_latitude: startPoint.lat,
        start_longitude: startPoint.lng,
        distance_km:
          parseFloat(formData.get("distance_km") as string) || distance,
        avg_time_min:
          parseInt(formData.get("avg_time_min") as string) || duration,
        difficulty: formData.get("difficulty") as string,
        category_id: (formData.get("category_id") as string) || null,
        elevation_gain: elevationGain || 0,
        sort_order: 0,
        gpx_data: normalizedGpxData,
        is_active: true,
      };

      const { data, error: courseError } = await supabase
        .from("courses")
        .insert([courseData])
        .select()
        .single();

      if (courseError) {
        console.error("❌ Supabase insert error:", courseError);
        throw courseError;
      }

      // 사진이 있으면 course_photos에 저장
      const photosJson = formData.get("photos") as string;
      if (photosJson) {
        const photos = JSON.parse(photosJson) as string[];
        if (photos.length > 0) {
          const photoInserts = photos.map((url) => ({
            course_id: data.id,
            file_url: url,
            caption: "",
          }));

          const { error: photoError } = await supabase
            .from("course_photos")
            .insert(photoInserts);

          if (photoError) {
            console.error("Failed to save photos:", photoError);
            // 사진 저장 실패는 에러로 처리하지 않음 (코스는 생성됨)
          }
        }
      }

      // 감사 로그 기록
      if (session?.user?.id && session?.user?.name) {
        await logCourseCreate(session.user.id, session.user.name, data.id, {
          title: courseData.title,
          distance_km: courseData.distance_km,
          difficulty: courseData.difficulty,
        });
      }

      toast.success(SUCCESS_MESSAGES.COURSE_CREATED);

      // 생성된 코스의 관리 페이지로 이동
      router.push(`/admin/courses/${data.id}/manage`);
    } catch (error) {
      console.error("Failed to save course from GPX:", error);

      if (error instanceof Error) {
        toast.error(`${ERROR_MESSAGES.COURSE_CREATE_FAILED}: ${error.message}`);
      } else {
        toast.error(ERROR_MESSAGES.COURSE_CREATE_FAILED);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 중복 확인 모달에서 "계속 등록" 클릭 시
  const handleConfirmDuplicate = () => {
    if (pendingSubmit) {
      setDuplicateCheck(null);
      handleGPXSubmit(pendingSubmit.formData, pendingSubmit.gpxData, true);
    }
  };

  // 중복 확인 모달 닫기
  const handleCloseDuplicateModal = () => {
    setDuplicateCheck(null);
    setPendingSubmit(null);
  };

  return (
    <ProtectedAdminRoute>
      <div className={`min-h-screen bg-page-bg ${notoSans.className}`}>
        {/* 상단 네비게이션 */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/admin/courses"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              코스 목록으로
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">
              새 코스 등록
            </h1>
          </div>
        </div>

        {/* 하단 컨텐츠 */}
        <div
          className="flex-1 bg-page-bg pt-14"
          style={{ minHeight: "calc(100vh - 56px)" }}
        >
          <div className="overflow-y-auto h-full">
            <div className="max-w-2xl mx-auto px-5 py-8">
              {submitting ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">코스를 등록하는 중...</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-black mb-6">
                    GPX 파일로 코스 등록
                  </h2>
                  <GPXUploadForm
                    onSubmit={handleGPXSubmit}
                    loading={submitting}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 중복 확인 모달 */}
        {duplicateCheck && (
          <DuplicateCourseModal
            isOpen={true}
            onClose={handleCloseDuplicateModal}
            onConfirm={handleConfirmDuplicate}
            duplicateResult={duplicateCheck}
          />
        )}
      </div>
    </ProtectedAdminRoute>
  );
}
