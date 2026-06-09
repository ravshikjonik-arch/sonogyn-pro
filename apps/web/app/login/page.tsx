"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useState } from "react";
import type { AuthProvider } from "@repo/ui";
import { AuthButtons } from "@repo/ui";

import { useAuth, useSupabase } from "@/app/providers";
import { AuthMessage, AuthScreenShell, authInputClass } from "@/components/auth/AuthScreenShell";
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { Button } from "@/components/ui/button";
import { buildOAuthRedirect, normalizePhone, oauthProviderToSupabase } from "@/lib/auth/oauth-providers";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { postSignIn, postMfaVerifyLogin, postPhoneSendOtp, postPhoneVerifyOtp } from "@/lib/auth/client-auth-api";
import { CAPTCHA_FAILURE_THRESHOLD } from "@/lib/auth/auth-attempts";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";
import {
  PASSWORD_RESET_GENERIC_MSG,
  requireOnlineForAuth,
  translateAuthError,
} from "@/lib/auth/translate-auth-error";
import { safeInternalPath } from "@/lib/nav/safe-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<AuthProvider | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  const nextPath = safeInternalPath(searchParams.get("redirectedFrom"), "/app");
  const showCaptcha =
    Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) &&
    (requiresCaptcha || failedAttempts >= CAPTCHA_FAILURE_THRESHOLD);

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
      const result = await postSignIn({
        email: email.trim(),
        password,
        turnstileToken,
      });
      if (!result.ok) {
        setFailedAttempts((n) => n + 1);
        setRequiresCaptcha(Boolean(result.requiresCaptcha));
        setMessage(result.error);
        setTurnstileToken(undefined);
        return;
      }
      if (result.needsMfa && result.factorId) {
        setMfaRequired(true);
        setMfaFactorId(result.factorId);
        setMessage("Введите код из приложения аутентификатора.");
        return;
      }
      setFailedAttempts(0);
      markSessionAnchorNow();
      await refresh();
      router.push(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onMfaLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!mfaFactorId || !guardOnline()) return;

    setLoading(true);
    try {
      const result = await postMfaVerifyLogin({ factorId: mfaFactorId, code: mfaCode.trim() });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMfaRequired(false);
      markSessionAnchorNow();
      await refresh();
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
      const result = await postPhoneSendOtp({
        phone: normalized,
        turnstileToken,
      });
      if (!result.ok) {
        setRequiresCaptcha(Boolean(result.requiresCaptcha));
        setMessage(result.error);
        setTurnstileToken(undefined);
        return;
      }
      setOtpSent(true);
      setMessage(result.message ?? "Если номер подходит, код отправлен по SMS.");
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
      const result = await postPhoneVerifyOtp({ phone: normalized, token: otp.trim() });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      markSessionAnchorNow();
      await refresh();
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
        setMessage(PASSWORD_RESET_GENERIC_MSG);
        return;
      }
      setMessage(PASSWORD_RESET_GENERIC_MSG);
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
        mfaRequired ? (
          <form className="space-y-4" onSubmit={(e) => void onMfaLogin(e)}>
            <p className="text-sm text-[var(--clinical-foreground-muted)]">
              Двухфакторная аутентификация включена. Введите 6-значный код.
            </p>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Код TOTP</span>
              <input
                className={authInputClass}
                inputMode="numeric"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="000000"
                required
                aria-label="Код TOTP"
              />
            </label>
            {message ? <AuthMessage message={message} tone="error" /> : null}
            <Button className="w-full rounded-2xl py-6" type="submit" disabled={loading} aria-label="Подтвердить MFA">
              {loading ? "Проверяем…" : "Подтвердить"}
            </Button>
          </form>
        ) : (
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
          {message ? <AuthMessage message={message} tone="error" /> : null}
          {showCaptcha ? (
            <TurnstileWidget onToken={(t) => setTurnstileToken(t)} onExpire={() => setTurnstileToken(undefined)} />
          ) : null}
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
        )
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
