"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AuthStatus = {
  ok?: boolean;
  issues?: string[];
  features?: {
    emailAutoConfirm?: boolean;
    telegramReady?: boolean;
  };
  hints?: {
    supabaseSiteUrl?: string;
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

  if (!status || status.ok) return null;

  const issues = status.issues ?? [];
  const showTelegram = issues.some((i) => i.includes("TELEGRAM_BOT_TOKEN"));
  const showEmailHint = !status.features?.emailAutoConfirm;

  return (
    <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <p className="font-semibold">Нужна настройка сервера (Vercel / Supabase)</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      {showTelegram ? (
        <p className="mt-2 text-xs">
          Telegram: BotFather → <span className="font-mono">/token</span> → добавьте{" "}
          <span className="font-mono">TELEGRAM_BOT_TOKEN</span> в Vercel → Redeploy.
        </p>
      ) : null}
      {showEmailHint ? (
        <p className="mt-2 text-xs">
          Email: задайте <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> в Vercel для мгновенной
          регистрации без письма, или настройте SMTP в Supabase.
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
