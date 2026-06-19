"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AuthStatus = {
  ok?: boolean;
  issues?: string[];
  devAuth?: {
    enabled?: boolean;
    sessionMaxAgeDays?: number | null;
    autoLogin?: boolean;
  };
  features?: {
    emailAutoConfirm?: boolean;
    telegramReady?: boolean;
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

  const devOn = status.devAuth?.enabled;
  const issues = status.issues ?? [];
  const showEmailHint = !status.features?.emailAutoConfirm && !devOn;

  if (devOn) {
    return (
      <div className="mb-4 rounded-2xl border border-sky-300 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100">
        <p className="font-semibold">Локальная разработка (ваш компьютер)</p>
        <p className="mt-1 text-xs">Это не «тестовый пациент» — сайт на localhost. На production этого блока не будет.</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            Сессия в cookie: до <strong>{status.devAuth?.sessionMaxAgeDays ?? 90} дней</strong>
          </li>
          <li>Email confirm: {status.features?.emailAutoConfirm ? "auto на сервере" : "нужен service role"}</li>
          {!status.features?.emailAutoConfirm ? (
            <li className="text-amber-900 dark:text-amber-200">
              Раскомментируйте <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> в .env.local →{" "}
              <span className="font-mono">npm run setup:dev-login</span>
            </li>
          ) : null}
          <li>Повторный вход не нужен — cookie сохраняется между перезапусками браузера</li>
          {status.devAuth?.autoLogin ? <li>DEV_AUTO_LOGIN: вход с / без формы</li> : null}
        </ul>
        <Link href="/api/auth/status" className="mt-2 inline-block text-xs font-semibold underline" target="_blank">
          Чеклист Supabase (JSON)
        </Link>
      </div>
    );
  }

  if (status.ok) return null;

  return (
    <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <p className="font-semibold">Нужна настройка сервера (Vercel / Supabase)</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      {showEmailHint ? (
        <p className="mt-2 text-xs">
          Email: задайте <span className="font-mono">DEV_AUTH_MODE=true</span> +{" "}
          <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> в <span className="font-mono">.env.local</span>,
          или отключите Confirm email в Supabase Dashboard.
        </p>
      ) : null}
      {status.features?.emailAutoConfirm ? (
        <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">
          ✓ Email auto-confirm включён — после регистрации по почте вход сразу, без письма.
        </p>
      ) : null}
      <p className="mt-2 text-xs">
        Supabase Site URL:{" "}
        <span className="font-mono">{status.hints?.supabaseSiteUrl ?? "—"}</span>
      </p>
      <Link href="/register?method=email" className="mt-2 inline-block text-xs font-semibold underline">
        Регистрация по Email
      </Link>
    </div>
  );
}
