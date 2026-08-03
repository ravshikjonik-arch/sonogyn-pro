"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AuthStatus = {
  ok?: boolean;
  appOrigin?: string;
  issues?: string[];
  notes?: string[];
  devAuth?: {
    enabled?: boolean;
    sessionMaxAgeDays?: number | null;
    autoLogin?: boolean;
  };
  features?: {
    emailAutoConfirm?: boolean;
    authEmailOnly?: boolean;
    smtpConfigured?: boolean;
  };
  hints?: {
    supabaseSiteUrl?: string;
    supabaseDashboard?: Array<{
      area: string;
      setting: string;
      recommended: string;
      why: string;
    }>;
  };
};

export function AuthSetupBanner() {
  const [status, setStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    void fetch("/api/auth/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: AuthStatus) => setStatus(json))
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const isBrowserLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const appOrigin = status.appOrigin ?? status.hints?.supabaseSiteUrl ?? "";
  const originIsLocal = appOrigin.includes("localhost") || appOrigin.includes("127.0.0.1");
  const issues = status.issues ?? [];
  const blockingIssues = issues.filter(
    (issue) => !issue.includes("AUTH_EMAIL_ONLY") && !issue.includes("SMS и Google отключены"),
  );

  // Local mail-first: Confirm email ON is intentional — don't scare with DEV_AUTH_MODE / turn Confirm OFF.
  if (isBrowserLocal) {
    return (
      <div className="mb-4 rounded-2xl border border-sky-300 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100">
        <p className="font-semibold">Локальная разработка · регистрация по Email</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            Сейчас origin: <span className="font-mono">{appOrigin || "http://localhost:3000"}</span>
          </li>
          <li>
            В Supabase Dashboard → Authentication → URL Configuration поставьте{" "}
            <span className="font-mono">Site URL = https://sonogyn-pro.ru</span> (не localhost).
          </li>
          <li>
            Redirect URLs:{" "}
            <span className="font-mono">https://sonogyn-pro.ru/**</span>,{" "}
            <span className="font-mono">http://localhost:3000/**</span>
          </li>
          <li>
            Confirm email: <strong>ON</strong> · письмо обязательно (mail-first). Не отключайте для «удобства».
          </li>
          <li>
            На Vercel: <span className="font-mono">NEXT_PUBLIC_APP_URL=https://sonogyn-pro.ru</span>,{" "}
            <span className="font-mono">AUTH_AUTO_CONFIRM_EMAIL=false</span>
          </li>
          {status.features?.smtpConfigured === false ? (
            <li className="text-amber-900 dark:text-amber-200">SMTP не виден приложению — проверьте SMTP_* / Supabase Custom SMTP.</li>
          ) : (
            <li>SMTP настроен — письмо должно уходить через Supabase Auth.</li>
          )}
        </ul>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/register?method=email" className="underline">
            Регистрация по Email
          </Link>
          <a
            href="https://supabase.com/dashboard/project/ocqlsqqloqvlzutbgrnp/auth/url-configuration"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Supabase URL Configuration
          </a>
        </div>
      </div>
    );
  }

  if (status.ok || blockingIssues.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <p className="font-semibold">Нужна настройка сервера (Vercel / Supabase)</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
        {blockingIssues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      {originIsLocal ? (
        <p className="mt-2 text-xs">
          Задайте на Vercel <span className="font-mono">NEXT_PUBLIC_APP_URL=https://sonogyn-pro.ru</span> и в Supabase Site URL то же значение.
        </p>
      ) : null}
      <p className="mt-2 text-xs">
        Mail-first: Confirm email = ON, <span className="font-mono">AUTH_AUTO_CONFIRM_EMAIL=false</span>. После регистрации откройте письмо и войдите.
      </p>
      <Link href="/register?method=email" className="mt-2 inline-block text-xs font-semibold underline">
        Регистрация по Email
      </Link>
    </div>
  );
}
