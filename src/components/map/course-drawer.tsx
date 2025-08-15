"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CourseCardStack } from "./course-card-stack";
import { type CourseWithComments } from "@/lib/courses-data";

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
  const isOpen = selectedCourses.length > 0 || selectedCourse !== null;
  const courses = selectedCourses.length > 0 
    ? selectedCourses 
    : selectedCourse 
    ? [selectedCourse] 
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-20"
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
            className="absolute inset-0 bg-white z-30 flex flex-col drawer-safe-bottom"
            onClick={onClose} // 드로어 자체도 클릭하면 닫히도록
          >
            <CourseCardStack
              courses={courses}
              onClose={onClose}
              onCourseClick={onCourseClick}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}