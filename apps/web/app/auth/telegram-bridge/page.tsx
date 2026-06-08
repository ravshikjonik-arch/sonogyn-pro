"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { AuthMessage } from "@/components/auth/AuthScreenShell";

function TelegramBridgeInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const redirect = searchParams.get("redirect");

  const onAuth = useCallback(
    async (user: Record<string, unknown>) => {
      setMessage("");
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sonogyn-client": "mobile",
        },
        body: JSON.stringify(user),
      });
      const payload = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        session?: { access_token: string; refresh_token: string };
      } | null;

      if (!res.ok || !payload?.ok || !payload.session) {
        setMessage(payload?.error ?? "Не удалось войти через Telegram.");
        return;
      }

      if (redirect) {
        const url = new URL(redirect);
        url.searchParams.set("access_token", payload.session.access_token);
        url.searchParams.set("refresh_token", payload.session.refresh_token);
        window.location.href = url.toString();
        return;
      }

      router.replace("/app");
      router.refresh();
    },
    [redirect, router],
  );

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--clinical-canvas)] px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-[var(--clinical-border)] bg-white p-8 shadow-xl">
        <h1 className="text-center text-2xl font-bold text-slate-950">Telegram для mobile</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          После входа вы вернётесь в приложение SonoGyn Pro.
        </p>
        <div className="mt-6">
          <TelegramLoginButton botUsername={botUsername} onAuth={onAuth} onError={setMessage} />
        </div>
        {message ? <div className="mt-4"><AuthMessage message={message} /></div> : null}
      </section>
    </main>
  );
}

export default function TelegramBridgePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Загрузка…</div>}>
      <TelegramBridgeInner />
    </Suspense>
  );
}
