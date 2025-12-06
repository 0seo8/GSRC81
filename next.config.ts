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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iogbdjpvcxtdchmpicma.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "k.kakaocdn.net",
        pathname: "/**",
      },
      {
        protocol: "http", // 카카오가 http URL을 제공하는 경우 대비
        hostname: "k.kakaocdn.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "mud-kage.kakao.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
