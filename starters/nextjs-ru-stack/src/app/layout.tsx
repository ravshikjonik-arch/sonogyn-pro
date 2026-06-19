import type { Metadata } from "next";

import { AuthSessionProvider } from "@/components/session-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js RU Stack",
  description: "NextAuth + sms.ru + YooKassa + Telegram",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
