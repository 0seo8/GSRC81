"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface Photo {
  id: string;
  file_url: string;
  caption?: string | null;
}

interface PhotoGalleryProps {
  photos: Photo[];
  isAdmin?: boolean;
  onDeletePhoto?: (photoId: string) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  isAdmin = false,
  onDeletePhoto
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 스크롤 이벤트로 현재 인덱스 추적
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth;
      const index = Math.round(scrollLeft / itemWidth);
      setCurrentIndex(index);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // 인디케이터 클릭 시 해당 사진으로 이동
  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const itemWidth = container.offsetWidth;
    container.scrollTo({
      left: itemWidth * index,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* 스와이프 가능한 갤러리 */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="flex-shrink-0 w-full snap-center"
          >
            <div className="bg-white overflow-hidden rounded-lg relative group">
              <Image
                src={photo.file_url}
                alt={photo.caption || "코스 사진"}
                width={400}
                height={400}
                className="w-full aspect-square object-cover"
                loading={index < 3 ? "eager" : "lazy"}
                priority={index < 3}
              />
              {/* 어드민 모드일 때 삭제 버튼 표시 */}
              {isAdmin && onDeletePhoto && (
                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeletePhoto(photo.id)}
                    className="bg-white hover:bg-red-50 text-red-600 shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {photo.caption && (
                <div className="p-3">
                  <p className="text-sm text-gray-600">{photo.caption}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 페이지 인디케이터 (점) */}
      {photos.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-black w-6"
                  : "bg-gray-300"
              }`}
              aria-label={`사진 ${index + 1}로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  );
};