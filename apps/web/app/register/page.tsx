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
import { APP_LOCALES, readAppLocale, saveAppLocale, type AppLocale } from "@/lib/i18n/locale";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { CAPTCHA_FAILURE_THRESHOLD } from "@/lib/auth/auth-attempts";
import { postSignUp } from "@/lib/auth/client-auth-api";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";
import { SIGN_UP_GENERIC_MSG, requireOnlineForAuth, translateAuthError } from "@/lib/auth/translate-auth-error";
import {
  buildFioAbbreviation,
  normalizeRussianFio,
  PRODUCT_OWNER_FIO,
  PRODUCT_OWNER_FIO_SHORT,
} from "@/lib/auth/doctor-display";
import { safeInternalPath } from "@/lib/nav/safe-redirect";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<AuthProvider | null>(null);
  const [locale, setLocale] = useState<AppLocale>(() => readAppLocale());
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();

  const afterAuthPath = safeInternalPath(searchParams.get("next"), "/app");
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

  async function onEmailRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!guardOnline()) return;

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setMessage(
        `Укажите ФИО: сначала фамилия — например, ${PRODUCT_OWNER_FIO} → в кабинете «${PRODUCT_OWNER_FIO_SHORT}».`,
      );
      return;
    }

    setLoading(true);
    try {
      const result = await postSignUp({
        email: email.trim(),
        password,
        full_name: trimmedName,
        preferred_locale: locale,
        turnstileToken,
      });
      if (!result.ok) {
        setFailedAttempts((n) => n + 1);
        setRequiresCaptcha(Boolean(result.requiresCaptcha));
        setMessage(result.error);
        setTurnstileToken(undefined);
        return;
      }
      saveAppLocale(locale);
      setFailedAttempts(0);
      if (!result.needsEmailConfirmation) {
        markSessionAnchorNow();
        router.push(afterAuthPath);
        router.refresh();
        return;
      }
      setMessage(SIGN_UP_GENERIC_MSG);
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
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: { shouldCreateUser: true },
      });
      if (error) {
        setMessage(translateAuthError(error.message, "otp"));
        return;
      }
      setOtpSent(true);
      setMessage("Если номер подходит, код отправлен по SMS.");
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
        setMessage(translateAuthError(error.message, "otp"));
        return;
      }
      markSessionAnchorNow();
      router.push(afterAuthPath);
      router.refresh();
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
        options: { redirectTo: buildOAuthRedirect(origin, afterAuthPath) },
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
        setMessage(payload?.error ?? "Не удалось зарегистрироваться через Telegram.");
        return;
      }
      router.push(afterAuthPath);
      router.refresh();
    } finally {
      setOauthLoading(null);
    }
  }

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "";

  return (
    <AuthScreenShell
      title="Регистрация"
      subtitle="Создайте аккаунт врача для web и mobile SonoGyn Pro."
      emailTab={
        <form className="space-y-4" onSubmit={(e) => void onEmailRegister(e)}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Язык интерфейса</span>
            <select
              className={authInputClass}
              value={locale}
              onChange={(e) => setLocale(e.target.value as AppLocale)}
              aria-label="Язык интерфейса"
            >
              {APP_LOCALES.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Базовый язык — русский. Можно сменить позже в профиле.</p>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">ФИО врача</span>
            <input
              className={authInputClass}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={PRODUCT_OWNER_FIO}
              required
              autoComplete="name"
              aria-label="ФИО врача"
            />
            <p className="mt-1 text-xs text-slate-500">
              Сначала фамилия. В кабинете:{" "}
              <span className="font-semibold text-[var(--clinical-primary-deep)]">
                {fullName.trim()
                  ? buildFioAbbreviation(normalizeRussianFio(fullName)) ?? "—"
                  : PRODUCT_OWNER_FIO_SHORT}
              </span>
            </p>
          </label>
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
              minLength={6}
              aria-label="Пароль"
            />
          </label>
          {message ? (
            <AuthMessage
              message={message}
              tone={message === SIGN_UP_GENERIC_MSG ? "success" : "error"}
            />
          ) : null}
          {showCaptcha ? (
            <TurnstileWidget onToken={(t) => setTurnstileToken(t)} onExpire={() => setTurnstileToken(undefined)} />
          ) : null}
          <Button className="w-full rounded-2xl py-6" type="submit" disabled={loading} aria-label="Зарегистрироваться">
            {loading ? "Создаём…" : "Зарегистрироваться"}
          </Button>
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
              <Button className="w-full rounded-2xl py-6" type="submit" disabled={loading} aria-label="Подтвердить">
                {loading ? "Проверяем…" : "Подтвердить"}
              </Button>
            </>
          )}
          {message ? <AuthMessage message={message} tone={message.includes("отправлен") ? "success" : "error"} /> : null}
        </form>
      }
      socialTab={
        <div className="space-y-4">
          <AuthButtons onProviderPress={(p) => void onOAuth(p)} loading={oauthLoading} variant="register" />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-3 text-center text-sm font-medium text-slate-700 dark:text-slate-200">Telegram Login Widget</p>
            <TelegramLoginButton
              botUsername={botUsername}
              onAuth={(user) => void onTelegramAuth(user as unknown as Record<string, unknown>)}
              onError={setMessage}
            />
          </div>
          {message ? <AuthMessage message={message} /> : null}
        </div>
      }
      footer={
        <>
          <p className="mt-6 text-center text-sm text-[var(--clinical-foreground-muted)]">
            Уже есть аккаунт?{" "}
            <Link className="font-bold text-[var(--clinical-primary-deep)] hover:underline" href="/login">
              Войти
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

export default function RegisterPage() {
  return (
    <main className="sonogyn-auth-shell sonogyn-mesh-bg">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-12 text-center text-sm text-[var(--clinical-foreground-muted)]">
            Загрузка…
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </main>
  );
}
