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

function isGoogleOAuthEnabledClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_AUTH_GOOGLE_OAUTH_ENABLED?.trim().toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "no";
}

/** Яндекс ID и Google Sign-In через Supabase OAuth. */
export function RussianIdpPanel({ variant = "login", nextPath = "/app" }: RussianIdpPanelProps) {
  const [loading, setLoading] = useState<AuthProvider | null>(null);
  const [message, setMessage] = useState("");
  const providers: AuthProvider[] = isGoogleOAuthEnabledClient() ? ["yandex", "google"] : ["yandex"];

  async function onProviderPress(provider: AuthProvider) {
    if (provider === "telegram") return;
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
        const label = provider === "google" ? "Google" : "Яндекс";
        setMessage(
          /provider.*not enabled|unsupported/i.test(error.message)
            ? `${label} не настроен в Supabase Authentication → Providers.`
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
        Быстрый вход через Яндекс ID или Google — без письма и пароля.
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
