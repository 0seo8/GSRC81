import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 서버 사이드에서만 로그 출력
if (typeof window === "undefined") {
  console.log("Supabase Environment Variables Check:");
  console.log("- URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
  console.log("- ANON_KEY:", supabaseAnonKey ? "✓ Set" : "✗ Missing");
  console.log("- SERVICE_ROLE_KEY:", supabaseServiceRoleKey ? "✓ Set" : "✗ Missing");
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// 클라이언트용 Supabase 클라이언트 (RLS 적용)
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

// 서버 전용 Supabase 클라이언트 (RLS 우회, 관리자 작업용)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : supabase; // 폴백: SERVICE_ROLE_KEY가 없으면 일반 클라이언트 사용

export const TABLES = {
  COURSES: "courses",
  COURSE_CATEGORIES: "course_categories",
  COURSE_COMMENTS: "course_comments",
  ACCESS_LINKS: "access_links",
  ADMIN: "admin",
  APP_SETTINGS: "app_settings",
  PROFILES: "profiles",
} as const;
