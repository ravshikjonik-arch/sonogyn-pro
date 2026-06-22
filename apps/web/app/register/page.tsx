"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { AuthProvider } from "@repo/ui";
import { AuthButtons } from "@repo/ui";

import { useSupabase, useAuth } from "@/app/providers";
import { AuthMessage, AuthScreenShell, authInputClass } from "@/components/auth/AuthScreenShell";
import { RegisterCareerTeaser } from "@/components/auth/RegisterCareerTeaser";
import { AuthSetupBanner } from "@/components/auth/AuthSetupBanner";
import { EmailRegistrationHint } from "@/components/auth/EmailRegistrationHint";
import { PhoneAuthSetupHint } from "@/components/auth/PhoneAuthSetupHint";
import { DevPhoneOtpBanner } from "@/components/auth/DevPhoneOtpBanner";
import {
  birthDateErrorMessage,
  DoctorRegistrationFields,
  validateDoctorBirthDate,
} from "@/components/auth/DoctorRegistrationFields";
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
import { looksLikePhoneInput, USE_PHONE_TAB_MSG } from "@/lib/auth/auth-error-text";
import { buildOAuthRedirect, normalizePhone, oauthProviderToSupabase } from "@/lib/auth/oauth-providers";
import { parseRegistrationMethod, type AuthRegistrationMethod } from "@/lib/auth/registration-methods";
import { isAuthEmailOnlyClient } from "@/lib/auth/auth-methods-config";
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
  const { refresh } = useAuth();

  const defaultTab = useMemo(
    () => parseRegistrationMethod(searchParams.get("method")),
    [searchParams],
  );

  const [activeTab, setActiveTab] = useState<AuthRegistrationMethod>(defaultTab);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [specialization, setSpecialization] = useState("Акушер-гинеколог");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fallbackEmailPhone, setFallbackEmailPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<AuthProvider | null>(null);
  const [locale, setLocale] = useState<AppLocale>(() => readAppLocale());
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState(false);
  const [smsNotConfigured, setSmsNotConfigured] = useState(false);
  const [sendCooldownSec, setSendCooldownSec] = useState(0);

  const afterAuthPath = safeInternalPath(searchParams.get("next"), "/app");

  useEffect(() => {
    if (sendCooldownSec <= 0) return;
    const timer = setInterval(() => {
      setSendCooldownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [sendCooldownSec]);

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
    setSmsNotConfigured(false);
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

    const parsedBirth = validateDoctorBirthDate(birthDate);
    if (!parsedBirth) {
      setMessage(birthDateErrorMessage());
      return;
    }

    if (!specialization.trim()) {
      setMessage("Выберите специализацию из списка.");
      return;
    }

    if (looksLikePhoneInput(email)) {
      setMessage(USE_PHONE_TAB_MSG);
      return;
    }

    setLoading(true);
    try {
      const result = await postSignUp({
        email: email.trim(),
        password,
        full_name: trimmedName,
        birth_year: parsedBirth.year,
        birth_date: parsedBirth.display,
        specialization: specialization.trim(),
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
      if (!result.needsEmailConfirmation || result.autoConfirmed) {
        markSessionAnchorNow();
        await refresh();
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
    if (sendCooldownSec > 0) return;

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
        idempotencyKey: crypto.randomUUID(),
        fallbackEmail: fallbackEmailPhone.trim() || email.trim() || undefined,
      });
      if (!result.ok) {
        setFailedAttempts((n) => n + 1);
        setRequiresCaptcha(Boolean(result.requiresCaptcha));
        setSmsNotConfigured(Boolean(result.smsNotConfigured));
        setMessage(result.error);
        setTurnstileToken(undefined);
        return;
      }
      setSmsNotConfigured(false);
      setFailedAttempts(0);
      setOtpSent(true);
      setSendCooldownSec(30);
      if (result.devOtp) {
        setDevOtpCode(result.devOtp);
        setOtp(result.devOtp);
        setMessage("Dev: код на экране (SMS mock, на телефон не приходит).");
      } else {
        setDevOtpCode("");
        setOtp("");
        setMessage(result.message ?? PHONE_OTP_SENT_MSG);
      }
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
        createUser: true,
        full_name: trimmedName,
        preferred_locale: locale,
      });
      if (!result.ok) {
        setSmsNotConfigured(Boolean(result.smsNotConfigured));
        setMessage(result.error);
        return;
      }
      saveAppLocale(locale);
      markSessionAnchorNow();
      window.location.assign(afterAuthPath);
      return;
    } finally {
      setLoading(false);
    }
  }

  async function onOAuth(provider: Exclude<AuthProvider, "telegram">) {
    setMessage("");
    if (!guardOnline()) return;

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

  const isSuccessMessage =
    message === SIGN_UP_GENERIC_MSG ||
    message === RESEND_CONFIRMATION_MSG ||
    message === PHONE_OTP_SENT_MSG ||
    message.includes("отправлен") ||
    message.includes("Код готов") ||
    message.includes("SMS") ||
    message.startsWith("Dev:");

  return (
    <AuthScreenShell
      title="Регистрация"
      subtitle="Шаг 1 · Студент — бесплатно. Дальше ординатор, врач и PRO."
      defaultTab={defaultTab}
      onTabChange={onTabChange}
      showMethodHints
      emailTab={
        <>
          <AuthSetupBanner />
          <EmailRegistrationHint />
          <RegisterCareerTeaser />
        <form className="space-y-4" onSubmit={(e) => void onEmailRegister(e)}>
          <DoctorRegistrationFields
            fullName={fullName}
            onFullNameChange={setFullName}
            birthDate={birthDate}
            onBirthDateChange={setBirthDate}
            specialization={specialization}
            onSpecializationChange={setSpecialization}
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
        </>
      }
      phoneTab={
        <form className="space-y-4" onSubmit={(e) => void onVerifyOtp(e)}>
          <PhoneAuthSetupHint visible={smsNotConfigured} />
          <DoctorRegistrationFields
            fullName={fullName}
            onFullNameChange={setFullName}
            birthDate={birthDate}
            onBirthDateChange={setBirthDate}
            specialization={specialization}
            onSpecializationChange={setSpecialization}
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
            <p className="mt-1 text-xs text-slate-500">
              Код придёт по SMS в течение минуты.
            </p>
          </label>
          {devOtpCode ? <DevPhoneOtpBanner code={devOtpCode} /> : null}
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Email для резервной отправки кода
            </span>
            <input
              className={authInputClass}
              type="email"
              value={fallbackEmailPhone}
              onChange={(e) => setFallbackEmailPhone(e.target.value)}
              placeholder="doctor@example.com"
              autoComplete="email"
              aria-label="Email для резервной отправки кода"
              data-testid="fallback-email-input"
            />
            <p className="mt-1 text-xs text-slate-500">
              Если SMS не дойдёт — код уйдёт на эту почту (152-ФЗ: только ваш адрес).
            </p>
          </label>
          {!otpSent ? (
            <Button
              type="button"
              className="w-full rounded-2xl py-6"
              disabled={loading || sendCooldownSec > 0}
              onClick={() => void onSendOtp()}
              aria-label="Получить код"
            >
              {loading
                ? "Отправляем…"
                : sendCooldownSec > 0
                  ? `Повтор через ${sendCooldownSec} с`
                  : "Получить SMS-код"}
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
                disabled={loading || sendCooldownSec > 0}
                onClick={() => void onSendOtp()}
              >
                {loading
                  ? "Отправляем…"
                  : sendCooldownSec > 0
                    ? `Повтор через ${sendCooldownSec} с`
                    : "Отправить код повторно"}
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
            Регистрация через Google. После подтверждения вернётесь в кабинет.
          </p>
          <AuthButtons
            providers={["google"]}
            onProviderPress={(p) => {
              if (p === "google") void onOAuth(p);
            }}
            loading={oauthLoading}
            variant="register"
          />
          {message && activeTab === "social" ? <AuthMessage message={message} /> : null}
        </div>
      }
      footer={
        <>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
            {!isAuthEmailOnlyClient() ? (
              <>
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
              Google
            </Link>
              </>
            ) : null}
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
