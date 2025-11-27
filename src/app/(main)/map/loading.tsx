import { MapSkeleton } from "@/features/map/components/map-skeleton";

/**
 * Map 페이지 로딩 UI
 * Next.js가 자동으로 Suspense 경계로 감싸서 사용
 */
export default function Loading() {
  return <MapSkeleton />;
}
