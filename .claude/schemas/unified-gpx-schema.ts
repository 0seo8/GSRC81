/**
 * UnifiedGPXData v1.1 Schema
 * TypeScript types and Zod validation schemas for GSRC81 Maps
 * Based on PRD 2025 Q4 specification
 */

import { z } from 'zod';

// ============================================
// BASE SCHEMAS
// ============================================

/**
 * Comment schema for waypoint comments
 */
const CommentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  username: z.string().min(1).max(100),
  content: z.string().min(1).max(500),
  createdAt: z.string().datetime(),
  isAdmin: z.boolean().optional().default(false),
});

/**
 * GPX Point schema - represents a single point on the trail
 */
const GPXPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  ele: z.number().optional(),
  dist: z.number().min(0).optional(), // Cumulative distance in km
  comments: z.array(CommentSchema).optional(),
});

/**
 * Bounds schema for map viewport
 */
const BoundsSchema = z.object({
  minLat: z.number().min(-90).max(90),
  maxLat: z.number().min(-90).max(90),
  minLng: z.number().min(-180).max(180),
  maxLng: z.number().min(-180).max(180),
}).refine(
  (bounds) => bounds.minLat <= bounds.maxLat && bounds.minLng <= bounds.maxLng,
  { message: "Invalid bounds: min values must be less than max values" }
);

/**
 * Statistics schema for trail metrics
 */
const StatsSchema = z.object({
  totalDistance: z.number().min(0), // in km
  elevationGain: z.number().min(0), // in meters
  elevationLoss: z.number().min(0), // in meters
  estimatedDuration: z.number().min(0), // in minutes
  maxElevation: z.number().optional(),
  minElevation: z.number().optional(),
  avgPace: z.number().optional(), // min/km
});

/**
 * Metadata schema for tracking data origin
 */
const MetadataSchema = z.object({
  originalFileName: z.string().optional(),
  uploadedAt: z.string().datetime().optional(),
  processedAt: z.string().datetime().optional(),
  uploadedBy: z.string().uuid().optional(),
  source: z.enum(['gpx', 'manual', 'strava', 'garmin']).optional().default('gpx'),
});

// ============================================
// MAIN UNIFIED GPX DATA SCHEMA v1.1
// ============================================

/**
 * Main UnifiedGPXData schema v1.1
 */
export const UnifiedGPXDataSchema = z.object({
  version: z.literal('1.1'),
  points: z.array(GPXPointSchema).min(2, "Trail must have at least 2 points"),
  bounds: BoundsSchema,
  stats: StatsSchema,
  metadata: MetadataSchema.optional(),
}).refine(
  (data) => {
    // Validate that bounds actually contain all points
    const allLats = data.points.map(p => p.lat);
    const allLngs = data.points.map(p => p.lng);
    const actualMinLat = Math.min(...allLats);
    const actualMaxLat = Math.max(...allLats);
    const actualMinLng = Math.min(...allLngs);
    const actualMaxLng = Math.max(...allLngs);
    
    return (
      Math.abs(data.bounds.minLat - actualMinLat) < 0.000001 &&
      Math.abs(data.bounds.maxLat - actualMaxLat) < 0.000001 &&
      Math.abs(data.bounds.minLng - actualMinLng) < 0.000001 &&
      Math.abs(data.bounds.maxLng - actualMaxLng) < 0.000001
    );
  },
  { message: "Bounds do not match the actual points extent" }
);

// ============================================
// COURSE SCHEMAS
// ============================================

/**
 * Difficulty enum
 */
export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

/**
 * Course schema - main course entity
 */
export const CourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  difficulty: DifficultySchema,
  gpx_data: UnifiedGPXDataSchema,
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  // Generated fields
  distance_km: z.number().optional(),
  elevation_gain: z.number().optional(),
  duration_min: z.number().optional(),
});

/**
 * Course comment schema for waypoint comments
 */
export const CourseCommentSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  point_index: z.number().int().min(0),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  user_id: z.string().uuid().optional().nullable(),
  username: z.string().min(1).max(100),
  content: z.string().min(1).max(500),
  is_admin_comment: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * User schema
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  provider: z.enum(['kakao', 'google', 'apple', 'system']).default('kakao'),
  provider_id: z.string().optional().nullable(),
  username: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  profile_image: z.string().url().optional().nullable(),
  is_admin: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ============================================
// TYPE EXPORTS
// ============================================

// Export TypeScript types inferred from Zod schemas
export type Comment = z.infer<typeof CommentSchema>;
export type GPXPoint = z.infer<typeof GPXPointSchema>;
export type Bounds = z.infer<typeof BoundsSchema>;
export type Stats = z.infer<typeof StatsSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type UnifiedGPXData = z.infer<typeof UnifiedGPXDataSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type Course = z.infer<typeof CourseSchema>;
export type CourseComment = z.infer<typeof CourseCommentSchema>;
export type User = z.infer<typeof UserSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate and parse GPX data
 */
