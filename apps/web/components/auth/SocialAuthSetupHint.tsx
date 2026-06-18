"use client";

import { useEffect, useState } from "react";

import { supabaseGoogleCallbackUrl, TELEGRAM_LOGIN_DOMAINS } from "@/lib/auth/social-auth-domains";

type AuthStatus = {
  features?: {
    telegramReady?: boolean;
  };
  telegramBotUsername?: string;
  issues?: string[];
};

type SocialAuthSetupHintProps = {
  /** Показать блок Google (например после auth_callback). */
  showGoogle?: boolean;
  /** Показать блок Telegram (если бот не готов). */
  showTelegram?: boolean;
};

export function SocialAuthSetupHint({ showGoogle, showTelegram }: SocialAuthSetupHintProps) {
  const [status, setStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    void fetch("/api/auth/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: AuthStatus) => setStatus(json))
      .catch(() => setStatus(null));
  }, []);

  const telegramReady = status?.features?.telegramReady;
  const bot = status?.telegramBotUsername?.trim() || "sonogyn_bot";
  const googleCallback = supabaseGoogleCallbackUrl();

  const showTgBlock = showTelegram ?? !telegramReady;
  const showGoBlock = showGoogle ?? false;

  if (!showTgBlock && !showGoBlock) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      {showGoBlock ? (
        <div>
          <p className="font-semibold">Google — настройка (один раз)</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs">
            <li>
              Google Cloud → Credentials → OAuth client → <strong>Authorized redirect URIs</strong>:
            </li>
          </ol>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-2 text-[10px] dark:bg-black/20">{googleCallback}</pre>
          <p className="mt-2 text-xs">
            Supabase → Authentication → Providers → Google → Client ID + Secret. Site URL:{" "}
            <span className="font-mono">https://sonogyn-pro.ru</span>
          </p>
        </div>
      ) : null}

      {showTgBlock ? (
        <div>
          <p className="font-semibold">Telegram — настройка (один раз)</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs">
            <li>
              BotFather → <span className="font-mono">/setdomain</span> → @{bot} → домены:
            </li>
          </ol>
          <p className="mt-1 font-mono text-[10px]">{TELEGRAM_LOGIN_DOMAINS.join(", ")}</p>
          <p className="mt-2 text-xs">
            Vercel: <span className="font-mono">TELEGRAM_BOT_TOKEN</span>,{" "}
            <span className="font-mono">NEXT_PUBLIC_TELEGRAM_BOT_USERNAME={bot}</span>,{" "}
            <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> → Redeploy.
          </p>
        </div>
      ) : null}
    </div>
  );
}
