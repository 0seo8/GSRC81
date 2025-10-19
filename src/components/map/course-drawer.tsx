"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CourseCardStack } from "./course-card-stack";
import { type CourseWithComments } from "@/lib/courses-data";
import { useState, useMemo } from "react";

interface CourseDrawerProps {
  selectedCourses: CourseWithComments[];
  selectedCourse: CourseWithComments | null;
  onClose: () => void;
  onCourseClick: (courseId: string) => void;
}

export function CourseDrawer({
  selectedCourses,
  selectedCourse,
  onClose,
  onCourseClick,
}: CourseDrawerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  const isOpen = selectedCourses.length > 0 || selectedCourse !== null;
  const courses =
    selectedCourses.length > 0
      ? selectedCourses
      : selectedCourse
        ? [selectedCourse]
        : [];

  // 카테고리별로 코스들을 그룹화
  const categorizedCourses = useMemo(() => {
    const categories = [
      { key: "jingwan", name: "진관동러닝" },
      { key: "track", name: "트랙러닝" },
      { key: "trail", name: "트레일러닝" },
      { key: "road", name: "로드러닝" },
    ];

    return categories
      .map((category) => ({
        ...category,
        courses: courses.filter(
          (course) => (course.category_key || "jingwan") === category.key
        ),
      }))
      .filter((category) => category.courses.length > 0); // 코스가 있는 카테고리만
  }, [courses]);

  const currentCategory = categorizedCourses[currentCategoryIndex];

  // 카테고리 슬라이드 핸들러
  const handleSwipeLeft = () => {
    if (currentCategoryIndex < categorizedCourses.length - 1) {
      setCurrentCategoryIndex((prev) => prev + 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex((prev) => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-20 z-20"
            onClick={onClose}
          />

          {/* 드로어 */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(_, info) => {
              setIsDragging(false);
              // 드래그 속도나 거리가 충분하면 드로어를 닫음
              if (info.velocity.y > 500 || info.offset.y > 100) {
                onClose();
              }
            }}
            className="absolute inset-0 bg-white z-30 flex flex-col drawer-safe-bottom cursor-grab active:cursor-grabbing"
            onClick={(e) => {
              // 드래그 중이 아닐 때만 클릭으로 닫기
              if (!isDragging) {
                onClose();
              }
            }}
          >
            {/* 카테고리 헤더 */}
            {categorizedCourses.length > 1 && currentCategory && (
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSwipeRight}
                    disabled={currentCategoryIndex === 0}
                    className="p-2 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <div className="text-center">
                    <h3 className="text-lg font-bold">
                      {currentCategory.name}
                    </h3>
                    <div className="flex space-x-1 justify-center mt-2">
                      {categorizedCourses.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentCategoryIndex
                              ? "bg-gray-600"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleSwipeLeft}
                    disabled={
                      currentCategoryIndex === categorizedCourses.length - 1
                    }
                    className="p-2 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              </div>
            )}

            <CourseCardStack
              courses={currentCategory?.courses || courses}
              onClose={onClose}
              onCourseClick={onCourseClick}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
