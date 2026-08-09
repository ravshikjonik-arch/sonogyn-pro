"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers";
import { AuthMessage, AuthScreenShell, authInputClass } from "@/components/auth/AuthScreenShell";
import { RegisterCareerTeaser } from "@/components/auth/RegisterCareerTeaser";
import { AuthSetupBanner } from "@/components/auth/AuthSetupBanner";
import { EmailRegistrationHint } from "@/components/auth/EmailRegistrationHint";
import { PhoneAuthSetupHint } from "@/components/auth/PhoneAuthSetupHint";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { RussianIdpPanel } from "@/components/auth/RussianIdpPanel";
import { isAuthSocialEnabledClient } from "@/lib/auth/open-access";
import {
  birthDateErrorMessage,
  DoctorRegistrationFields,
  validateDoctorBirthDateIso,
} from "@/components/auth/DoctorRegistrationFields";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { TelegramSimpleAuth } from "@/components/auth/TelegramSimpleAuth";
import { Button } from "@/components/ui/button";
import { CAPTCHA_FAILURE_THRESHOLD } from "@/lib/auth/auth-attempts";
import {
  postPhoneSendOtp,
  postPhoneVerifyOtp,
  postResendConfirmation,
  postSendCode,
  postSignUp,
  postTelegramVerifyOtp,
} from "@/lib/auth/client-auth-api";
import {
  PRODUCT_OWNER_FIO,
  PRODUCT_OWNER_FIO_SHORT,
} from "@/lib/auth/doctor-display";
import { looksLikePhoneInput, USE_PHONE_TAB_MSG } from "@/lib/auth/auth-error-text";
import { normalizePhone } from "@/lib/auth/oauth-providers";
import { parseRegistrationMethod, readTelegramBotDisplayName, type AuthRegistrationMethod } from "@/lib/auth/registration-methods";
import { isAuthEmailOnlyClient } from "@/lib/auth/auth-methods-config";
import { isPilotClosedAccessClient, isPilotTelegramPrimary, PILOT_AUTH_SUBTITLE, PILOT_REGISTER_SUBTITLE } from "@/lib/auth/auth-pilot-config";
import { RU_IDP_REGISTER_SUBTITLE } from "@/lib/auth/russian-idp";
import { isRuPhoneMaskComplete } from "@/lib/auth/ru-phone-mask";
import {
  PHONE_OTP_DELAY_HINT,
  PHONE_OTP_SENT_MSG,
  requireOnlineForAuth,
  RESEND_CONFIRMATION_MSG,
  SIGN_UP_GENERIC_MSG,
} from "@/lib/auth/translate-auth-error";
import { readAppLocale, saveAppLocale, type AppLocale } from "@/lib/i18n/locale";
import { safeInternalPath } from "@/lib/nav/safe-redirect";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const defaultTab = useMemo(
    () => parseRegistrationMethod(searchParams.get("method")),
    [searchParams],
  );

  const [activeTab, setActiveTab] = useState<AuthRegistrationMethod>(defaultTab);
  const [fullName, setFullName] = useState("");
  const [birthDateIso, setBirthDateIso] = useState("");
  const [specialization, setSpecialization] = useState("Акушер-гинеколог");
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
  const [locale, setLocale] = useState<AppLocale>(() => readAppLocale());
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState(false);
  const [smsNotConfigured, setSmsNotConfigured] = useState(false);
  const [sendCooldownSec, setSendCooldownSec] = useState(0);

  const afterAuthPath = safeInternalPath(
    searchParams.get("next") ?? searchParams.get("redirectedFrom"),
    "/home",
  );
  const simpleTelegramRegister = isPilotTelegramPrimary() || isPilotClosedAccessClient();
  const telegramBotName = readTelegramBotDisplayName();

  useEffect(() => {
    if (sendCooldownSec <= 0) return;
    const timer = setInterval(() => {
      setSendCooldownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [sendCooldownSec]);

  useEffect(() => {
    const fromTelegram =
      searchParams.get("telegram_message")?.trim() ||
      (searchParams.get("message") === "register_first"
        ? "Сначала заполните данные врача и подтвердите через Telegram."
        : "");
    if (fromTelegram) {
      setMessage(fromTelegram);
      setActiveTab("telegram");
    }
  }, [searchParams]);

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

    let parsedBirth: ReturnType<typeof validateDoctorBirthDateIso> = null;
    if (birthDateIso.trim()) {
      parsedBirth = validateDoctorBirthDateIso(birthDateIso);
      if (!parsedBirth) {
        setMessage(birthDateErrorMessage(birthDateIso));
        return;
      }
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
        birth_year: parsedBirth?.year,
        birth_date: parsedBirth?.iso,
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

  async function onSendTelegramOtp() {
    setMessage("");
    if (!guardOnline()) return;
    if (sendCooldownSec > 0) return;

    const trimmedName = validateDoctorName();
    if (!trimmedName) return;

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
        purpose: "register",
        turnstileToken,
        idempotencyKey: crypto.randomUUID(),
        fallbackEmail: fallbackEmailTelegram.trim() || email.trim() || undefined,
        backupPhone: isRuPhoneMaskComplete(backupPhoneTelegram)
          ? normalizePhone(backupPhoneTelegram)
          : undefined,
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

    const trimmedName = validateDoctorName();
    if (!trimmedName) return;

    const parsedBirth = validateDoctorBirthDateIso(birthDateIso);
    if (!parsedBirth) {
      setMessage(birthDateErrorMessage(birthDateIso));
      return;
    }

    if (!specialization.trim()) {
      setMessage("Выберите специализацию из списка.");
      return;
    }

    const chatId = telegramChatId.trim();
    setLoading(true);
    try {
      const result = await postTelegramVerifyOtp({
        chatId,
        token: otp.trim(),
        createUser: true,
        full_name: trimmedName,
        preferred_locale: locale,
        birth_year: parsedBirth.year,
        birth_date: parsedBirth.iso,
        specialization: specialization.trim(),
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      saveAppLocale(locale);
      markSessionAnchorNow();
      window.location.assign(afterAuthPath);
    } finally {
      setLoading(false);
    }
  }

  async function onRegisterViaTelegram() {
    setMessage("");
    if (!guardOnline()) return;

    const trimmedName = validateDoctorName();
    if (!trimmedName) return;

    const parsedBirth = validateDoctorBirthDateIso(birthDateIso);
    if (!parsedBirth) {
      setMessage(birthDateErrorMessage(birthDateIso));
      return;
    }

    if (!specialization.trim()) {
      setMessage("Выберите специализацию из списка.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/pilot/register-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          full_name: trimmedName,
          specialization: specialization.trim(),
          preferred_locale: locale,
          birth_year: parsedBirth.year,
          birth_date: parsedBirth.iso,
          next: afterAuthPath,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; redirectUrl?: string; error?: string };
      if (!res.ok || !body.redirectUrl) {
        setMessage(body.error ?? "Не удалось начать регистрацию.");
        return;
      }
      saveAppLocale(locale);
      window.location.assign(body.redirectUrl);
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

    if (!isRuPhoneMaskComplete(phone)) {
      setMessage("Укажите полный номер РФ: +7 и 10 цифр. Для других стран — вкладка Telegram.");
      return;
    }

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

    const trimmedName = validateDoctorName();
    if (!trimmedName) return;

    const parsedBirth = validateDoctorBirthDateIso(birthDateIso);
    if (!parsedBirth) {
      setMessage(birthDateErrorMessage(birthDateIso));
      return;
    }

    if (!specialization.trim()) {
      setMessage("Выберите специализацию из списка.");
      return;
    }

    const normalized = normalizePhone(phone);
    setLoading(true);
    try {
      const result = await postPhoneVerifyOtp({
        phone: normalized,
        token: otp.trim(),
        createUser: true,
        full_name: trimmedName,
        preferred_locale: locale,
        birth_year: parsedBirth.year,
        birth_date: parsedBirth.iso,
        specialization: specialization.trim(),
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

  const isSuccessMessage =
    message === SIGN_UP_GENERIC_MSG ||
    message === RESEND_CONFIRMATION_MSG ||
    message === PHONE_OTP_SENT_MSG ||
    /^код\s+(отправлен|готов)/i.test(message) ||
    /код\s+отправлен\s+(в\s+)?(sms|telegram)/i.test(message) ||
    /sms[- ]?код\s+отправлен/i.test(message);

  return (
    <AuthScreenShell
      title="Регистрация"
      subtitle={
        isPilotClosedAccessClient()
          ? PILOT_REGISTER_SUBTITLE
          : isPilotTelegramPrimary()
            ? `Шаг 1 · ${PILOT_AUTH_SUBTITLE}`
            : RU_IDP_REGISTER_SUBTITLE
      }
      defaultTab={defaultTab}
      onTabChange={onTabChange}
      showMethodHints
      socialTab={
        isAuthSocialEnabledClient() && !isPilotClosedAccessClient() ? (
          <div className="space-y-4">
            {!isAuthEmailOnlyClient() ? <RegisterCareerTeaser /> : null}
            <RussianIdpPanel variant="register" nextPath={afterAuthPath} />
            <p className="text-xs text-slate-500">
              ФИО подставим из Яндекса. Специализацию укажите в профиле — откроется полный кабинет.
            </p>
          </div>
        ) : !isPilotClosedAccessClient() ? (
          <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
            <p className="font-semibold">Регистрация не обязательна</p>
            <p className="text-xs">
              Можно сразу работать в кабинете. Email — когда понадобятся пациенты и сохранение.
            </p>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/home">В кабинет без регистрации</Link>
            </Button>
          </div>
        ) : undefined
      }
      telegramTab={
        simpleTelegramRegister ? (
          <div className="space-y-4">
            <RegisterCareerTeaser />
            <DoctorRegistrationFields
              fullName={fullName}
              onFullNameChange={setFullName}
              birthDateIso={birthDateIso}
              onBirthDateIsoChange={setBirthDateIso}
              specialization={specialization}
              onSpecializationChange={setSpecialization}
              locale={locale}
              onLocaleChange={setLocale}
            />
            <TelegramSimpleAuth
              mode="register"
              nextPath={afterAuthPath}
              message={message && activeTab === "telegram" && !isSuccessMessage ? message : undefined}
              onRegisterClick={() => void onRegisterViaTelegram()}
              registerLoading={loading}
            />
            {message && activeTab === "telegram" && isSuccessMessage ? (
              <AuthMessage message={message} tone="success" />
            ) : null}
          </div>
        ) : (
        <form className="space-y-4" onSubmit={(e) => void onVerifyTelegramOtp(e)}>
          <RegisterCareerTeaser />
          <DoctorRegistrationFields
            fullName={fullName}
            onFullNameChange={setFullName}
            birthDateIso={birthDateIso}
            onBirthDateIsoChange={setBirthDateIso}
            specialization={specialization}
            onSpecializationChange={setSpecialization}
            locale={locale}
            onLocaleChange={setLocale}
          />
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
              Сначала откройте {telegramBotName} и нажмите Start. ID — у @userinfobot.
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
            <p className="mt-1 text-xs text-slate-500">
              Если Telegram недоступен — код уйдёт на эту почту (152-ФЗ: только ваш адрес).
            </p>
          </label>
          <PhoneInput
            id="register-telegram-backup-phone"
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
              aria-label="Получить код"
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
              <Button className="w-full rounded-2xl py-6" type="submit" disabled={loading} aria-label="Подтвердить">
                {loading ? "Проверяем…" : "Подтвердить и войти"}
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
            <AuthMessage message={message} tone={isSuccessMessage ? "success" : "error"} />
          ) : null}
          {showCaptcha && activeTab === "telegram" ? (
            <TurnstileWidget onToken={(t) => setTurnstileToken(t)} onExpire={() => setTurnstileToken(undefined)} />
          ) : null}
        </form>
        )
      }
      emailTab={
        <>
          <AuthSetupBanner />
          <EmailRegistrationHint />
          <RegisterCareerTeaser />
        <form className="space-y-4" onSubmit={(e) => void onEmailRegister(e)}>
          <DoctorRegistrationFields
            fullName={fullName}
            onFullNameChange={setFullName}
            birthDateIso={birthDateIso}
            onBirthDateIsoChange={setBirthDateIso}
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
              placeholder="doctor@mail.ru"
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
                Письмо придёт от <strong>Sonogyn-pro@mail.ru</strong> — откройте ссылку подтверждения.
                Если не видите письмо, проверьте «Спам».
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
            birthDateIso={birthDateIso}
            onBirthDateIsoChange={setBirthDateIso}
            specialization={specialization}
            onSpecializationChange={setSpecialization}
            locale={locale}
            onLocaleChange={setLocale}
          />
          <PhoneInput id="register-phone" value={phone} onChange={setPhone} disabled={loading} />
          <p className="-mt-1 text-xs text-slate-500">{PHONE_OTP_DELAY_HINT}</p>
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
      footer={
        <>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
            {!isPilotClosedAccessClient() ? (
              <>
            {!isAuthEmailOnlyClient() ? (
              <>
            <Link
              href="/register?method=phone"
              className={`rounded-full px-3 py-1 ${activeTab === "phone" ? "bg-[var(--clinical-primary-deep)] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              SMS
            </Link>
            <Link
              href="/register?method=telegram"
              className={`rounded-full px-3 py-1 ${activeTab === "telegram" ? "bg-[var(--clinical-primary-deep)] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              Telegram
            </Link>
              </>
            ) : null}
            <Link
              href="/register?method=social"
              className={`rounded-full px-3 py-1 ${activeTab === "social" ? "bg-[var(--clinical-primary-deep)] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              Яндекс ID
            </Link>
            <Link
              href="/register?method=email"
              className={`rounded-full px-3 py-1 ${activeTab === "email" ? "bg-[var(--clinical-primary-deep)] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              Email
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
