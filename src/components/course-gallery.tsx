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

  // 빈 상태는 메인 컴포넌트에서 처리

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              GSRC81 Running Crew!
            </h3>
          </div>
          {photos.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              사진 추가
            </Button>
          )}
        </div>

        {/* 사진이 있을 때 */}
        {photos.length > 0 ? (
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
        ) : (
          /* PDF 스타일 GSRC81 단체 사진 섹션 */
          <div className="relative">
            <Image
              src="/images/gsrc81-group-photo.jpg"
              alt="GSRC81 Running Crew"
              width={800}
              height={400}
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                // 이미지 로드 실패 시 대체 컨텐츠 표시
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.classList.remove('hidden');
              }}
            />
            
            {/* 대체 컨텐츠 */}
            <div className="hidden w-full h-48 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg items-center justify-center">
              <div className="text-center text-white">
                <div className="text-2xl font-bold mb-2">GSRC81</div>
                <div className="text-lg">Running Crew!</div>
                <div className="text-sm mt-2 opacity-90">함께 달리며 만들어가는 우리들의 이야기</div>
              </div>
            </div>
            
            {/* 오버레이 텍스트 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-lg">
              <div className="text-white">
                <div className="text-lg font-bold">GSRC81</div>
                <div className="text-sm opacity-90">Running Crew!</div>
              </div>
            </div>
          </div>
        )}
      </div>

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
