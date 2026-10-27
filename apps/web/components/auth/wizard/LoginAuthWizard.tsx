"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers";
import { AuthMessage, authInputClass } from "@/components/auth/AuthScreenShell";
import { TelegramSimpleAuth } from "@/components/auth/TelegramSimpleAuth";
import { AuthWizardLayout } from "@/components/auth/wizard/AuthWizardLayout";
import { Button } from "@/components/ui/button";
import { postForgotPassword, postMfaVerifyLogin, postSignIn } from "@/lib/auth/client-auth-api";
import { PASSWORD_RESET_GENERIC_MSG, requireOnlineForAuth } from "@/lib/auth/translate-auth-error";
import { isFullOpenAccessEnabledClient } from "@/lib/auth/guest-demo-account";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";
import { cn } from "@/lib/utils/cn";

type LoginMethod = "email" | "telegram";

type Props = {
  nextPath: string;
};

export function LoginAuthWizard({ nextPath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh, user, ready } = useAuth();

  const initialMethod = useMemo<LoginMethod>(() => {
    return searchParams.get("method") === "telegram" ? "telegram" : "email";
  }, [searchParams]);

  const [method, setMethod] = useState<LoginMethod>(initialMethod);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    setMethod(initialMethod);
  }, [initialMethod]);

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(nextPath);
    router.refresh();
  }, [ready, user, router, nextPath]);

  const guardOnline = useCallback(() => {
    const offline = requireOnlineForAuth();
    if (offline) {
      setMessage(offline);
      return false;
    }
    return true;
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!guardOnline()) return;

    setLoading(true);
    try {
      const result = await postSignIn({ email: email.trim(), password });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (result.needsMfa && result.factorId) {
        setMfaRequired(true);
        setMfaFactorId(result.factorId);
        return;
      }
      markSessionAnchorNow();
      await refresh();
      router.replace(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onMfaSubmit(e: FormEvent) {
    e.preventDefault();
    if (!mfaFactorId) return;
    setLoading(true);
    try {
      const result = await postMfaVerifyLogin({ factorId: mfaFactorId, code: mfaCode.trim() });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      markSessionAnchorNow();
      await refresh();
      router.replace(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword() {
    setMessage("");
    if (!guardOnline()) return;
    if (!email.trim()) {
      setMessage("Укажите email для восстановления пароля.");
      return;
    }
    setLoading(true);
    try {
      const result = await postForgotPassword(email.trim());
      setMessage(result.ok ? result.message : PASSWORD_RESET_GENERIC_MSG);
    } finally {
      setLoading(false);
    }
  }

  const methodSwitcher = (
    <div
      className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-1"
      role="tablist"
      aria-label="Способ входа"
    >
      {(
        [
          { id: "email" as const, label: "Почта" },
          { id: "telegram" as const, label: "Telegram" },
        ] as const
      ).map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={method === opt.id}
          onClick={() => {
            setMethod(opt.id);
            setMessage("");
            setMfaRequired(false);
          }}
          className={cn(
            "rounded-xl py-2.5 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
            method === opt.id
              ? "bg-[var(--clinical-card)] text-[var(--clinical-primary-deep)] shadow-sm"
              : "text-[var(--clinical-foreground-muted)] hover:text-[var(--clinical-foreground)]",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <AuthWizardLayout
      title={mfaRequired ? "Код двухфакторной защиты" : "Вход"}
      subtitle={
        mfaRequired
          ? "Введите код из приложения-аутентификатора."
          : method === "email"
            ? "Email и пароль — основной способ входа."
            : "Вход через Telegram-бота."
      }
    >
      {!mfaRequired && isFullOpenAccessEnabledClient() ? (
        <Button asChild variant="outline" className="mb-4 w-full">
          <Link href="/home">В кабинет без входа</Link>
        </Button>
      ) : null}

      {!mfaRequired ? methodSwitcher : null}

      {mfaRequired ? (
        <form className="space-y-4" onSubmit={(e) => void onMfaSubmit(e)}>
          <label className="block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Код MFA</span>
            <input
              className={authInputClass}
              inputMode="numeric"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
              autoComplete="one-time-code"
            />
          </label>
          <AuthMessage message={message} />
          <Button type="submit" className="w-full" disabled={loading}>
            Подтвердить
          </Button>
        </form>
      ) : method === "telegram" ? (
        <TelegramSimpleAuth mode="login" nextPath={nextPath} message={message || undefined} />
      ) : (
        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <label className="block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">E-mail</span>
            <input
              className={authInputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              data-testid="email-input"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Пароль</span>
            <input
              className={authInputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              data-testid="password-input"
            />
          </label>
          <AuthMessage message={message} />
          <Button type="submit" className="w-full" disabled={loading} data-testid="login-button" aria-label="Войти">
            Войти
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-[var(--clinical-primary-deep)] hover:underline"
            disabled={loading}
            onClick={() => void onResetPassword()}
          >
            Забыли пароль?
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--clinical-foreground-muted)]">
        {isFullOpenAccessEnabledClient() ? (
          <>
            Вход не обязателен —{" "}
            <Link href="/home" className="font-bold text-[var(--clinical-primary-deep)] hover:underline">
              открыть кабинет
            </Link>
            {" · "}
          </>
        ) : null}
        Нет аккаунта?{" "}
        <Link href="/register" className="font-bold text-[var(--clinical-primary-deep)] hover:underline">
          Регистрация
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-[var(--clinical-foreground-muted)]">
        <Link href="/login?wizard=0" className="hover:underline">
          SMS и Яндекс ID
        </Link>
      </p>
    </AuthWizardLayout>
  );
}
