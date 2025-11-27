import { Course, CoursePoint } from "@/types";

export const DIFFICULTY_MAP = {
  easy: "Easy",
  medium: "Moderate",
  hard: "Hard",
} as const;

export interface TrailMapProps {
  courseId: string;
  className?: string;
}

export interface TrailData {
  course: Course;
  points: CoursePoint[];
  geoJSON: TrailGeoJSON;
  stats: {
    totalDistance: number;
    elevationGain: number;
    estimatedTime: number;
    maxElevation: number;
    minElevation: number;
    elevationLoss: number;
    difficulty: string;
    bounds: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    };
  };
}

export type GpxCoordinate = {
  lat: number;
  lng: number;
  ele?: number | null;
};

export type GpxCoordinates = GpxCoordinate[];

export type TrailGeoJSON = {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: {
      type: "LineString";
      coordinates: number[][];
    };
  }[];
};

export interface KmMarker {
  km: number;
  position: { lat: number; lng: number };
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export type LocationButtonState = "location" | "route";