export function validateGPXData(data: unknown): UnifiedGPXData {
  return UnifiedGPXDataSchema.parse(data);
}

/**
 * Safe parse GPX data (returns result object)
 */
export function safeValidateGPXData(data: unknown) {
  return UnifiedGPXDataSchema.safeParse(data);
}

/**
 * Calculate bounds from points array
 */
export function calculateBounds(points: GPXPoint[]): Bounds {
  if (points.length === 0) {
    throw new Error("Cannot calculate bounds from empty points array");
  }
  
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(p1: GPXPoint, p2: GPXPoint): number {
  const R = 6371; // Earth's radius in km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate statistics from points array
 */
export function calculateStats(points: GPXPoint[]): Stats {
  if (points.length < 2) {
    return {
      totalDistance: 0,
      elevationGain: 0,
      elevationLoss: 0,
      estimatedDuration: 0,
    };
  }
  
  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  const elevations: number[] = [];
  
  for (let i = 1; i < points.length; i++) {
    // Distance
    totalDistance += calculateDistance(points[i-1], points[i]);
    
    // Elevation
    if (points[i].ele !== undefined && points[i-1].ele !== undefined) {
      const elevDiff = points[i].ele! - points[i-1].ele!;
      if (elevDiff > 0) {
        elevationGain += elevDiff;
      } else {
        elevationLoss += Math.abs(elevDiff);
      }
      elevations.push(points[i].ele!);
    }
  }
  
  // Estimated duration (assuming 5km/h average pace for running)
  const estimatedDuration = Math.round((totalDistance / 5) * 60);
  
  return {
    totalDistance: Math.round(totalDistance * 1000) / 1000, // Round to 3 decimals
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    estimatedDuration,
    maxElevation: elevations.length > 0 ? Math.max(...elevations) : undefined,
    minElevation: elevations.length > 0 ? Math.min(...elevations) : undefined,
    avgPace: totalDistance > 0 ? estimatedDuration / totalDistance : undefined,
  };
}

/**
 * Enrich points with cumulative distance
 */
export function enrichPointsWithDistance(points: GPXPoint[]): GPXPoint[] {
  if (points.length === 0) return [];
  
  const enriched = [...points];
  enriched[0].dist = 0;
  
  for (let i = 1; i < enriched.length; i++) {
    const distance = calculateDistance(enriched[i-1], enriched[i]);
    enriched[i].dist = (enriched[i-1].dist || 0) + distance;
  }
  
  return enriched;
}

/**
 * Create UnifiedGPXData from raw points
 */
export function createUnifiedGPXData(
  points: GPXPoint[], 
  metadata?: Partial<Metadata>
): UnifiedGPXData {
  const enrichedPoints = enrichPointsWithDistance(points);
  const bounds = calculateBounds(enrichedPoints);
  const stats = calculateStats(enrichedPoints);
  
  return {
    version: '1.1',
    points: enrichedPoints,
    bounds,
    stats,
    metadata: metadata ? {
      ...metadata,
      processedAt: new Date().toISOString(),
    } as Metadata : undefined,
  };
}

// ============================================
// MIGRATION HELPERS
// ============================================

/**
 * Migrate from old format to UnifiedGPXData v1.1
 */
export function migrateFromOldFormat(oldData: any): UnifiedGPXData {
  // Handle old gpx_coordinates format
  if (typeof oldData === 'string') {
    try {
      oldData = JSON.parse(oldData);
    } catch {
      throw new Error("Invalid JSON string for GPX data");
    }
  }
  
  // Convert old point format
  let points: GPXPoint[] = [];
  
  if (Array.isArray(oldData)) {
    // Array of points
    points = oldData.map((p: any) => ({
      lat: p.lat || p.latitude,
      lng: p.lng || p.lon || p.longitude,
      ele: p.ele || p.elevation || p.altitude,
    }));
  } else if (oldData.points) {
    // Already has points array
    points = oldData.points.map((p: any) => ({
      lat: p.lat || p.latitude,
      lng: p.lng || p.lon || p.longitude,
      ele: p.ele || p.elevation || p.altitude,
    }));
  } else if (oldData.coordinates) {
    // GeoJSON format
    points = oldData.coordinates.map((c: number[]) => ({
      lng: c[0],
      lat: c[1],
      ele: c[2],
    }));
  }
  
  if (points.length < 2) {
    throw new Error("Insufficient points for migration");
  }
  
  return createUnifiedGPXData(points, {
    originalFileName: oldData.filename || oldData.name,
    uploadedAt: oldData.created_at || oldData.uploadedAt,
  });
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  schemas: {
    UnifiedGPXData: UnifiedGPXDataSchema,
    Course: CourseSchema,
    CourseComment: CourseCommentSchema,
    User: UserSchema,
  },
  validate: {
    gpxData: validateGPXData,
    safeGpxData: safeValidateGPXData,
  },
  utils: {
    calculateBounds,
    calculateDistance,
    calculateStats,
    enrichPointsWithDistance,
    createUnifiedGPXData,
    migrateFromOldFormat,
  },
};