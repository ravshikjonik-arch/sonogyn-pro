"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers";
import { AuthMessage, authInputClass } from "@/components/auth/AuthScreenShell";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { TelegramSimpleAuth } from "@/components/auth/TelegramSimpleAuth";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { AuthWizardLayout } from "@/components/auth/wizard/AuthWizardLayout";
import { OtpDigitRow } from "@/components/auth/wizard/OtpDigitRow";
import { Button } from "@/components/ui/button";
import {
  postConfirmPasswordReset,
  postForgotPassword,
  postMfaVerifyLogin,
  postPhoneSendOtp,
  postPhoneVerifyOtp,
  postSignIn,
} from "@/lib/auth/client-auth-api";
import { isAuthEmailOnlyClient } from "@/lib/auth/auth-methods-config";
import { isFullOpenAccessEnabledClient } from "@/lib/auth/guest-demo-account";
import { normalizePhone } from "@/lib/auth/oauth-providers";
import {
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_PASSWORD_TOO_SHORT_MSG,
} from "@/lib/auth/password-policy";
import { isRuPhoneMaskComplete } from "@/lib/auth/ru-phone-mask";
import {
  PASSWORD_RESET_GENERIC_MSG,
  PHONE_OTP_DELAY_HINT,
  PHONE_OTP_SENT_MSG,
  requireOnlineForAuth,
} from "@/lib/auth/translate-auth-error";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";
import { cn } from "@/lib/utils/cn";

type LoginMethod = "email" | "phone" | "telegram";
type EmailStep = "login" | "reset";

type Props = {
  nextPath: string;
};

