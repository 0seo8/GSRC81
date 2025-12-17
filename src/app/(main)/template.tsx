"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * 페이지 전환 애니메이션 템플릿
 *
 * template.tsx는 페이지 전환 시마다 새 인스턴스를 생성하여
 * 자연스러운 fade 애니메이션을 제공합니다.
 *
 * - map → course detail: 부드러운 fade
 * - course detail → map: 부드러운 fade
 * - login → map: 부드러운 fade
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
