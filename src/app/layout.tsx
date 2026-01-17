import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/shared/components/ui/sonner";
import { Providers } from "@/shared/components/common/providers";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GSRC81 MAPS - 러닝 코스 가이드",
  description: "GSRC81 러닝 크루의 코스 탐색 및 비행 모드 가이드 앱",
  keywords: [
    "러닝",
    "코스",
    "지도",
    "GSRC81",
    "은평구",
    "구파발",
    "비행모드",
    "GPS",
  ],
  authors: [{ name: "GSRC81" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GSRC81 MAPS",
    startupImage: [
      // iPhone 12/13/14 Pro
      {
        url: "/apple-splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 12/13/14 Pro Max
      {
        url: "/apple-splash-1284x2778.png",
        media:
          "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 Pro
      {
        url: "/apple-splash-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 Pro Max
      {
        url: "/apple-splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 8/SE
      {
        url: "/apple-splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPhone X/XS/11 Pro
      {
        url: "/apple-splash-1125x2436.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone XS Max/11 Pro Max
      {
        url: "/apple-splash-1242x2688.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone XR/11
      {
        url: "/apple-splash-828x1792.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPad
      {
        url: "/apple-splash-1536x2048.png",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPad Pro 12.9
      {
        url: "/apple-splash-2048x2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* iOS Safe Area 지원을 위한 추가 meta 태그 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <title></title>
      </head>
      <body
        className={`${notoSans.variable} ${inter.variable} ${poppins.variable} antialiased safe-area-bottom`}
      >
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#fff",
                border: "1px solid #e5e7eb",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
