import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppToaster } from "@/components/providers/app-toaster";
import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { THEME_BOOT_SCRIPT } from "@/lib/theme/theme-paths";
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
    default: "SonoGyn Pro",
    template: "%s | SonoGyn Pro",
  },
  description:
    "Клиническая платформа УЗИ и акушерства-гинекологии: калькуляторы по гайдлайнам, справочники и рабочий кабинет для врачей.",
  manifest: "/manifest.json",
  applicationName: "SonoGyn Pro",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SonoGyn Pro",
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
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0d0f14" }, { color: "#ffffff" }],
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
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if("serviceWorker"in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});}if(typeof caches!=="undefined"&&caches.keys){caches.keys().then(function(keys){keys.forEach(function(k){caches.delete(k);});});}}catch(e){}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOT_SCRIPT,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html:
              "html,body{min-height:100%;margin:0}html[data-theme=dark],html.dark{background:#0d0f14;color:#edeff3}html[data-theme=light]{background:#ffffff;color:#1a1d24}",
          }}
        />
      </head>
          <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SessionProvider>
            {children}
            <AppToaster />
            <CookieConsentBanner />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
