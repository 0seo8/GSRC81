export interface UnifiedGPXData {
  version: "1.1";
  points: GPXPoint[];
  bounds: GPXBounds;
  stats: GPXStats;
  metadata?: GPXMetadata;
}

export interface GPXPoint {
  lat: number;
  lng: number;
  ele?: number; // elevation in meters
  dist?: number; // distance from start in km
}

export interface GPXBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface GPXStats {
  totalDistance: number; // km (소수점 3자리)
  elevationGain: number; // meters
  estimatedDuration: number; // minutes
}

export interface GPXMetadata {
  startPoint: {
    lat: number;
    lng: number;
  };
  endPoint?: {
    lat: number;
    lng: number;
  };
  nearestStation?: string;
  gpxUrl?: string;
}

// 새로운 통합 Course 타입
export interface CourseV2 {
  id: string;
  title: string;
  description?: string;
  difficulty: "easy" | "medium" | "hard";
  course_type?: "track" | "trail" | "road"; // 새로운 필드

  // 통합된 GPX 데이터
  gpx_data: UnifiedGPXData;

  // UI 관련
  cover_image_url?: string;
  is_active: boolean;

  // 메타데이터
  created_at: string;
  updated_at?: string;
  created_by?: string;
  approved_at?: string;
  approved_by?: string;
}

// 헬퍼 함수들
export const extractStartPoint = (course: CourseV2): [number, number] => {
  const { lat, lng } = course.gpx_data.metadata?.startPoint ||
    course.gpx_data.points[0] || { lat: 0, lng: 0 };
  return [lat, lng];
};

export const extractEndPoint = (course: CourseV2): [number, number] => {
  const { lat, lng } = course.gpx_data.metadata?.endPoint ||
    course.gpx_data.points[course.gpx_data.points.length - 1] || {
      lat: 0,
      lng: 0,
    };
  return [lat, lng];
};

export const getDistance = (course: CourseV2): number => {
  return course.gpx_data.stats.totalDistance;
};

export const getDuration = (course: CourseV2): string => {
  const minutes = course.gpx_data.stats.estimatedDuration;
  if (!minutes) return "시간 미정";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  }
  return `${mins}분`;
};

export const getElevationGain = (course: CourseV2): number => {
  return course.gpx_data.stats.elevationGain || 0;
};

// 레거시 호환 변환 함수
import type { Course } from "@/types";

export const convertToLegacyCourse = (course: CourseV2): Course => {
  const [startLat, startLng] = extractStartPoint(course);
  const [endLat, endLng] = extractEndPoint(course);

  const legacy: Course = {
    id: course.id,
    title: course.title,
    description: course.description,
    gpx_url: course.gpx_data.metadata?.gpxUrl,
    gpx_coordinates: JSON.stringify(course.gpx_data.points),
    start_latitude: startLat,
    start_longitude: startLng,
    end_latitude: endLat,
    end_longitude: endLng,
    distance_km: course.gpx_data.stats.totalDistance,
    avg_time_min: course.gpx_data.stats.estimatedDuration,
    elevation_gain: course.gpx_data.stats.elevationGain,
    difficulty: course.difficulty,
    nearest_station: course.gpx_data.metadata?.nearestStation,
    cover_image_url: course.cover_image_url,
    is_active: course.is_active,
    created_at: course.created_at,
    updated_at: course.updated_at,
  };

  return legacy;
};

// 난이도별 컬러 (다크 모던 테마)
export const difficultyColors = {
  easy: "#4CAF50", // Green
  medium: "#FFD93D", // Yellow
  hard: "#FF6F3D", // Orange (Signal Orange)
} as const;

// 코스 타입별 아이콘
export const courseTypeIcons = {
  track: "🏃", // 트랙
  trail: "🏔️", // 트레일
  road: "🛣️", // 로드
} as const;
