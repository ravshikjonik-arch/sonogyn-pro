"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

type Props = {
  botUsername?: string;
  onAuth?: (user: TelegramUser) => void;
  onError?: (message: string) => void;
  buttonSize?: "large" | "medium" | "small";
  /** Mount widget only when tab/panel is visible. */
  enabled?: boolean;
  nextPath?: string;
  /** redirect = iframe auth_url (works when telegram.org/js is blocked). callback = legacy onAuth. */
  mode?: "redirect" | "callback";
};

declare global {
  interface Window {
    TelegramLoginCallback?: (user: TelegramUser) => void;
  }
}

function normalizeBotUsername(value: string): string {
  return value.trim().replace(/^@/, "");
}

export function TelegramLoginButton({
  botUsername = "",
  onAuth,
  onError,
  buttonSize = "large",
  enabled = true,
  nextPath = "/app",
  mode = "redirect",
}: Props) {
  const [resolvedBot, setResolvedBot] = useState(() => normalizeBotUsername(botUsername));
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const normalized = normalizeBotUsername(botUsername);
    if (normalized) {
      setResolvedBot(normalized);
      return;
    }

    void fetch("/api/auth/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { telegramBotUsername?: string }) => {
        const fromServer = normalizeBotUsername(json.telegramBotUsername ?? "");
        if (fromServer) setResolvedBot(fromServer);
      })
      .catch(() => {
        onError?.("Не удалось получить имя Telegram-бота с сервера.");
      });
  }, [botUsername, onError]);

  useEffect(() => {
    if (mode !== "callback" || !onAuth) return;

    window.TelegramLoginCallback = (user) => {
      if (!user?.hash) {
        onError?.("Telegram не вернул подпись авторизации.");
        return;
      }
      onAuth(user);
    };

    return () => {
      delete window.TelegramLoginCallback;
    };
  }, [mode, onAuth, onError]);

  useEffect(() => {
    if (mode !== "callback" || !enabled || !resolvedBot || !onAuth) return;

    const el = document.getElementById("telegram-login-script-host");
    if (!el) return;

    el.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", resolvedBot);
    script.setAttribute("data-size", buttonSize);
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "TelegramLoginCallback(user)");
    script.onerror = () => {
      onError?.("Не удалось загрузить Telegram. Попробуйте отключить VPN/блокировщик или используйте вход по Email.");
    };
    el.appendChild(script);
  }, [mode, resolvedBot, buttonSize, enabled, onAuth, onError]);

  const iframeSrc = useMemo(() => {
    if (!origin || !resolvedBot || mode !== "redirect") return "";
    const callbackUrl = `${origin}/auth/telegram/callback?next=${encodeURIComponent(nextPath)}`;
    const params = new URLSearchParams({
      origin,
      size: buttonSize,
      request_access: "write",
      auth_url: callbackUrl,
    });
    return `https://oauth.telegram.org/embed/${encodeURIComponent(resolvedBot)}?${params.toString()}`;
  }, [origin, resolvedBot, buttonSize, nextPath, mode]);

  if (!resolvedBot) {
    return (
      <div className="space-y-3">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Telegram не настроен: задайте NEXT_PUBLIC_TELEGRAM_BOT_USERNAME и TELEGRAM_BOT_TOKEN на Vercel →
          Redeploy.
        </p>
      </div>
    );
  }

  const fallbackHref = `/auth/telegram/start?next=${encodeURIComponent(nextPath)}`;

  if (!enabled) {
    return <div className="min-h-[44px]" aria-hidden />;
  }

  if (mode === "callback") {
    return (
      <div
        id="telegram-login-script-host"
        className="flex min-h-[44px] justify-center [&>iframe]:pointer-events-auto"
        aria-label="Войти через Telegram"
      />
    );
  }

  if (!iframeSrc) {
    return <div className="min-h-[44px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />;
  }

  return (
    <div className="relative z-10 flex flex-col items-center gap-3">
      <iframe
        src={iframeSrc}
        title="Войти через Telegram"
        className="pointer-events-auto h-[44px] w-full max-w-[280px] overflow-hidden border-0 bg-transparent"
        scrolling="no"
        allow="clipboard-write"
      />
      <Button variant="outline" className="w-full max-w-[280px] rounded-2xl" asChild>
        <Link href={fallbackHref}>Войти через Telegram (если кнопка выше неактивна)</Link>
      </Button>
      <p className="max-w-[280px] text-center text-[11px] text-[var(--clinical-foreground-muted)]">
        Если кнопка серая — в BotFather: /setdomain → @{resolvedBot} → {origin || "ваш-домен.ru"}
      </p>
    </div>
  );
}
