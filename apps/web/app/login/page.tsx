"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useState } from "react";
import type { AuthProvider } from "@repo/ui";
import { AuthButtons } from "@repo/ui";

import { useSupabase } from "@/app/providers";
import { AuthMessage, AuthScreenShell, authInputClass } from "@/components/auth/AuthScreenShell";
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { Button } from "@/components/ui/button";
import { buildOAuthRedirect, normalizePhone, oauthProviderToSupabase } from "@/lib/auth/oauth-providers";
import { requireOnlineForAuth, translateAuthError } from "@/lib/auth/translate-auth-error";
import { safeInternalPath } from "@/lib/nav/safe-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<AuthProvider | null>(null);

  const nextPath = safeInternalPath(searchParams.get("redirectedFrom"), "/app");

  const guardOnline = useCallback(() => {
    const offline = requireOnlineForAuth();
    if (offline) {
      setMessage(offline);
      return false;
    }
    return true;
  }, []);

  async function onEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!guardOnline()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setMessage(translateAuthError(error.message));
        return;
      }
      router.push(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onSendOtp() {
    setMessage("");
    if (!guardOnline()) return;

    const normalized = normalizePhone(phone);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
      if (error) {
        setMessage(translateAuthError(error.message));
        return;
      }
      setOtpSent(true);
      setMessage("Код отправлен по SMS.");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!guardOnline()) return;

    const normalized = normalizePhone(phone);
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: normalized,
        token: otp.trim(),
        type: "sms",
      });
      if (error) {
        setMessage(translateAuthError(error.message));
        return;
      }
      router.push(nextPath);
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
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=/profile`,
      });
      if (error) {
        setMessage(translateAuthError(error.message));
        return;
      }
      setMessage("Письмо для сброса пароля отправлено на указанный email.");
    } finally {
      setLoading(false);
    }
  }

  async function onOAuth(provider: AuthProvider) {
    setMessage("");
    if (!guardOnline()) return;

    if (provider === "telegram") {
      setMessage("Используйте кнопку Telegram Login ниже.");
      return;
    }

    setOauthLoading(provider);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: oauthProviderToSupabase(provider),
        options: { redirectTo: buildOAuthRedirect(origin, nextPath) },
      });
      if (error) setMessage(translateAuthError(error.message));
    } finally {
      setOauthLoading(null);
    }
  }

  async function onTelegramAuth(user: Record<string, unknown>) {
    setMessage("");
    if (!guardOnline()) return;

    setOauthLoading("telegram");
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
        credentials: "same-origin",
      });
      const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !payload?.ok) {
        setMessage(payload?.error ?? "Не удалось войти через Telegram.");
        return;
      }
      router.push(nextPath);
      router.refresh();
    } finally {
      setOauthLoading(null);
    }
  }

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "";

  return (
    <AuthScreenShell
      title="Вход"
      subtitle="Email, телефон или соцсети — один аккаунт для web и mobile."
      emailTab={
        <form className="space-y-4" onSubmit={(e) => void onEmailLogin(e)}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
            <input
              className={authInputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
              required
              aria-label="Email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Пароль</span>
            <input
              className={authInputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              aria-label="Пароль"
            />
          </label>
          {message ? <AuthMessage message={message} tone={message.includes("отправлен") ? "success" : "error"} /> : null}
          <Button className="w-full rounded-2xl py-6" type="submit" disabled={loading} aria-label="Войти">
            {loading ? "Входим…" : "Войти"}
          </Button>
          <button
            type="button"
            className="w-full text-sm font-semibold text-[var(--clinical-primary-deep)] hover:underline"
            onClick={() => void onResetPassword()}
            aria-label="Забыли пароль"
          >
            Забыли пароль?
          </button>
        </form>
      }
      phoneTab={
        <form className="space-y-4" onSubmit={(e) => void onVerifyOtp(e)}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Телефон</span>
            <input
              className={authInputClass}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+79001234567"
              required
              aria-label="Номер телефона"
            />
          </label>
          {!otpSent ? (
            <Button
              type="button"
              className="w-full rounded-2xl py-6"
              disabled={loading}
              onClick={() => void onSendOtp()}
              aria-label="Получить код"
            >
              {loading ? "Отправляем…" : "Получить код"}
            </Button>
          ) : (
            <>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Код из SMS</span>
                <input
                  className={authInputClass}
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  aria-label="Код из SMS"
                />
              </label>
              <Button className="w-full rounded-2xl py-6" type="submit" disabled={loading} aria-label="Подтвердить код">
                {loading ? "Проверяем…" : "Подтвердить"}
              </Button>
            </>
          )}
        </form>
      }
      socialTab={
        <div className="space-y-4">
          <AuthButtons onProviderPress={(p) => void onOAuth(p)} loading={oauthLoading} variant="login" />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-3 text-center text-sm font-medium text-slate-700 dark:text-slate-200">Telegram Login Widget</p>
            <TelegramLoginButton
              botUsername={botUsername}
              onAuth={(user) => void onTelegramAuth(user as unknown as Record<string, unknown>)}
              onError={setMessage}
            />
          </div>
          {message ? <AuthMessage message={message} tone={message.includes("отправлен") ? "success" : "error"} /> : null}
        </div>
      }
      footer={
        <>
          <p className="mt-6 text-center text-sm text-[var(--clinical-foreground-muted)]">
            Нет аккаунта?{" "}
            <Link className="font-bold text-[var(--clinical-primary-deep)] hover:underline" href="/register">
              Зарегистрироваться
            </Link>
          </p>
          <p className="mt-4 text-center text-xs text-slate-400">
            <Link href="/landing" className="hover:underline">
              ← Главная страница
            </Link>
          </p>
        </>
      }
    />
  );
}

export default function LoginPage() {
  return (
    <main className="sonogyn-auth-shell sonogyn-mesh-bg">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-12 text-center text-sm text-[var(--clinical-foreground-muted)]">
            Загрузка формы…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
