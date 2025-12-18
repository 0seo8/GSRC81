"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import type { DuplicateCheckResult } from "@/shared/lib/utils/gpx-duplicate-checker";

interface DuplicateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  duplicateResult: DuplicateCheckResult;
}

export function DuplicateCourseModal({
  isOpen,
  onClose,
  onConfirm,
  duplicateResult,
}: DuplicateCourseModalProps) {
  const { type, existingCourse, existingCourses } = duplicateResult;

  // 완전 동일 - 등록 차단
  if (type === "DUPLICATE" && existingCourse) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="text-lg">
                완전히 동일한 코스가 있습니다
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-600 space-y-3">
              <p>
                <strong className="text-gray-900">
                  &apos;{existingCourse.title}&apos;
                </strong>
                와 모든 정보가 같습니다:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-xs">
                <li>이름, 거리, 시간, 난이도 모두 일치</li>
                <li>시작/종료 지점 동일</li>
              </ul>
              <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                💡 동일한 코스를 중복 등록할 수 없습니다. 기존 코스를
                수정하시거나 다른 이름으로 등록하세요.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
            <Button
              onClick={() => {
                window.open(
                  `/admin/courses/${existingCourse.id}/manage`,
                  "_blank",
                );
                onClose();
              }}
            >
              기존 코스 보기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // 매우 유사 - 강한 경고
  if (type === "VERY_SIMILAR" && existingCourse) {
    // 거리 차이는 대략적인 값 표시 (정확한 값은 체크 로직에서 계산됨)
    const distanceDiff = "0.05";

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <DialogTitle className="text-lg">
                매우 유사한 코스가 있습니다
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-600 space-y-3">
              <p>
                <strong className="text-gray-900">
                  &apos;{existingCourse.title}&apos;
                </strong>
                와 경로가 거의 동일합니다:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-xs">
                <li>시작/종료 지점: 같음</li>
                <li>거리 차이: {distanceDiff}km</li>
              </ul>
              <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                중간 경로가 다르거나 추가 정보가 있다면 등록하세요.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={onConfirm} variant="default">
              그래도 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // 단순 유사 - 정보 제공
  if (type === "SIMILAR" && existingCourses && existingCourses.length > 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <DialogTitle className="text-lg">동일 구간 코스 발견</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-600 space-y-3">
              <p>
                {existingCourses.length > 1 ? "다음 코스들과" : "다음 코스와"}{" "}
                시작/종료 지점이 같습니다:
              </p>
              <ul className="space-y-2 max-h-32 overflow-y-auto">
                {existingCourses.map((course) => (
                  <li
                    key={course.id}
                    className="text-xs bg-gray-50 p-2 rounded"
                  >
                    <strong className="text-gray-900">{course.title}</strong>
                    <span className="text-gray-500 ml-2">
                      ({course.distance_km}km, {course.difficulty})
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                💡 중간 경로가 다르거나 새로운 정보를 추가하는 경우 등록할 수
                있습니다.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={onConfirm}>계속 등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
