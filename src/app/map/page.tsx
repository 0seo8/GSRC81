import { Suspense } from "react";
import { CoursesProvider } from "@/components/map/courses-provider";
import { MapSkeleton } from "@/components/map/map-skeleton";
import { MapError } from "@/components/map/map-error";
import { ErrorBoundary } from "@/components/error-boundary";

export default function MapPage() {
  return (
    <ErrorBoundary fallback={<MapError />}>
      <Suspense fallback={<MapSkeleton />}>
        <CoursesProvider />
      </Suspense>
    </ErrorBoundary>
  );
}
