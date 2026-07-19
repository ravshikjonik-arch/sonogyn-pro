"use client";

import { supabaseOAuthCallbackUrl } from "@/lib/auth/social-auth-domains";

type SocialAuthSetupHintProps = {
  /** Legacy: Google больше не предлагается в UI (199-ФЗ). */
  showGoogle?: boolean;
  /** Подсказка по Яндекс ID после ошибки OAuth. */
  showRussianIdp?: boolean;
};

export function SocialAuthSetupHint({ showGoogle, showRussianIdp }: SocialAuthSetupHintProps) {
  if (!showGoogle && !showRussianIdp) return null;

  const callback = supabaseOAuthCallbackUrl();

  if (showRussianIdp) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
        <p className="font-semibold">Яндекс ID — настройка (один раз)</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs">
          <li>Yandex OAuth → Redirect URI:</li>
        </ol>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-2 text-[10px] dark:bg-black/20">{callback}</pre>
        <p className="mt-2 text-xs">
          Supabase → Authentication → Providers → Yandex → Client ID + Secret. Env:{" "}
          <span className="font-mono">NEXT_PUBLIC_YANDEX_CLIENT_ID</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-semibold">Google отключён</p>
      <p className="mt-2 text-xs">
        По 199-ФЗ вход через иностранные IdP (Google, Apple) для пользователей из РФ не используется.
        Выберите SMS (+7), Яндекс ID, Telegram или email.
      </p>
    </div>
  );
}
