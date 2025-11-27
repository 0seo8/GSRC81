import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "gsrc81-auth-token",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database Tables
export const TABLES = {
  COURSES: "courses",
  COURSE_CATEGORIES: "course_categories",
  COURSE_COMMENTS: "course_comments",
  ACCESS_LINKS: "access_links",
  ADMIN: "admin",
  APP_SETTINGS: "app_settings",
  PROFILES: "profiles",
} as const;

// Storage Buckets
export const STORAGE_BUCKETS = {
  GPX_FILES: "gpx-files",
  COURSE_IMAGES: "course-images",
  AVATARS: "avatars",
} as const;
