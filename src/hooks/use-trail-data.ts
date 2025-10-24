"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getCourseByIdV2 } from "@/lib/courses-data-v2";
import { getCourseComments, getFlightModeComments, CourseComment } from "@/lib/comments";
import { getCoursePhotos, CoursePhoto } from "@/lib/course-photos";
import { convertToLegacyCourse } from "@/types/unified";
import { TrailData, TrailGeoJSON } from "@/components/map/trail-map/types";

interface UseTrailDataReturn {
  trailData: TrailData | null;
  comments: CourseComment[];
  flightComments: CourseComment[];
  coursePhotos: CoursePhoto[];
  loading: boolean;
  error: string | null;
  refreshComments: () => Promise<void>;
  refreshPhotos: () => Promise<void>;
}

export function useTrailData(courseId: string): UseTrailDataReturn {
  const [trailData, setTrailData] = useState<TrailData | null>(null);
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [flightComments, setFlightComments] = useState<CourseComment[]>([]);
  const [coursePhotos, setCoursePhotos] = useState<CoursePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 코스 데이터를 TrailData로 변환하는 함수 (메모이제이션)
  const convertCourseToTrailData = useCallback(async (courseId: string): Promise<TrailData> => {
    const courseV2 = await getCourseByIdV2(courseId);

    if (!courseV2) {
      throw new Error("코스를 찾을 수 없습니다.");
    }

    if (!courseV2.gpx_data?.points || courseV2.gpx_data.points.length === 0) {
      throw new Error("코스 경로 데이터가 없습니다.");
    }

    // GeoJSON 생성 (한 번만)
    const geoJSON: TrailGeoJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: courseV2.gpx_data.points.map((p) => [
              p.lng,
              p.lat,
              p.ele || 0,
            ]),
          },
        },
      ],
    };

    // Stats 생성
    const stats = {
      totalDistance: courseV2.gpx_data.stats.totalDistance,
      elevationGain: courseV2.gpx_data.stats.elevationGain,
      estimatedTime: courseV2.gpx_data.stats.estimatedDuration,
      maxElevation: 0,
      minElevation: 0,
      elevationLoss: 0,
      difficulty: courseV2.difficulty,
      bounds: courseV2.gpx_data.bounds,
    };

    return {
      course: convertToLegacyCourse(courseV2),
      points: [],
      geoJSON,
      stats,
    };
  }, []);

  // 댓글 로드
  const loadComments = useCallback(async () => {
    if (!courseId) return;

    try {
      const [allComments, flightOnlyComments] = await Promise.all([
        getCourseComments(courseId),
        getFlightModeComments(courseId),
      ]);

      setComments(allComments);
      setFlightComments(flightOnlyComments);
    } catch (error) {
      console.error("댓글 로드 실패:", error);
    }
  }, [courseId]);

  // 사진 로드
  const loadCoursePhotos = useCallback(async () => {
    if (!courseId) return;

    try {
      const photos = await getCoursePhotos(courseId);
      setCoursePhotos(photos);
    } catch (error) {
      console.error("코스 사진 로드 실패:", error);
    }
  }, [courseId]);

  // 전체 데이터 로드
  useEffect(() => {
    let isMounted = true;

    const loadAllData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        setError(null);

        // 병렬로 모든 데이터 로드
        const [trailDataResult, commentsResult, photosResult] = await Promise.allSettled([
          convertCourseToTrailData(courseId),
          Promise.all([getCourseComments(courseId), getFlightModeComments(courseId)]),
          getCoursePhotos(courseId),
        ]);

        if (!isMounted) return;

        // TrailData 처리
        if (trailDataResult.status === 'fulfilled') {
          setTrailData(trailDataResult.value);
        } else {
          throw trailDataResult.reason;
        }

        // Comments 처리
        if (commentsResult.status === 'fulfilled') {
          const [allComments, flightOnlyComments] = commentsResult.value;
          setComments(allComments);
          setFlightComments(flightOnlyComments);
        }

        // Photos 처리
        if (photosResult.status === 'fulfilled') {
          setCoursePhotos(photosResult.value);
        }

      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load trail data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "트레일 데이터를 불러올 수 없습니다.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAllData();

    return () => {
      isMounted = false;
    };
  }, [courseId, convertCourseToTrailData]);

  // 뷰 상태 계산 (메모이제이션)
  const initialViewState = useMemo(() => {
    if (!trailData?.stats.bounds) return null;

    const bounds = trailData.stats.bounds;
    const centerLon = (bounds.minLng + bounds.maxLng) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;

    // 경로 범위에 맞는 줌 레벨 계산
    const latRange = bounds.maxLat - bounds.minLat;
    const lonRange = bounds.maxLng - bounds.minLng;
    const maxRange = Math.max(latRange, lonRange);

    let initialZoom = 10;
    if (maxRange < 0.01) initialZoom = 14;
    else if (maxRange < 0.05) initialZoom = 12;
    else if (maxRange < 0.1) initialZoom = 11;

    return {
      longitude: centerLon,
      latitude: centerLat,
      zoom: initialZoom,
    };
  }, [trailData?.stats.bounds]);

  return {
    trailData,
    comments,
    flightComments,
    coursePhotos,
    loading,
    error,
    refreshComments: loadComments,
    refreshPhotos: loadCoursePhotos,
    initialViewState,
  } as UseTrailDataReturn & { initialViewState: any };
}