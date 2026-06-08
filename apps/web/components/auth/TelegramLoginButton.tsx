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
};

declare global {
  interface Window {
    TelegramLoginCallback?: (user: TelegramUser) => void;
  }
}

export function TelegramLoginButton({ botUsername, onAuth, onError, buttonSize = "large" }: Props) {
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
    if (!el || !botUsername) return;

    el.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", buttonSize);
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "TelegramLoginCallback(user)");
    el.appendChild(script);
  }, [botUsername, buttonSize]);

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
      <div ref={containerRef} className="flex justify-center" aria-label="Войти через Telegram" />
    </>
  );
}
