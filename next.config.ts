import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enforce TypeScript and ESLint errors in builds for code quality
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize output for better performance
  output: "standalone",
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["@/components", "@/lib"],
  },
  // Configure allowed image domains
  images: {
    domains: ['iogbdjpvcxtdchmpicma.supabase.co'],
  },
};

export default nextConfig;
