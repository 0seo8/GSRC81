"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface CoursePhoto {
  id: string;
  course_id: string;
  user_id?: string;
  file_url: string;
  caption?: string;
  created_at: string;
}

interface CourseGalleryProps {
  courseId: string;
  photos?: CoursePhoto[];
  loading?: boolean;
}

export function CourseGallery({
  courseId,
  photos = [],
  loading = false,
}: CourseGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<CoursePhoto | null>(null);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">사진을 불러오는 중...</span>
        </div>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium mb-1 text-gray-500">
            아직 사진이 없습니다
          </p>
          <p className="text-sm text-gray-400 mb-4">
            이 코스의 첫 번째 사진을 공유해주세요!
          </p>
          <Button
            variant="outline"
            className="border-orange-500 text-orange-500 hover:bg-orange-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            사진 업로드
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              코스 갤러리 ({photos.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              사진 추가
            </Button>
          </div>

          {/* 사진 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg"
                onClick={() => setSelectedPhoto(photo)}
              >
                <Image
                  src={photo.file_url}
                  alt={photo.caption || `코스 사진 ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white rounded-full p-2">
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* 캡션 (있는 경우) */}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <p className="text-white text-xs line-clamp-2">
                      {photo.caption}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* PDF에서 보이는 GSRC81 단체 사진 스타일로 예시 추가 */}
          {photos.length === 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                GSRC81 멤버들과 함께한 러닝 순간들을 공유해보세요! 🏃‍♂️🏃‍♀️
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 이미지 모달 */}
      <AnimatePresence>
        {selectedPhoto && (
          <>
            {/* 백드롭 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setSelectedPhoto(null)}
            />

            {/* 모달 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="fixed inset-4 z-50 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-4xl max-h-full w-full">
                {/* 닫기 버튼 */}
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* 이미지 */}
                <div className="relative w-full h-full">
                  <Image
                    src={selectedPhoto.file_url}
                    alt={selectedPhoto.caption || "코스 사진"}
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>

                {/* 캡션 */}
                {selectedPhoto.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 rounded-b-lg">
                    <p className="text-center">{selectedPhoto.caption}</p>
                    <p className="text-xs text-gray-300 text-center mt-1">
                      {new Date(selectedPhoto.created_at).toLocaleDateString(
                        "ko-KR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
