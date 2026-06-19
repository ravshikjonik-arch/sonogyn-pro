"use client";

import { supabaseGoogleCallbackUrl } from "@/lib/auth/social-auth-domains";

type SocialAuthSetupHintProps = {
  /** Показать блок Google (например после auth_callback). */
  showGoogle?: boolean;
};

export function SocialAuthSetupHint({ showGoogle }: SocialAuthSetupHintProps) {
  if (!showGoogle) return null;

  const googleCallback = supabaseGoogleCallbackUrl();

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
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
  );
}
