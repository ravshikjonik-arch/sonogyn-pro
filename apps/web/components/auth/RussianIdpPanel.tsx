"use client";

import { useState } from "react";
import type { AuthProvider } from "@repo/ui";
import { AuthButtons } from "@repo/ui";

import { AuthMessage } from "@/components/auth/AuthScreenShell";
import { buildOAuthRedirect, oauthProviderToSupabase } from "@/lib/auth/oauth-providers";
import { createClient } from "@/utils/supabase/client";

type RussianIdpPanelProps = {
  variant?: "login" | "register";
  nextPath?: string;
};

/** Яндекс ID через Supabase Custom OAuth (`custom:yandex`). Google не используется. */
export function RussianIdpPanel({ variant = "login", nextPath = "/app" }: RussianIdpPanelProps) {
  const [loading, setLoading] = useState<AuthProvider | null>(null);
  const [message, setMessage] = useState("");
  const providers: AuthProvider[] = ["yandex"];

  async function onProviderPress(provider: AuthProvider) {
    if (provider !== "yandex") return;
    setLoading(provider);
    setMessage("");
    try {
      const supabase = createClient();
      if (!supabase) {
        setMessage("Supabase не настроен (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).");
        return;
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = buildOAuthRedirect(origin, nextPath);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: oauthProviderToSupabase(provider),
        options: { redirectTo },
      });
      if (error) {
        setMessage(
          /provider.*not enabled|unsupported/i.test(error.message)
            ? "Яндекс ID не настроен в Supabase Authentication → Providers."
            : error.message || "Не удалось начать вход.",
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка OAuth");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--clinical-foreground-muted)]">
        Быстрый вход через Яндекс ID — без письма и пароля.
      </p>
      <AuthButtons
        providers={providers}
        onProviderPress={onProviderPress}
        loading={loading}
        variant={variant}
      />
      {message ? <AuthMessage message={message} /> : null}
    </div>
  );
}
