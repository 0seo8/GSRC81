import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { SafeAreaProvider } from "@/providers/safe-area-provider";

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
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  themeColor: "#000000",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GSRC81 MAPS",
    startupImage: "/icon-512x512.png",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        <SafeAreaProvider>
          <AuthProvider>
            <AdminProvider>
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
            </AdminProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </body>
    </html>
  );
}
