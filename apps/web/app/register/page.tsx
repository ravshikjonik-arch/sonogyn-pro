"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { AuthProvider } from "@repo/ui";
import { AuthButtons } from "@repo/ui";

import { useSupabase } from "@/app/providers";
import { AuthMessage, AuthScreenShell, authInputClass } from "@/components/auth/AuthScreenShell";
import { DoctorRegistrationFields } from "@/components/auth/DoctorRegistrationFields";
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { Button } from "@/components/ui/button";
import { CAPTCHA_FAILURE_THRESHOLD } from "@/lib/auth/auth-attempts";
import {
  postPhoneSendOtp,
  postPhoneVerifyOtp,
  postResendConfirmation,
  postSignUp,
} from "@/lib/auth/client-auth-api";
import {
  PRODUCT_OWNER_FIO,
  PRODUCT_OWNER_FIO_SHORT,
} from "@/lib/auth/doctor-display";
import { buildOAuthRedirect, normalizePhone, oauthProviderToSupabase } from "@/lib/auth/oauth-providers";
import { parseRegistrationMethod, type AuthRegistrationMethod } from "@/lib/auth/registration-methods";
import {
  PHONE_OTP_SENT_MSG,
  requireOnlineForAuth,
  RESEND_CONFIRMATION_MSG,
  SIGN_UP_GENERIC_MSG,
  translateAuthError,
} from "@/lib/auth/translate-auth-error";
import { readAppLocale, saveAppLocale, type AppLocale } from "@/lib/i18n/locale";
import { safeInternalPath } from "@/lib/nav/safe-redirect";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();

  const defaultTab = useMemo(
    () => parseRegistrationMethod(searchParams.get("method")),
    [searchParams],
  );

  const [activeTab, setActiveTab] = useState<AuthRegistrationMethod>(defaultTab);
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
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState(false);

  const afterAuthPath = safeInternalPath(searchParams.get("next"), "/app");

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

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

  const validateDoctorName = useCallback(() => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setMessage(
        `Укажите ФИО: сначала фамилия — например, ${PRODUCT_OWNER_FIO} → в кабинете «${PRODUCT_OWNER_FIO_SHORT}».`,
      );
      return null;
    }
    return trimmedName;
  }, [fullName]);

  function onTabChange(tab: AuthRegistrationMethod) {
    setActiveTab(tab);
    setMessage("");
    setPendingEmailConfirmation(false);
    setOtpSent(false);
    setOtp("");
    setTurnstileToken(undefined);
  }

  async function onEmailRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!guardOnline()) return;

    const trimmedName = validateDoctorName();
    if (!trimmedName) return;

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
      setPendingEmailConfirmation(true);
      setMessage(result.message ?? SIGN_UP_GENERIC_MSG);
    } finally {
      setLoading(false);
    }
  }

  async function onResendConfirmation() {
    setMessage("");
    if (!guardOnline()) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage("Укажите email для повторной отправки.");
      return;
    }

    setLoading(true);
    try {
      const result = await postResendConfirmation({ email: trimmedEmail, turnstileToken });
      if (!result.ok) {
        setRequiresCaptcha(Boolean(result.requiresCaptcha));
        setMessage(result.error);
        setTurnstileToken(undefined);
        return;
      }
      setPendingEmailConfirmation(true);
      setMessage(result.message ?? RESEND_CONFIRMATION_MSG);
    } finally {
      setLoading(false);
    }
  }

  async function onSendOtp() {
    setMessage("");
    if (!guardOnline()) return;

    const trimmedName = validateDoctorName();
    if (!trimmedName) return;

    const normalized = normalizePhone(phone);
    setLoading(true);
    try {
      const result = await postPhoneSendOtp({
        phone: normalized,
        createUser: true,
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
      setFailedAttempts(0);
      setOtpSent(true);
      setMessage(result.message ?? PHONE_OTP_SENT_MSG);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!guardOnline()) return;

    const trimmedName = validateDoctorName();
    if (!trimmedName) return;

    const normalized = normalizePhone(phone);
    setLoading(true);
    try {
      const result = await postPhoneVerifyOtp({
        phone: normalized,
        token: otp.trim(),
        full_name: trimmedName,
        preferred_locale: locale,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      saveAppLocale(locale);
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
  const isSuccessMessage =
    message === SIGN_UP_GENERIC_MSG ||
    message === RESEND_CONFIRMATION_MSG ||
    message === PHONE_OTP_SENT_MSG ||
    message.includes("отправлен");

  return (
    <AuthScreenShell
      title="Регистрация"
      subtitle="Выберите удобный способ: email, SMS или соцсеть. Все пути ведут в один кабинет врача."
      defaultTab={defaultTab}
      onTabChange={onTabChange}
      showMethodHints
      emailTab={
        <form className="space-y-4" onSubmit={(e) => void onEmailRegister(e)}>
          <DoctorRegistrationFields
            fullName={fullName}
            onFullNameChange={setFullName}
            locale={locale}
            onLocaleChange={setLocale}
          />
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
            <input
              className={authInputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
              required
              autoComplete="email"
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
              autoComplete="new-password"
              aria-label="Пароль"
            />
          </label>
          {message && activeTab === "email" ? (
            <AuthMessage message={message} tone={isSuccessMessage ? "success" : "error"} />
          ) : null}
          {pendingEmailConfirmation && activeTab === "email" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              <p className="font-medium">Подтвердите email</p>
              <p className="mt-1 text-emerald-800 dark:text-emerald-200">
                Откройте письмо и перейдите по ссылке. Адрес приложения:{" "}
                <span className="font-mono text-xs">
                  {typeof window !== "undefined" ? window.location.origin : "…"}
                </span>
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full rounded-2xl"
                disabled={loading}
                onClick={() => void onResendConfirmation()}
              >
                {loading ? "Отправляем…" : "Отправить письмо повторно"}
              </Button>
            </div>
          ) : null}
          {showCaptcha && activeTab === "email" ? (
            <TurnstileWidget onToken={(t) => setTurnstileToken(t)} onExpire={() => setTurnstileToken(undefined)} />
          ) : null}
          <Button className="w-full rounded-2xl py-6" type="submit" disabled={loading} aria-label="Зарегистрироваться">
            {loading ? "Создаём…" : "Зарегистрироваться по email"}
          </Button>
        </form>
      }
      phoneTab={
        <form className="space-y-4" onSubmit={(e) => void onVerifyOtp(e)}>
          <DoctorRegistrationFields
            fullName={fullName}
            onFullNameChange={setFullName}
            locale={locale}
            onLocaleChange={setLocale}
          />
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Телефон</span>
            <input
              className={authInputClass}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+79001234567"
              required
              autoComplete="tel"
              aria-label="Номер телефона"
            />
            <p className="mt-1 text-xs text-slate-500">Формат: +7 и 10 цифр. SMS приходит за ~30 секунд.</p>
          </label>
          {!otpSent ? (
            <Button
              type="button"
              className="w-full rounded-2xl py-6"
              disabled={loading}
              onClick={() => void onSendOtp()}
              aria-label="Получить код"
            >
              {loading ? "Отправляем…" : "Получить SMS-код"}
            </Button>
          ) : (
            <>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Код из SMS</span>
                <input
                  className={authInputClass}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  aria-label="Код из SMS"
                />
              </label>
              <Button className="w-full rounded-2xl py-6" type="submit" disabled={loading} aria-label="Подтвердить">
                {loading ? "Проверяем…" : "Подтвердить и войти"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-2xl"
                disabled={loading}
                onClick={() => void onSendOtp()}
              >
                {loading ? "Отправляем…" : "Отправить код повторно"}
              </Button>
            </>
          )}
          {message && activeTab === "phone" ? (
            <AuthMessage message={message} tone={isSuccessMessage ? "success" : "error"} />
          ) : null}
          {showCaptcha && activeTab === "phone" ? (
            <TurnstileWidget onToken={(t) => setTurnstileToken(t)} onExpire={() => setTurnstileToken(undefined)} />
          ) : null}
        </form>
      }
      socialTab={
        <div className="space-y-4">
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            ФИО подтянется из Google или Telegram. При необходимости отредактируйте в профиле после входа.
          </p>
          <AuthButtons onProviderPress={(p) => void onOAuth(p)} loading={oauthLoading} variant="register" />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-3 text-center text-sm font-medium text-slate-700 dark:text-slate-200">Telegram Login Widget</p>
            <TelegramLoginButton
              botUsername={botUsername}
              onAuth={(user) => void onTelegramAuth(user as unknown as Record<string, unknown>)}
              onError={setMessage}
            />
          </div>
          {message && activeTab === "social" ? <AuthMessage message={message} /> : null}
        </div>
      }
      footer={
        <>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
            <Link
              href="/register?method=email"
              className={`rounded-full px-3 py-1 ${activeTab === "email" ? "bg-[var(--clinical-primary-deep)] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              Email
            </Link>
            <Link
              href="/register?method=phone"
              className={`rounded-full px-3 py-1 ${activeTab === "phone" ? "bg-[var(--clinical-primary-deep)] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              SMS
            </Link>
            <Link
              href="/register?method=social"
              className={`rounded-full px-3 py-1 ${activeTab === "social" ? "bg-[var(--clinical-primary-deep)] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              Соцсети
            </Link>
          </div>
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
