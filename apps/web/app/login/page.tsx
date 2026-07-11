"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers";
import { AuthMessage, AuthScreenShell, authInputClass } from "@/components/auth/AuthScreenShell";
import { AuthSetupBanner } from "@/components/auth/AuthSetupBanner";
import { PhoneAuthSetupHint } from "@/components/auth/PhoneAuthSetupHint";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { RussianIdpPanel } from "@/components/auth/RussianIdpPanel";
import { SocialAuthSetupHint } from "@/components/auth/SocialAuthSetupHint";
import { TelegramSimpleAuth } from "@/components/auth/TelegramSimpleAuth";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { Button } from "@/components/ui/button";
import { normalizePhone } from "@/lib/auth/oauth-providers";
import { looksLikePhoneInput, USE_PHONE_TAB_MSG } from "@/lib/auth/auth-error-text";
import { postForgotPassword, postMfaVerifyLogin, postPhoneSendOtp, postPhoneVerifyOtp, postSendCode, postSignIn, postTelegramVerifyOtp } from "@/lib/auth/client-auth-api";
import { CAPTCHA_FAILURE_THRESHOLD } from "@/lib/auth/auth-attempts";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";
import { parseRegistrationMethod, readTelegramBotDisplayName, type AuthRegistrationMethod } from "@/lib/auth/registration-methods";
import { isAuthEmailOnlyClient } from "@/lib/auth/auth-methods-config";
import { isPilotClosedAccessClient, isPilotTelegramPrimary, PILOT_AUTH_SUBTITLE } from "@/lib/auth/auth-pilot-config";
import { RU_IDP_SUBTITLE } from "@/lib/auth/russian-idp";
import { isRuPhoneMaskComplete } from "@/lib/auth/ru-phone-mask";
import {
  EMAIL_NOT_CONFIRMED_MSG,
  PASSWORD_RESET_GENERIC_MSG,
  PHONE_OTP_DELAY_HINT,
  PHONE_OTP_SENT_MSG,
  requireOnlineForAuth,
  translateAuthError,
} from "@/lib/auth/translate-auth-error";
import { telegramAuthErrorMessage } from "@/lib/auth/telegram-widget";
import { safeInternalPath } from "@/lib/nav/safe-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh, user, ready } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [fallbackEmailPhone, setFallbackEmailPhone] = useState("");
  const [fallbackEmailTelegram, setFallbackEmailTelegram] = useState("");
  const [backupPhoneTelegram, setBackupPhoneTelegram] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [needsPhoneRegistration, setNeedsPhoneRegistration] = useState(false);
  const [needsTelegramRegistration, setNeedsTelegramRegistration] = useState(false);
  const [smsNotConfigured, setSmsNotConfigured] = useState(false);
  const [sendCooldownSec, setSendCooldownSec] = useState(0);

  const defaultTab = useMemo(
    () => parseRegistrationMethod(searchParams.get("method")),
    [searchParams],
  );
  const [activeTab, setActiveTab] = useState<AuthRegistrationMethod>(defaultTab);

  const nextPath = safeInternalPath(searchParams.get("redirectedFrom"), "/app");
  const authCallbackError = searchParams.get("error") === "auth_callback";
  const telegramBotName = readTelegramBotDisplayName();
  const simpleTelegramLogin = isPilotTelegramPrimary() || isPilotClosedAccessClient();
  const telegramWidgetMessage =
    searchParams.get("telegram_message")?.trim() ||
    telegramAuthErrorMessage(searchParams.get("telegram_error"));

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(nextPath);
    router.refresh();
  }, [ready, user, router, nextPath]);

  useEffect(() => {
    if (searchParams.get("message") === "password_updated") {
      setMessage("Пароль обновлён. Войдите с новым паролем.");
    }
  }, [searchParams]);

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
      setMessage(
        searchParams.get("oauth_message") ||
          "Вход через Google/VK отключён. Используйте SMS (+7), Яндекс ID, Telegram или почту.",
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
    setNeedsTelegramRegistration(false);
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

  async function onSendTelegramOtp() {
    setMessage("");
    if (!guardOnline()) return;
    if (sendCooldownSec > 0) return;

    const chatId = telegramChatId.trim();
    if (!/^\d{5,20}$/.test(chatId)) {
      setMessage("Укажите числовой Telegram ID (5–20 цифр). Узнать: @userinfobot.");
      return;
    }

    setLoading(true);
    try {
      const result = await postSendCode({
        method: "telegram",
        contact: chatId,
        purpose: "login",
        turnstileToken,
        idempotencyKey: crypto.randomUUID(),
        fallbackEmail: fallbackEmailTelegram.trim() || email.trim() || undefined,
        backupPhone: isRuPhoneMaskComplete(backupPhoneTelegram)
          ? normalizePhone(backupPhoneTelegram)
          : undefined,
      });
      if (!result.ok) {
        setRequiresCaptcha(Boolean(result.requiresCaptcha));
        setFailedAttempts((n) => n + 1);
        setMessage(result.error);
        setTurnstileToken(undefined);
        return;
      }
      setNeedsTelegramRegistration(false);
      setFailedAttempts(0);
      setOtpSent(true);
      setSendCooldownSec(30);
      setOtp("");
      setMessage(result.message ?? "Код отправлен в Telegram.");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyTelegramOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!guardOnline()) return;

    const chatId = telegramChatId.trim();
    setLoading(true);
    try {
      const result = await postTelegramVerifyOtp({ chatId, token: otp.trim(), createUser: false });
      if (!result.ok) {
        setNeedsTelegramRegistration(Boolean(result.needsRegistration));
        setMessage(result.error);
        return;
      }
      setNeedsTelegramRegistration(false);
      markSessionAnchorNow();
      window.location.assign(nextPath);
    } finally {
      setLoading(false);
    }
  }

  async function onSendOtp() {
    setMessage("");
    if (!guardOnline()) return;
    if (sendCooldownSec > 0) return;

    if (!isRuPhoneMaskComplete(phone)) {
      setMessage("Укажите полный номер РФ: +7 и 10 цифр. Для других стран — вкладка Telegram.");
      return;
    }

    const normalized = normalizePhone(phone);
    setLoading(true);
    try {
      const result = await postPhoneSendOtp({
        phone: normalized,
        turnstileToken,
        idempotencyKey: crypto.randomUUID(),
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
      setOtp("");
      setMessage(result.message ?? PHONE_OTP_SENT_MSG);
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
      const result = await postForgotPassword(email.trim());
      setMessage(result.ok ? result.message : PASSWORD_RESET_GENERIC_MSG);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenShell
      title="Вход"
      subtitle={
        isAuthEmailOnlyClient()
          ? "Email и пароль — один аккаунт для web и mobile."
          : isPilotClosedAccessClient()
            ? PILOT_AUTH_SUBTITLE
            : isPilotTelegramPrimary()
              ? PILOT_AUTH_SUBTITLE
              : RU_IDP_SUBTITLE
      }
      defaultTab={defaultTab}
      onTabChange={onTabChange}
      showMethodHints
      socialTab={
        !isAuthEmailOnlyClient() && !isPilotClosedAccessClient() ? (
          <div className="space-y-4">
            <RussianIdpPanel variant="login" nextPath={nextPath} />
            <SocialAuthSetupHint showRussianIdp />
            {authCallbackError ? <SocialAuthSetupHint showGoogle /> : null}
          </div>
        ) : undefined
      }
      telegramTab={
        simpleTelegramLogin ? (
          <div className="space-y-4">
            <TelegramSimpleAuth
              mode="login"
              nextPath={nextPath}
              message={telegramWidgetMessage || (message && activeTab === "telegram" ? message : undefined)}
            />
            <details className="rounded-2xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                <summary className="cursor-pointer font-medium text-slate-600 dark:text-slate-300">
                  Вход по коду (если кнопка Telegram не работает)
                </summary>
                <form className="mt-4 space-y-4" onSubmit={(e) => void onVerifyTelegramOtp(e)}>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Telegram ID</span>
                    <input
                      className={authInputClass}
                      inputMode="numeric"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="310996807"
                      required
                      aria-label="Telegram ID"
                    />
                  </label>
                  {!otpSent ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-2xl"
                      disabled={loading || sendCooldownSec > 0}
                      onClick={() => void onSendTelegramOtp()}
                    >
                      Получить код в Telegram
                    </Button>
                  ) : (
                    <>
                      <input
                        className={authInputClass}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        required
                        aria-label="Код из Telegram"
                      />
                      <Button className="w-full rounded-2xl" type="submit" disabled={loading}>
                        {loading ? "Проверяем…" : "Войти"}
                      </Button>
                    </>
                  )}
                </form>
              </details>
            {needsTelegramRegistration && activeTab === "telegram" ? (
              <p className="text-center text-sm text-[var(--clinical-foreground-muted)]">
                <Link className="font-bold text-[var(--clinical-primary-deep)] hover:underline" href="/register?method=telegram">
                  Зарегистрироваться через Telegram
                </Link>
              </p>
            ) : null}
          </div>
        ) : (
        <form className="space-y-4" onSubmit={(e) => void onVerifyTelegramOtp(e)}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Telegram ID</span>
            <input
              className={authInputClass}
              inputMode="numeric"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="310996807"
              required
              aria-label="Telegram ID"
            />
            <p className="mt-1 text-xs text-slate-500">
              Сначала откройте {telegramBotName} и нажмите Start. ID узнайте у @userinfobot.{" "}
              <Link href="/register?method=telegram" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
                Регистрация через Telegram
              </Link>
            </p>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Email для резервной отправки кода
            </span>
            <input
              className={authInputClass}
              type="email"
              value={fallbackEmailTelegram}
              onChange={(e) => setFallbackEmailTelegram(e.target.value)}
              placeholder="doctor@example.com"
              autoComplete="email"
              aria-label="Email для резервной отправки кода"
            />
            <p className="mt-1 text-xs text-slate-500">Если Telegram недоступен — код придёт на почту.</p>
          </label>
          <PhoneInput
            id="telegram-backup-phone"
            value={backupPhoneTelegram}
            onChange={setBackupPhoneTelegram}
            disabled={loading}
          />
          <p className="-mt-1 text-xs text-slate-500">
            Необязательно: тот же код продублируем по SMS на +7 (обычно за секунды).
          </p>
          {!otpSent ? (
            <Button
              type="button"
              className="w-full rounded-2xl py-6"
              disabled={loading || sendCooldownSec > 0}
              onClick={() => void onSendTelegramOtp()}
              aria-label="Получить код в Telegram"
            >
              {loading
                ? "Отправляем…"
                : sendCooldownSec > 0
                  ? `Повтор через ${sendCooldownSec} с`
                  : "Получить код в Telegram"}
            </Button>
          ) : (
            <>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Код из Telegram</span>
                <input
                  className={authInputClass}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  aria-label="Код из Telegram"
                />
              </label>
              <Button className="w-full rounded-2xl py-6" type="submit" disabled={loading} aria-label="Войти">
                {loading ? "Проверяем…" : "Войти"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-2xl"
                disabled={loading || sendCooldownSec > 0}
                onClick={() => void onSendTelegramOtp()}
              >
                {loading
                  ? "Отправляем…"
                  : sendCooldownSec > 0
                    ? `Повтор через ${sendCooldownSec} с`
                    : "Отправить код повторно"}
              </Button>
            </>
          )}
          {message && activeTab === "telegram" ? (
            <AuthMessage
              message={message}
              tone={
                /код\s+отправлен/i.test(message) || /код\s+готов/i.test(message)
                  ? "success"
                  : "error"
              }
            />
          ) : null}
          {needsTelegramRegistration && activeTab === "telegram" ? (
            <p className="text-center text-sm text-[var(--clinical-foreground-muted)]">
              <Link className="font-bold text-[var(--clinical-primary-deep)] hover:underline" href="/register?method=telegram">
                Зарегистрироваться через Telegram
              </Link>
            </p>
          ) : null}
          {showCaptcha && activeTab === "telegram" ? (
            <TurnstileWidget onToken={(t) => setTurnstileToken(t)} onExpire={() => setTurnstileToken(undefined)} />
          ) : null}
        </form>
        )
      }
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
          <PhoneInput
            id="login-phone"
            value={phone}
            onChange={setPhone}
            disabled={loading}
          />
          <p className="-mt-1 text-xs text-slate-500">
            {PHONE_OTP_DELAY_HINT} Нет аккаунта?{" "}
            <Link href="/register?method=phone" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
              Регистрация по SMS
            </Link>
          </p>
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
              tone={message === PHONE_OTP_SENT_MSG || message.includes("отправлен") || message.includes("SMS") ? "success" : "error"}
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
      footer={
        <>
          <p className="mt-6 text-center text-sm text-[var(--clinical-foreground-muted)]">
            Нет аккаунта?{" "}
            <Link className="font-bold text-[var(--clinical-primary-deep)] hover:underline" href="/register">
              Зарегистрироваться
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            {!isAuthEmailOnlyClient() && !isPilotClosedAccessClient() ? (
              <>
            <Link href="/login?method=phone" className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:underline dark:bg-slate-800 dark:text-slate-300">
              SMS
            </Link>
            <Link href="/login?method=social" className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:underline dark:bg-slate-800 dark:text-slate-300">
              Яндекс ID
            </Link>
            <Link href="/login?method=telegram" className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:underline dark:bg-slate-800 dark:text-slate-300">
              Telegram
            </Link>
            <Link href="/login?method=email" className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:underline dark:bg-slate-800 dark:text-slate-300">
              Email
            </Link>
              </>
            ) : null}
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
