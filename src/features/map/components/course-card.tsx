import { motion } from "framer-motion";
import { CourseForMap } from "@/lib/supabase/repositories/courseRepository";
import {
  calculateCardLayout,
  calculateCardShadow,
  getDifficultyText,
} from "@/shared/lib/utils/card-layout";

interface CourseCardProps {
  course: CourseForMap;
  index: number;
  totalCourses: number;
  cardColor: string;
  isDragging: boolean;
  onCourseClick: (courseId: string) => void;
  isExpanded?: boolean;
}

export function CourseCard({
  course,
  index,
  totalCourses,
  cardColor,
  isDragging,
  onCourseClick,
  isExpanded = false,
}: CourseCardProps) {
  const layout = calculateCardLayout(index, totalCourses);
  const shadow = calculateCardShadow();

  // 카드 타입 판별
  const isFrontCard =
    (totalCourses === 1 && index === 0) ||
    (totalCourses === 2 && index === 0) ||
    (totalCourses >= 3 && index === 1);
  const isHiddenCard = totalCourses >= 3 && index === 0;
  const isBackCardIn2 = totalCourses === 2 && index === 1;
  const isBackCardIn3Plus = totalCourses >= 3 && index >= 2;

  // 카드 컨테이너 스타일 계산 - 60vh/90vh 모두 동일한 로직 사용
  // 높이 + 겹침(pb) 지정, 내부 콘텐츠는 justify-between으로 상하 배치
  const getCardContainerClass = () => {
    if (isFrontCard) {
      // 1개/2개 맨 앞: 130px
      // 3개+ index=1: 180px, 50px 겹침
      if (totalCourses >= 3) {
        return "h-[11.25rem] pt-[1.875rem] pb-[5rem]"; // 180px, pt=30px, pb=80px(50px겹침+30px패딩)
      }
      return "h-[8.125rem] py-[1.875rem]"; // 130px, 상하 30px 패딩
    }
    if (isHiddenCard) {
      // 3개+ index=0: 12px만 보임 (기본 스타일)
      return "h-[8.125rem] py-5";
    }
    if (isBackCardIn2) {
      // 2개 index=1: 180px, 겹침 50px → 노출 130px
      // 3개+ 카드와 완전 동일: 상단 30px, 콘텐츠 70px, 하단 30px
      return "h-[11.25rem] pt-[1.875rem] pb-[5rem]"; // pt=30px, pb=80px(50px겹침+30px패딩)
    }
    if (isBackCardIn3Plus) {
      // 3개+ index=2+: 180px, 겹침 50px → 노출 130px
      // 상하 패딩 30px, 콘텐츠 70px
      return "h-[11.25rem] pt-[1.875rem] pb-[5rem]"; // pt=30px, pb=80px(50px겹침+30px패딩)
    }
    return "py-5"; // 기본값
  };

  // 카드 위치 계산 - 60vh/90vh 모두 동일한 로직 사용
  const getBottomPosition = () => {
    return layout.bottom;
  };

  return (
    <motion.div
      key={course.id}
      layoutId={`course-card-${course.id}`}
      layout
      initial={{
        opacity: 0,
        y: 40,
        scale: 0.95,
        filter: "blur(0.25rem)",
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0)",
      }}
      whileHover={{
        scale: index === 0 ? 1.02 : 1, // 맨 앞 카드만 호버 효과
        y: index === 0 ? -4 : 0,
        transition: {
          duration: 0.2,
          ease: "easeOut",
        },
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 },
      }}
      transition={{
        layout: {
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1],
        },
        opacity: {
          duration: 0.5,
          delay: index * 0.08, // Stagger effect
          ease: [0.25, 0.1, 0.25, 1],
        },
        y: {
          duration: 0.6,
          delay: index * 0.08,
          ease: [0.25, 0.1, 0.25, 1],
        },
        scale: {
          duration: 0.5,
          delay: index * 0.08,
          ease: [0.25, 0.1, 0.25, 1],
        },
        filter: {
          duration: 0.6,
          delay: index * 0.08,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }}
      className={`absolute left-0 right-0 px-[2.5625rem] cursor-pointer ${getCardContainerClass()}`}
      style={{
        backgroundColor: cardColor,
        borderRadius: layout.borderRadius,
        zIndex: layout.zIndex,
        boxShadow: shadow,
        bottom: getBottomPosition(),
        willChange: "transform, opacity, filter",
        backfaceVisibility: "hidden",
        transform: "translate3d(0, 0, 0)",
      }}
      onClick={(e) => {
        // 스크롤 중이 아닐 때만 클릭 이벤트 처리
        if (isDragging) {
          e.preventDefault();
          return;
        }
        onCourseClick(course.id);
      }}
      onTouchStart={(e) => {
        // 터치 시작 시 스크롤을 방해하지 않도록
        e.stopPropagation();
      }}
    >
      <div className="flex justify-between items-start w-full h-full">
        {/* 좌측: Title(상단) + 카테고리/난이도(하단) */}
        <div className="flex-1 flex flex-col justify-between h-full">
          <h3 className="font-bold text-black text-lg leading-tight">
            {course.title}
          </h3>
          <div>
            <p className="font-medium text-black text-xs">
              {course.course_categories?.name + "러닝 코스"}
            </p>
            <p className="font-medium text-black text-xs">
              {getDifficultyText(course.difficulty || "medium")}
            </p>
          </div>
        </div>
        {/* 우측: km (수직 중앙) */}
        <div className="text-right flex flex-col items-end justify-center h-full">
          <div className="flex items-baseline">
            <span className="text-distance text-black">
              {Math.round(course.distance_km)}
            </span>
            <span className="text-lg text-black ml-1">km</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
