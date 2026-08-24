import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppToaster } from "@/components/providers/app-toaster";
import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";
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
            __html: `(function(){try{var m=localStorage.getItem("clinical-theme-mode");var p=location.pathname;var pub=p==="/"||/^\\/(landing|lp|login|register|verify-phone|pricing|auth|privacy)(\\/|$)/.test(p);var sys=window.matchMedia("(prefers-color-scheme: dark)").matches;var d;if(m==="dark")d=true;else if(m==="light")d=false;else d=pub?sys:true;document.documentElement.setAttribute("data-theme",d?"dark":"light");document.documentElement.classList.toggle("dark",d);if(m==="light"||m==="dark")document.documentElement.setAttribute("data-theme-forced",m);}catch(e){}})();`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html:
              "html,body{min-height:100%;margin:0}html[data-theme=dark],html.dark{background:#0b0f19;color:#f1f5f9}html[data-theme=light]{background:#dceef7;color:#0c3347}",
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
