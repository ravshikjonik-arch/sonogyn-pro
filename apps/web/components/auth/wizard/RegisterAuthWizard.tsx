"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import type { OnboardingCharacterId } from "@repo/types";
import { DOCTOR_SPECIALIZATION_OPTIONS } from "@repo/clinical-tools";

import { useAuth } from "@/app/providers";
import {
  birthDateErrorMessage,
  validateDoctorBirthDateIso,
} from "@/components/auth/DoctorRegistrationFields";
import { AuthMessage, authInputClass } from "@/components/auth/AuthScreenShell";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { TelegramSimpleAuth } from "@/components/auth/TelegramSimpleAuth";
import { AuthGenderPicker } from "@/components/auth/wizard/AuthGenderPicker";
import { AuthWizardLayout } from "@/components/auth/wizard/AuthWizardLayout";
import { OtpDigitRow } from "@/components/auth/wizard/OtpDigitRow";
import { Button } from "@/components/ui/button";
import {
  readStoredOnboardingCharacter,
  writeStoredOnboardingCharacter,
} from "@/lib/auth/auth-wizard-config";
import {
  fetchAuthSession,
  postConfirmSignupOtp,
  postPhoneSendOtp,
  postPhoneVerifyOtp,
  postResendConfirmation,
  postSendCode,
  postSignUp,
} from "@/lib/auth/client-auth-api";
import { normalizeRussianFio } from "@/lib/auth/doctor-display";
import { isRuPhoneMaskComplete } from "@/lib/auth/ru-phone-mask";
import { saveOnboardingCharacter } from "@/lib/auth/save-onboarding-character";
import {
  PHONE_OTP_SENT_MSG,
  requireOnlineForAuth,
  RESEND_CONFIRMATION_MSG,
  SIGN_UP_GENERIC_MSG,
} from "@/lib/auth/translate-auth-error";
import { isFullOpenAccessEnabledClient } from "@/lib/auth/guest-demo-account";
import { readAppLocale, saveAppLocale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils/cn";
import { beginFirstRunOnboarding } from "@/lib/onboarding/first-run-storage";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";

type Step = "register" | "verify" | "character";
type RegisterMethod = "email" | "telegram";
type VerifyMode = "email" | "phone";

type Props = {
  afterAuthPath: string;
};

export function RegisterAuthWizard({ afterAuthPath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh, user, ready } = useAuth();

  const initialMethod = useMemo<RegisterMethod>(() => {
    return searchParams.get("method") === "telegram" ? "telegram" : "email";
  }, [searchParams]);

  const [method, setMethod] = useState<RegisterMethod>(initialMethod);
  const [step, setStep] = useState<Step>("register");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [specialization, setSpecialization] = useState("Акушер-гинеколог");
  const [character, setCharacter] = useState<OnboardingCharacterId | null>(() => readStoredOnboardingCharacter());
  const [otp, setOtp] = useState("");
  const [verifyMode, setVerifyMode] = useState<VerifyMode>("email");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendCooldownSec, setSendCooldownSec] = useState(0);
  const [pendingEmail, setPendingEmail] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [birthDateIso, setBirthDateIso] = useState("");
  /** Телефон опционален: SMS.ru только РФ (+79). +993 и др. — email/Telegram. */
  const phoneOptional = true;
  const phoneRequired = false;

  useEffect(() => {
    setMethod(initialMethod);
  }, [initialMethod]);

  useEffect(() => {
    if (sendCooldownSec <= 0) return;
    const t = setInterval(() => setSendCooldownSec((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [sendCooldownSec]);

  useEffect(() => {
    if (!ready || !user) return;
    if (step === "character") return;
    router.replace(afterAuthPath);
  }, [ready, user, step, router, afterAuthPath]);

  const guardOnline = useCallback(() => {
    const offline = requireOnlineForAuth();
    if (offline) {
      setMessage(offline);
      return false;
    }
    return true;
  }, []);

  async function finishRegistration(characterId: OnboardingCharacterId) {
    writeStoredOnboardingCharacter(characterId);
    setLoading(true);
    try {
      const saved = await saveOnboardingCharacter(characterId, { specialization: specialization.trim() });
      if (!saved.ok) setMessage(saved.error);
      beginFirstRunOnboarding();
      markSessionAnchorNow();
      await refresh();
      router.replace(afterAuthPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function buildFullName(): string | null {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setMessage("Укажите имя и фамилию.");
      return null;
    }
    return normalizeRussianFio(`${ln} ${fn}`) ?? `${ln} ${fn}`;
  }

  async function onRegisterViaTelegram() {
    setMessage("");
    if (!guardOnline()) return;

    const full_name = buildFullName();
    if (!full_name) return;

    const parsedBirth = validateDoctorBirthDateIso(birthDateIso);
    if (!parsedBirth) {
      setMessage(birthDateErrorMessage(birthDateIso));
      return;
    }

    if (!specialization.trim()) {
      setMessage("Выберите специализацию.");
      return;
    }

    setLoading(true);
    try {
      const locale = readAppLocale();
      const res = await fetch("/api/auth/pilot/register-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          full_name,
          specialization: specialization.trim(),
          preferred_locale: locale,
          birth_year: parsedBirth.year,
          birth_date: parsedBirth.iso,
          next: afterAuthPath,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; redirectUrl?: string; error?: string };
      if (!res.ok || !body.redirectUrl) {
        setMessage(body.error ?? "Не удалось начать регистрацию через Telegram.");
        return;
      }
      saveAppLocale(locale);
      window.location.assign(body.redirectUrl);
    } finally {
      setLoading(false);
    }
  }

  async function startPhoneVerifyStep(full_name: string) {
    if (!isRuPhoneMaskComplete(phone)) {
      if (phoneRequired) {
        setMessage("Укажите мобильный +7 — код подтверждения придёт по SMS.");
        return false;
      }
      setStep("character");
      return true;
    }

    setOtp("");
    setVerifyMode("phone");
    setStep("verify");

    const sent = await postPhoneSendOtp({
      phone,
      createUser: false,
      full_name,
      specialization: specialization.trim(),
      fallbackEmail: email.trim() || undefined,
    });
    if (!sent.ok) {
      setMessage(sent.error || "Не удалось отправить SMS. Проверьте номер +7 и нажмите «Отправить SMS снова».");
      return false;
    }
    setMessage(sent.message || PHONE_OTP_SENT_MSG);
    setSendCooldownSec(60);
    if (sent.devOtp) setOtp(sent.devOtp);
    return true;
  }

  async function onRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!guardOnline()) return;

    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setMessage("Укажите имя и фамилию.");
      return;
    }
    const full_name = normalizeRussianFio(`${ln} ${fn}`) ?? `${ln} ${fn}`;
    if (password.length < 8) {
      setMessage("Пароль — не короче 8 символов.");
      return;
    }
    if (password !== passwordRepeat) {
      setMessage("Пароли не совпадают.");
      return;
    }
    if (phoneRequired && !isRuPhoneMaskComplete(phone)) {
      setMessage("Укажите мобильный телефон +7 — код придёт по SMS (Telegram для кода не нужен).");
      return;
    }

    setLoading(true);
    try {
      const locale = readAppLocale();
      const result = await postSignUp({
        email: email.trim(),
        password,
        full_name,
        specialization: specialization.trim(),
        preferred_locale: locale,
      });

      if (!result.ok) {
        setMessage(result.error || SIGN_UP_GENERIC_MSG);
        return;
      }

      if (result.needsEmailConfirmation) {
        setPendingEmail(true);
        setEmailOtpSent(Boolean(result.emailOtpSent));
        setVerifyMode("email");
        setStep("verify");
        setOtp("");
        setMessage(
          result.message ||
            "Код отправлен на почту от Sonogyn-pro@mail.ru. Введите его ниже (проверьте «Спам»).",
        );
        setSendCooldownSec(60);
        return;
      }

      // Сессия может быть только в cookies (без session в JSON) — всегда refresh.
      await refresh();
      await startPhoneVerifyStep(full_name);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyEmailOtp() {
    setMessage("");
    if (!guardOnline()) return;
    const code = otp.replace(/\D/g, "");
    if (code.length < 4) {
      setMessage("Введите код из письма.");
      return;
    }
    setLoading(true);
    try {
      const result = await postConfirmSignupOtp({
        email: email.trim(),
        password,
        code,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      await refresh();
      const full_name =
        normalizeRussianFio(`${lastName.trim()} ${firstName.trim()}`) ??
        `${lastName.trim()} ${firstName.trim()}`;
      await startPhoneVerifyStep(full_name);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyPhone() {
    setMessage("");
    if (!guardOnline()) return;
    if (otp.replace(/\D/g, "").length < 4) {
      setMessage("Введите код из SMS.");
      return;
    }
    setLoading(true);
    try {
      const result = await postPhoneVerifyOtp({
        phone,
        token: otp.replace(/\D/g, ""),
        createUser: false,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      await refresh();
      setStep("character");
    } finally {
      setLoading(false);
    }
  }

  async function onEmailLinkContinue() {
    setMessage("");
    setLoading(true);
    try {
      await refresh();
      const { user: sessionUser } = await fetchAuthSession();
      if (sessionUser?.id) {
        const full_name =
          normalizeRussianFio(`${lastName.trim()} ${firstName.trim()}`) ??
          `${lastName.trim()} ${firstName.trim()}`;
        await startPhoneVerifyStep(full_name);
        return;
      }
      setMessage("Почта ещё не подтверждена. Введите код из письма или откройте ссылку и нажмите снова.");
    } finally {
      setLoading(false);
    }
  }

  async function onResendEmail() {
    if (sendCooldownSec > 0) return;
    setLoading(true);
    try {
      const otpRes = await postSendCode({
        method: "email",
        contact: email.trim(),
        purpose: "register",
      });
      if (otpRes.ok) {
        setEmailOtpSent(true);
        setMessage("Новый код отправлен на почту. Проверьте «Входящие» и «Спам».");
        setSendCooldownSec(60);
        return;
      }
      const linkRes = await postResendConfirmation({ email: email.trim() });
      if (linkRes.ok) {
        setMessage(linkRes.message || RESEND_CONFIRMATION_MSG);
        setSendCooldownSec(60);
      } else {
        setMessage(otpRes.error || linkRes.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onResendSms() {
    if (sendCooldownSec > 0) return;
    const full_name =
      normalizeRussianFio(`${lastName.trim()} ${firstName.trim()}`) ??
      `${lastName.trim()} ${firstName.trim()}`;
    setLoading(true);
    try {
      await startPhoneVerifyStep(full_name);
    } finally {
      setLoading(false);
    }
  }

  if (step === "character") {
    return (
      <AuthWizardLayout title="Расскажите о себе" subtitle="Мужчина или женщина — для интерфейса. Затем специализация.">
        <label className="mb-4 block">
          <span className="text-sm font-medium text-[var(--clinical-foreground)]">Специализация</span>
          <select
            className={authInputClass}
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            aria-label="Специализация"
          >
            {DOCTOR_SPECIALIZATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <AuthGenderPicker
          value={character}
          onChange={(id) => {
            setCharacter(id);
            writeStoredOnboardingCharacter(id);
          }}
          hint="Своё фото — в профиле после входа."
        />

        <AuthMessage message={message} />

        <Button
          type="button"
          className="mt-6 w-full"
          disabled={loading || !character}
          onClick={() => character && void finishRegistration(character)}
        >
          Продолжить
        </Button>
        <button
          type="button"
          className="mt-3 w-full text-center text-sm text-[var(--clinical-foreground-muted)] hover:underline"
          disabled={loading}
          onClick={() => void finishRegistration(character ?? "boy")}
        >
          Пропустить (по умолчанию — мужчина)
        </button>
      </AuthWizardLayout>
    );
  }

  if (step === "verify") {
    return (
      <AuthWizardLayout
        title={verifyMode === "phone" ? "Код из SMS" : "Код из письма"}
        subtitle={
          verifyMode === "phone"
            ? `SMS на ${phone.trim()} (только +7 РФ). Можно пропустить.`
            : `Письмо на ${email.trim()} от Sonogyn-pro@mail.ru`
        }
      >
        {verifyMode === "phone" ? (
          <>
            <OtpDigitRow value={otp} onChange={setOtp} disabled={loading} />
            <Button type="button" className="mt-6 w-full" disabled={loading} onClick={() => void onVerifyPhone()}>
              Подтвердить телефон
            </Button>
            <button
              type="button"
              className="mt-3 w-full text-sm text-[var(--clinical-primary-deep)] hover:underline disabled:opacity-50"
              disabled={sendCooldownSec > 0 || loading}
              onClick={() => void onResendSms()}
            >
              {sendCooldownSec > 0
                ? `SMS снова через 0:${String(sendCooldownSec).padStart(2, "0")}`
                : "Отправить SMS снова"}
            </button>
            <button
              type="button"
              className="mt-3 w-full text-sm text-[var(--clinical-foreground-muted)] hover:underline"
              disabled={loading}
              onClick={() => setStep("character")}
            >
              Пропустить подтверждение телефона
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-[var(--clinical-foreground-muted)]">
              {emailOtpSent
                ? "Введите 6-значный код из письма. Ссылку из письма тоже можно открыть."
                : "Откройте письмо со ссылкой или запросите код повторно."}
            </p>
            <OtpDigitRow value={otp} onChange={setOtp} disabled={loading} label="Код из письма" />
            <Button type="button" className="mt-6 w-full" disabled={loading} onClick={() => void onVerifyEmailOtp()}>
              Подтвердить почту кодом
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="mt-3 w-full"
              disabled={loading}
              onClick={() => void onEmailLinkContinue()}
            >
              Уже перешёл по ссылке в письме
            </Button>
            {pendingEmail ? (
              <button
                type="button"
                className="mt-3 w-full text-sm text-[var(--clinical-primary-deep)] hover:underline disabled:opacity-50"
                disabled={sendCooldownSec > 0 || loading}
                onClick={() => void onResendEmail()}
              >
                {sendCooldownSec > 0
                  ? `Отправить код снова через 0:${String(sendCooldownSec).padStart(2, "0")}`
                  : "Отправить код на почту снова"}
              </button>
            ) : null}
          </>
        )}
        <AuthMessage message={message} />
        <button
          type="button"
          className="mt-4 w-full text-sm text-[var(--clinical-foreground-muted)] hover:underline"
          onClick={() => setStep("register")}
        >
          Вернуться назад
        </button>
      </AuthWizardLayout>
    );
  }

  const methodSwitcher = (
    <div
      className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-1"
      role="tablist"
      aria-label="Способ регистрации"
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

  const nameFields = (
    <div className="grid grid-cols-2 gap-3">
      <label className="block">
        <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Имя</span>
        <input
          className={authInputClass}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required={method === "email"}
          autoComplete="given-name"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Фамилия</span>
        <input
          className={authInputClass}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required={method === "email"}
          autoComplete="family-name"
        />
      </label>
    </div>
  );

  return (
    <AuthWizardLayout
      title="Регистрация"
      subtitle={
        method === "email"
          ? "Email + пароль и код на почту. Телефон +7 — по желанию (SMS). Для +993 — без SMS, через почту или Telegram."
          : "Telegram Login без пароля. Телефон потом можно подтвердить по SMS (+7)."
      }
    >
      {methodSwitcher}

      <label className="mb-3 block">
        <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Специализация</span>
        <select
          className={authInputClass}
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          aria-label="Специализация"
        >
          {DOCTOR_SPECIALIZATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      {method === "telegram" ? (
        <div className="space-y-3">
          {nameFields}
          <label className="block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Дата рождения</span>
            <input
              className={authInputClass}
              type="date"
              value={birthDateIso}
              onChange={(e) => setBirthDateIso(e.target.value)}
              required
              autoComplete="bday"
            />
          </label>
          <AuthMessage message={message} />
          <TelegramSimpleAuth
            mode="register"
            nextPath={afterAuthPath}
            onRegisterClick={() => void onRegisterViaTelegram()}
            registerLoading={loading}
          />
        </div>
      ) : (
      <form className="space-y-3" onSubmit={(e) => void onRegisterSubmit(e)}>
        {nameFields}
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
        <label className="block">
          <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">
            Телефон {phoneOptional ? "(необязательно, только +7 РФ)" : "(SMS-код)"}
          </span>
          <PhoneInput
            id="register-wizard-phone"
            value={phone}
            onChange={setPhone}
            disabled={loading}
          />
          <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
            Номера не РФ (+993 и др.) не указывайте здесь — регистрация по email без SMS.
          </p>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Пароль</span>
          <input
            className={authInputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Повторите пароль</span>
          <input
            className={authInputClass}
            type="password"
            value={passwordRepeat}
            onChange={(e) => setPasswordRepeat(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>
        <AuthMessage message={message} />
        <Button type="submit" className="w-full" disabled={loading}>
          Зарегистрироваться
        </Button>
      </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--clinical-foreground-muted)]">
        {isFullOpenAccessEnabledClient() ? (
          <>
            Регистрация не обязательна —{" "}
            <Link href="/home" className="font-bold text-[var(--clinical-primary-deep)] hover:underline">
              открыть кабинет
            </Link>
            {" · "}
          </>
        ) : null}
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-bold text-[var(--clinical-primary-deep)] hover:underline">
          Войти
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-[var(--clinical-foreground-muted)]">
        <Link href="/register?wizard=0" className="hover:underline">
          SMS и Яндекс ID
        </Link>
      </p>
    </AuthWizardLayout>
  );
}
