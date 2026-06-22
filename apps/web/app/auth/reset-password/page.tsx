"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAuthSession, postUpdatePassword } from "@/lib/auth/client-auth-api";
import { recoveryResetPath } from "@/lib/auth/auth-callback";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recovery = searchParams.get("recovery") === "1";
  const callbackError = searchParams.get("error") === "auth_callback";
  const callbackMessage = searchParams.get("message");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);

  const finishCheck = useCallback(async () => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash") ?? url.searchParams.get("token");
    const type = url.searchParams.get("type");

    if (code || tokenHash) {
      const callback = new URL("/auth/callback", url.origin);
      if (code) callback.searchParams.set("code", code);
      if (tokenHash) callback.searchParams.set("token_hash", tokenHash);
      if (type) callback.searchParams.set("type", type);
      callback.searchParams.set("next", recoveryResetPath());
      window.location.replace(callback.toString());
      return;
    }

    const { user } = await fetchAuthSession();
    setCanReset(Boolean(user));
    setCheckingSession(false);

    if (!user && callbackError && callbackMessage) {
      setMessage(decodeURIComponent(callbackMessage));
    } else if (!user && recovery) {
      setMessage("Сессия восстановления не найдена. Откройте свежую ссылку из письма или запросите новую.");
    }
  }, [callbackError, callbackMessage, recovery]);

  useEffect(() => {
    void finishCheck();
  }, [finishCheck]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Пароль не короче 8 символов.");
      return;
    }
    if (password !== confirm) {
      setMessage("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      const result = await postUpdatePassword(password);
      if (!result.ok) {
        setMessage(result.error);
        if (/сессия|session|jwt|expired/i.test(result.error)) {
          setCanReset(false);
        }
        return;
      }

      router.replace("/login?message=password_updated");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Проверяем ссылку из письма…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Новый пароль</h1>
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            {canReset
              ? recovery
                ? "Ссылка подтверждена. Задайте новый пароль для входа в SonoGyn Pro."
                : "Задайте новый пароль для аккаунта SonoGyn Pro."
              : "Чтобы сменить пароль, перейдите по ссылке из письма или запросите новую на странице входа."}
          </p>
        </div>

        {canReset ? (
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="new-password">
                Новый пароль
              </label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirm-password">
                Повторите пароль
              </label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {message ? <p className="text-sm text-red-600">{message}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Сохранение…" : "Сохранить пароль"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            {message ? <p className="text-sm text-red-600">{message}</p> : null}
            <Button asChild className="w-full">
              <Link href="/login">Запросить новую ссылку</Link>
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">
          <Link href="/login" className="underline">
            Вернуться ко входу
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
          <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
