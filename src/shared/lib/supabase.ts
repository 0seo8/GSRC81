import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 서버 사이드에서만 로그 출력
if (typeof window === "undefined") {
  console.log("Supabase Environment Variables Check:");
  console.log("- URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
  console.log("- ANON_KEY:", supabaseAnonKey ? "✓ Set" : "✗ Missing");
  console.log(
    "- PUBLISHABLE_KEY:",
    supabasePublishableKey ? "✓ Set" : "✗ Missing",
  );
  console.log(
    "- SERVICE_ROLE_KEY:",
    supabaseServiceRoleKey ? "✓ Set" : "✗ Missing",
  );
}

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

// 사용할 키 결정: PUBLISHABLE_KEY 우선, 없으면 ANON_KEY 사용 (하위 호환성)
const clientKey = supabasePublishableKey || supabaseAnonKey;

if (!clientKey) {
  throw new Error("Missing Supabase client key (PUBLISHABLE_KEY or ANON_KEY)");
}

/**
 * Server-side Supabase client (bypasses RLS)
 * Use this for:
 * - Admin operations
 * - Cross-user queries
 * - Background jobs
 * - Operations that need to bypass RLS
 */
export function createServerSupabaseClient() {
  if (!supabaseServiceRoleKey) {
    console.warn(
      "⚠️ SUPABASE_SERVICE_ROLE_KEY not set, falling back to client key",
    );
    return createPublicSupabaseClient();
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Public Supabase client (respects RLS)
 * Use this for:
 * - Public data access
 * - Server-side rendering of public content
 * - Operations that should respect RLS
 */
export function createPublicSupabaseClient() {
  return createClient(supabaseUrl, clientKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Browser-side Supabase client (respects RLS)
 * Use this for:
 * - Client-side operations
 * - User-specific data access
 * - Real-time subscriptions
 */
export function createBrowserSupabaseClient() {
  return createClient(supabaseUrl, clientKey, {
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
}

// 하위 호환성을 위한 기본 export (기존 코드가 계속 작동하도록)
export const supabase = createBrowserSupabaseClient();
export const supabaseAdmin = createServerSupabaseClient();

export const TABLES = {
  COURSES: "courses",
  COURSE_CATEGORIES: "course_categories",
  COURSE_COMMENTS: "course_comments",
  ACCESS_LINKS: "access_links",
  ADMIN: "admin",
  APP_SETTINGS: "app_settings",
  PROFILES: "profiles",
} as const;
