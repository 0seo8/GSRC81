import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GSRC81 Maps - 구파발 러너 매퍼",
  description: "은평구 기반 러닝 코스 지도 서비스",
  keywords: ["러닝", "코스", "지도", "GSRC81", "은평구", "구파발"],
  authors: [{ name: "GSRC81" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#ff6b35",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              border: '1px solid #e5e7eb',
            },
          }}
        />
      </body>
    </html>
  );
}
