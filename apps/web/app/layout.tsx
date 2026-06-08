import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppToaster } from "@/components/providers/app-toaster";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { SessionProvider } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Medical Ultrasound Platform",
    template: "%s | Medical Ultrasound Platform",
  },
  description: "Medical ultrasound clinical platform with Supabase auth and protected workspace.",
  manifest: "/manifest.json",
  applicationName: "Medical Ultrasound Platform",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ultrasound",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b1120" }, { color: "#1d6fd8" }],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SessionProvider>
            {children}
            <AppToaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
