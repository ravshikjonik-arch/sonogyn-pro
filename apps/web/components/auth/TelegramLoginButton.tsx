"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

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
  botUsername: string;
  onAuth: (user: TelegramUser) => void;
  onError: (message: string) => void;
  buttonSize?: "large" | "medium" | "small";
  /** Mount widget only when tab/panel is visible (hidden tabs break Telegram iframe clicks). */
  enabled?: boolean;
};

declare global {
  interface Window {
    TelegramLoginCallback?: (user: TelegramUser) => void;
  }
}

export function TelegramLoginButton({
  botUsername,
  onAuth,
  onError,
  buttonSize = "large",
  enabled = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.TelegramLoginCallback = (user) => {
      if (!user?.hash) {
        onError("Telegram не вернул подпись авторизации.");
        return;
      }
      onAuth(user);
    };

    return () => {
      delete window.TelegramLoginCallback;
    };
  }, [onAuth, onError]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !botUsername || !enabled) {
      if (el) el.innerHTML = "";
      return;
    }

    el.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", buttonSize);
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "TelegramLoginCallback(user)");
    script.onerror = () => {
      onError("Не удалось загрузить кнопку Telegram. Обновите страницу или отключите блокировщик рекламы.");
    };
    el.appendChild(script);
  }, [botUsername, buttonSize, enabled, onError]);

  if (!botUsername) {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Telegram не настроен: задайте NEXT_PUBLIC_TELEGRAM_BOT_USERNAME в .env.local
      </p>
    );
  }

  return (
    <>
      <Script src="https://telegram.org/js/telegram-widget.js?22" strategy="lazyOnload" />
      <div
        ref={containerRef}
        className="flex min-h-[44px] justify-center [&>iframe]:pointer-events-auto"
        aria-label="Войти через Telegram"
      />
    </>
  );
}
