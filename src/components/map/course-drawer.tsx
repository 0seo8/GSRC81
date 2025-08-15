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
          className="absolute inset-0 bg-white z-30 flex flex-col"
        >
          <CourseCardStack
            courses={courses}
            onClose={onClose}
            onCourseClick={onCourseClick}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}