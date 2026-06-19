"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { AuthProvider } from "@repo/ui";
import { AuthButtons } from "@repo/ui";

import { useAuth, useSupabase } from "@/app/providers";
import { AuthMessage, AuthScreenShell, authInputClass } from "@/components/auth/AuthScreenShell";
import { AuthSetupBanner } from "@/components/auth/AuthSetupBanner";
import { DevPhoneOtpBanner } from "@/components/auth/DevPhoneOtpBanner";
import { PhoneAuthSetupHint } from "@/components/auth/PhoneAuthSetupHint";
import { SocialAuthSetupHint } from "@/components/auth/SocialAuthSetupHint";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { Button } from "@/components/ui/button";
import { buildOAuthRedirect, normalizePhone, oauthProviderToSupabase } from "@/lib/auth/oauth-providers";
import { looksLikePhoneInput, USE_PHONE_TAB_MSG } from "@/lib/auth/auth-error-text";
import { postSignIn, postMfaVerifyLogin, postPhoneSendOtp, postPhoneVerifyOtp } from "@/lib/auth/client-auth-api";
import { CAPTCHA_FAILURE_THRESHOLD } from "@/lib/auth/auth-attempts";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";
import { parseRegistrationMethod, type AuthRegistrationMethod } from "@/lib/auth/registration-methods";
import {
  EMAIL_NOT_CONFIRMED_MSG,
  PASSWORD_RESET_GENERIC_MSG,
  PHONE_OTP_SENT_MSG,
  requireOnlineForAuth,
  translateAuthError,
} from "@/lib/auth/translate-auth-error";
import { safeInternalPath } from "@/lib/nav/safe-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const { refresh, user, ready } = useAuth();

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
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [needsPhoneRegistration, setNeedsPhoneRegistration] = useState(false);
  const [smsNotConfigured, setSmsNotConfigured] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [sendCooldownSec, setSendCooldownSec] = useState(0);

  const defaultTab = useMemo(
    () => parseRegistrationMethod(searchParams.get("method")),
    [searchParams],
  );
  const [activeTab, setActiveTab] = useState<AuthRegistrationMethod>(defaultTab);

  const nextPath = safeInternalPath(searchParams.get("redirectedFrom"), "/app");
  const authCallbackError = searchParams.get("error") === "auth_callback";

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(nextPath);
    router.refresh();
  }, [ready, user, router, nextPath]);

  useEffect(() => {
    if (searchParams.get("dev_setup") === "service_role") {
      setMessage(
        "Автовход: добавьте SUPABASE_SERVICE_ROLE_KEY в apps/web/.env.local (Supabase → Settings → API → service_role), затем npm run setup:dev-login. Пока войдите email + пароль вручную.",
      );
    }
    if (searchParams.get("dev_setup") === "failed") {
      setMessage(
        "Автовход не удался. Выполните npm run setup:dev-login или войдите вручную: yakubovr564@gmail.com",
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (authCallbackError) {
      const oauthMsg = searchParams.get("oauth_message");
      setMessage(
        oauthMsg?.includes("redirect") || oauthMsg?.includes("OAuth")
          ? "Google: ошибка redirect_uri. Добавьте callback Supabase в Google Cloud (см. подсказку ниже)."
          : oauthMsg ||
            "OAuth не завершился. Проверьте Google redirect URI и Supabase Site URL (https://sonogyn-pro.ru).",
      );
    }
  }, [authCallbackError, searchParams]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (sendCooldownSec <= 0) return;
    const timer = setInterval(() => {
      setSendCooldownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [sendCooldownSec]);

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

  function onTabChange(tab: AuthRegistrationMethod) {
    setActiveTab(tab);
    setMessage("");
    setOtpSent(false);
    setOtp("");
    setTurnstileToken(undefined);
    setNeedsEmailConfirmation(false);
    setNeedsPhoneRegistration(false);
    setSmsNotConfigured(false);
  }

  async function onEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!guardOnline()) return;

    if (looksLikePhoneInput(email)) {
      setMessage(USE_PHONE_TAB_MSG);
      return;
    }

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
        setNeedsEmailConfirmation(Boolean(result.needsEmailConfirmation));
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
    if (sendCooldownSec > 0) return;

    const normalized = normalizePhone(phone);
    setLoading(true);
    try {
      const result = await postPhoneSendOtp({
        phone: normalized,
        turnstileToken,
        idempotencyKey,
        fallbackEmail: fallbackEmailPhone.trim() || email.trim() || undefined,
      });
      if (!result.ok) {
        setRequiresCaptcha(Boolean(result.requiresCaptcha));
        setFailedAttempts((n) => n + 1);
        setNeedsPhoneRegistration(Boolean(result.needsRegistration));
        setSmsNotConfigured(Boolean(result.smsNotConfigured));
        setMessage(result.error);
        setTurnstileToken(undefined);
        return;
      }
      setNeedsPhoneRegistration(false);
      setSmsNotConfigured(false);
      setFailedAttempts(0);
      setOtpSent(true);
      setSendCooldownSec(30);
      const code = result.devOtp ?? "123456";
      setDevOtpCode(code);
      setOtp(code);
      setMessage("Код готов — введите ниже (на телефон локально не приходит).");
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
        setNeedsPhoneRegistration(Boolean(result.needsRegistration));
        setSmsNotConfigured(Boolean(result.smsNotConfigured));
        setMessage(result.error);
        return;
      }
      setNeedsPhoneRegistration(false);
      setSmsNotConfigured(false);
      markSessionAnchorNow();
      window.location.assign(nextPath);
      return;
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

  async function onOAuth(provider: Exclude<AuthProvider, "telegram">) {
    setMessage("");
    if (!guardOnline()) return;

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

  return (
    <AuthScreenShell
      title="Вход"
      subtitle="Email, SMS или Google — один аккаунт для web и mobile."
      defaultTab={defaultTab}
      onTabChange={onTabChange}
      showMethodHints
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
        <>
          <AuthSetupBanner />
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
              data-testid="email-input"
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
              data-testid="password-input"
            />
          </label>
          {message ? <AuthMessage message={message} tone="error" /> : null}
          {needsEmailConfirmation ? (
            <p className="text-center text-sm text-[var(--clinical-foreground-muted)]">
              {EMAIL_NOT_CONFIRMED_MSG}{" "}
              <Link className="font-bold text-[var(--clinical-primary-deep)] hover:underline" href="/register">
                Отправить письмо повторно
              </Link>
            </p>
          ) : null}
          {showCaptcha ? (
            <TurnstileWidget onToken={(t) => setTurnstileToken(t)} onExpire={() => setTurnstileToken(undefined)} />
          ) : null}
          <Button className="w-full rounded-2xl py-6" type="submit" disabled={loading} aria-label="Войти" data-testid="login-button">
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
        </>
        )
      }
      phoneTab={
        <form className="space-y-4" onSubmit={(e) => void onVerifyOtp(e)}>
          <PhoneAuthSetupHint visible={smsNotConfigured} />
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
              Локально код <strong>123456</strong>. Нет аккаунта?{" "}
              <Link href="/register?method=phone" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
                Регистрация по SMS
              </Link>
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
            <p className="mt-1 text-xs text-slate-500">Если SMS недоступен — код придёт на почту.</p>
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
              <Button className="w-full rounded-2xl py-6" type="submit" disabled={loading} aria-label="Подтвердить код">
                {loading ? "Проверяем…" : "Войти"}
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
            <AuthMessage
              message={message}
              tone={message === PHONE_OTP_SENT_MSG || message.includes("отправлен") ? "success" : "error"}
            />
          ) : null}
          {needsPhoneRegistration && activeTab === "phone" ? (
            <p className="text-center text-sm text-[var(--clinical-foreground-muted)]">
              <Link className="font-bold text-[var(--clinical-primary-deep)] hover:underline" href="/register?method=phone">
                Зарегистрироваться по номеру телефона
              </Link>
            </p>
          ) : null}
          {showCaptcha && activeTab === "phone" ? (
            <TurnstileWidget onToken={(t) => setTurnstileToken(t)} onExpire={() => setTurnstileToken(undefined)} />
          ) : null}
        </form>
      }
      socialTab={
        <div className="space-y-4">
          <SocialAuthSetupHint showGoogle={authCallbackError} />
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Вход через Google-аккаунт. После подтверждения вернётесь в кабинет.
          </p>
          <AuthButtons
            providers={["google"]}
            onProviderPress={(p) => {
              if (p === "google") void onOAuth(p);
            }}
            loading={oauthLoading}
            variant="login"
          />
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
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <Link href="/login?method=email" className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:underline dark:bg-slate-800 dark:text-slate-300">
              Email
            </Link>
            <Link href="/login?method=phone" className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:underline dark:bg-slate-800 dark:text-slate-300">
              SMS
            </Link>
            <Link href="/register?method=social" className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:underline dark:bg-slate-800 dark:text-slate-300">
              Google
            </Link>
          </div>
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