export function LoginAuthWizard({ nextPath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh, user, ready } = useAuth();
  const phoneAllowed = !isAuthEmailOnlyClient();

  const initialMethod = useMemo<LoginMethod>(() => {
    const m = searchParams.get("method");
    if (m === "telegram") return "telegram";
    if (m === "phone" && phoneAllowed) return "phone";
    return "email";
  }, [searchParams, phoneAllowed]);

  const [method, setMethod] = useState<LoginMethod>(initialMethod);
  const [emailStep, setEmailStep] = useState<EmailStep>("login");
  const [email, setEmail] = useState(() => searchParams.get("email")?.trim() ?? "");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [phone, setPhone] = useState("");
  const [fallbackEmail, setFallbackEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendCooldownSec, setSendCooldownSec] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());

  useEffect(() => {
    setMethod(initialMethod);
  }, [initialMethod]);

  useEffect(() => {
    const qEmail = searchParams.get("email")?.trim();
    if (qEmail) setEmail(qEmail);
    if (searchParams.get("forgot") === "1") {
      setEmailStep("reset");
      setMessage("Укажите email и нажмите «Получить код» — придёт 6 цифр на почту.");
    }
    if (searchParams.get("message") === "password_updated") {
      setEmailStep("login");
      setMessage("Пароль обновлён. Войдите новым паролем.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(nextPath);
    router.refresh();
  }, [ready, user, router, nextPath]);

  useEffect(() => {
    if (sendCooldownSec <= 0) return;
    const t = window.setTimeout(() => setSendCooldownSec((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [sendCooldownSec]);

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
      const result = await postSignIn({ email: email.trim(), password, turnstileToken });
      if (!result.ok) {
        setMessage(result.error);
        setTurnstileToken(undefined);
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

  async function onSendResetCode() {
    setMessage("");
    if (!guardOnline()) return;
    if (!email.trim()) {
      setMessage("Укажите email для восстановления пароля.");
      setEmailStep("reset");
      return;
    }
    if (sendCooldownSec > 0) return;

    setLoading(true);
    try {
      const result = await postForgotPassword(email.trim(), turnstileToken);
      setEmailStep("reset");
      setOtp("");
      setSendCooldownSec(30);
      setTurnstileToken(undefined);
      setMessage(
        result.ok
          ? `${result.message} Введите код и новый пароль (≥${AUTH_PASSWORD_MIN_LENGTH} символов).`
          : result.error || PASSWORD_RESET_GENERIC_MSG,
      );
    } finally {
      setLoading(false);
    }
  }

  async function onConfirmReset(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!guardOnline()) return;

    const code = otp.replace(/\D/g, "");
    if (code.length !== 6) {
      setMessage("Введите 6-значный код из письма.");
      return;
    }
    if (newPassword.length < AUTH_PASSWORD_MIN_LENGTH) {
      setMessage(AUTH_PASSWORD_TOO_SHORT_MSG);
      return;
    }
    if (newPassword !== newPasswordRepeat) {
      setMessage("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      const result = await postConfirmPasswordReset({
        email: email.trim(),
        code,
        password: newPassword,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setEmailStep("login");
      setPassword(newPassword);
      setNewPassword("");
      setNewPasswordRepeat("");
      setOtp("");
      setMessage(result.message ?? "Пароль обновлён. Войдите новым паролем.");
    } finally {
      setLoading(false);
    }
  }

  async function onSendPhoneOtp() {
    setMessage("");
    if (!guardOnline()) return;
    if (sendCooldownSec > 0) return;
    if (!isRuPhoneMaskComplete(phone)) {
      setMessage("Укажите полный номер РФ: +7 и 10 цифр.");
      return;
    }
    const emailForDup = fallbackEmail.trim() || email.trim();
    if (!emailForDup) {
      setMessage("Укажите email — код продублируем на почту, если SMS задержится.");
      return;
    }

    setLoading(true);
    try {
      const result = await postPhoneSendOtp({
        phone: normalizePhone(phone),
        createUser: false,
        fallbackEmail: emailForDup,
        idempotencyKey: crypto.randomUUID(),
        turnstileToken,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setOtpSent(true);
      setSendCooldownSec(30);
      setOtp("");
      setMessage(result.message ?? PHONE_OTP_SENT_MSG);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyPhoneOtp(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!guardOnline()) return;
    const code = otp.replace(/\D/g, "");
    if (code.length !== 6) {
      setMessage("Введите 6-значный код из SMS или письма.");
      return;
    }

    setLoading(true);
    try {
      const result = await postPhoneVerifyOtp({
        phone: normalizePhone(phone),
        token: code,
        createUser: false,
      });
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

  const tabs = (
    [
      { id: "email" as const, label: "Почта" },
      ...(phoneAllowed ? [{ id: "phone" as const, label: "SMS" }] : []),
      { id: "telegram" as const, label: "Telegram" },
    ] as const
  );

  const methodSwitcher = (
    <div
      className={cn(
        "mb-5 grid gap-2 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-1",
        tabs.length === 3 ? "grid-cols-3" : "grid-cols-2",
      )}
      role="tablist"
      aria-label="Способ входа"
    >
      {tabs.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={method === opt.id}
          onClick={() => {
            setMethod(opt.id);
            setMessage("");
            setMfaRequired(false);
            setOtpSent(false);
            setOtp("");
            setEmailStep("login");
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

  const subtitle = mfaRequired
    ? "Введите код из приложения-аутентификатора."
    : emailStep === "reset"
      ? "Код из письма + новый пароль."
      : method === "email"
        ? "Email и пароль — основной способ входа."
        : method === "phone"
          ? "Код по SMS на +7; дубль на email, если SMS задержится."
          : "Вход через Telegram-бота.";

  return (
    <AuthWizardLayout
      title={
        mfaRequired
          ? "Код двухфакторной защиты"
          : emailStep === "reset"
            ? "Сброс пароля"
            : "Вход"
      }
      subtitle={subtitle}
    >
      {!mfaRequired && emailStep === "login" && isFullOpenAccessEnabledClient() ? (
        <Button asChild variant="outline" className="mb-4 w-full">
          <Link href="/home">В кабинет без входа</Link>
        </Button>
      ) : null}

      {!mfaRequired && emailStep === "login" ? methodSwitcher : null}

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
      ) : emailStep === "reset" ? (
        <form className="space-y-3" onSubmit={(e) => void onConfirmReset(e)}>
          <label className="block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">E-mail</span>
            <input
              className={authInputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          {turnstileEnabled ? (
            <TurnstileWidget
              onToken={(t) => setTurnstileToken(t)}
              onExpire={() => setTurnstileToken(undefined)}
            />
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading || sendCooldownSec > 0}
            onClick={() => void onSendResetCode()}
          >
            {sendCooldownSec > 0 ? `Повтор кода через ${sendCooldownSec} с` : "Получить код на email"}
          </Button>
          <OtpDigitRow value={otp} onChange={setOtp} disabled={loading} label="Код из письма" />
          <label className="block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">
              Новый пароль (≥{AUTH_PASSWORD_MIN_LENGTH})
            </span>
            <input
              className={authInputClass}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={AUTH_PASSWORD_MIN_LENGTH}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">
              Повтор нового пароля
            </span>
            <input
              className={authInputClass}
              type="password"
              value={newPasswordRepeat}
              onChange={(e) => setNewPasswordRepeat(e.target.value)}
              required
              minLength={AUTH_PASSWORD_MIN_LENGTH}
              autoComplete="new-password"
            />
          </label>
          <AuthMessage
            message={message}
            tone={
              message.includes("код") || message.includes("Спам") || message.includes("отправлен")
                ? "success"
                : "error"
            }
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Сохраняем…" : "Сохранить новый пароль"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-[var(--clinical-primary-deep)] hover:underline"
            disabled={loading}
            onClick={() => {
              setEmailStep("login");
              setOtp("");
              setNewPassword("");
              setNewPasswordRepeat("");
              setMessage("");
            }}
          >
            Назад ко входу
          </button>
        </form>
      ) : method === "telegram" ? (
        <TelegramSimpleAuth mode="login" nextPath={nextPath} message={message || undefined} />
      ) : method === "phone" ? (
        <form className="space-y-3" onSubmit={(e) => void onVerifyPhoneOtp(e)}>
          <PhoneInput id="login-wizard-phone" value={phone} onChange={setPhone} disabled={loading} />
          <p className="-mt-1 text-xs text-[var(--clinical-foreground-muted)]">
            {PHONE_OTP_DELAY_HINT} Нет номера РФ — вкладка Telegram или почта.
          </p>
          <label className="block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">
              Email для дубля кода
            </span>
            <input
              className={authInputClass}
              type="email"
              value={fallbackEmail}
              onChange={(e) => setFallbackEmail(e.target.value)}
              placeholder="doctor@example.com"
              autoComplete="email"
              required
            />
            <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
              Обязательно: sms.ru может задержать SMS — тот же код уйдёт на почту.
            </p>
          </label>
          {!otpSent ? (
            <Button
              type="button"
              className="w-full"
              disabled={loading || sendCooldownSec > 0}
              onClick={() => void onSendPhoneOtp()}
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
                <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">
                  6-значный код из SMS или письма
                </span>
                <input
                  className={authInputClass}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  required
                />
              </label>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Проверяем…" : "Войти"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading || sendCooldownSec > 0}
                onClick={() => void onSendPhoneOtp()}
              >
                {sendCooldownSec > 0 ? `Повтор через ${sendCooldownSec} с` : "Отправить код повторно"}
              </Button>
            </>
          )}
          <AuthMessage
            message={message}
            tone={
              message.includes("отправлен") || message.includes("SMS") || message.includes("дубл")
                ? "success"
                : "error"
            }
          />
        </form>
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
          {turnstileEnabled ? (
            <TurnstileWidget
              onToken={(t) => setTurnstileToken(t)}
              onExpire={() => setTurnstileToken(undefined)}
            />
          ) : null}
          <Button type="submit" className="w-full" disabled={loading} data-testid="login-button" aria-label="Войти">
            Войти
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-[var(--clinical-primary-deep)] hover:underline"
            disabled={loading}
            onClick={() => void onSendResetCode()}
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
    </AuthWizardLayout>
  );
}
