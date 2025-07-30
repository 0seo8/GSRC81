// GSRC81 Maps Type Definitions

export interface Course {
  id: string;
  title: string;
  description: string;
  gpx_url?: string;
  gpx_data?: string;
  start_point: GeoPoint;
  finish_point?: GeoPoint;
  route_geometry?: GeoLineString;
  distance_km: number;
  avg_time_min?: number;
  altitude_gain?: number;
  difficulty: "easy" | "medium" | "hard";
  nearest_station?: string;
  cover_image_url?: string;
  landmarks?: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CoursePoint {
  id: string;
  course_id: string;
  seq: number;
  latitude: number;
  longitude: number;
  elevation?: number;
  timestamp?: string;
  point_geometry?: GeoPoint;
  created_at: string;
}

export interface CourseComment {
  id: string;
  course_id: string;
  author_nickname: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

export interface AccessLink {
  id: string;
  access_code: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  updated_at: string;
}

// Geometric Types (PostGIS compatible)
export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface GeoLineString {
  type: "LineString";
  coordinates: [number, number][]; // [[lng, lat], ...]
}

// Map Related Types
export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface CourseCluster {
  id: string;
  coordinates: [number, number];
  courses: Course[];
  count: number;
}

// UI State Types
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface MapState {
  viewState: MapViewState;
  selectedCourse?: Course;
  clusters: CourseCluster[];
  showCourseList: boolean;
}

// Form Types
export interface LoginForm {
  password: string;
}

export interface CommentForm {
  author_nickname: string;
  message: string;
}

export interface CourseForm {
  title: string;
  description: string;
  gpx_file?: File;
  difficulty: Course["difficulty"];
  nearest_station?: string;
  cover_image?: File;
  landmarks?: string[];
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
}

// Animation Types (for mascot)
export interface MascotPosition {
  lng: number;
  lat: number;
  timestamp: number;
}
