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
  postPhoneSendOtp,
  postPhoneVerifyOtp,
  postResendConfirmation,
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
  const [verifyMode, setVerifyMode] = useState<"phone" | "email">("email");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendCooldownSec, setSendCooldownSec] = useState(0);
  const [pendingEmail, setPendingEmail] = useState(false);
  const [birthDateIso, setBirthDateIso] = useState("");

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

      if (result.session) {
        await refresh();
        setStep("character");
        return;
      }

      if (result.needsEmailConfirmation) {
        setPendingEmail(true);
        setVerifyMode("email");
        setStep("verify");
        setMessage("Мы отправили ссылку и код на почту. Подтвердите email, затем введите код из письма (если есть).");
        return;
      }

      const phoneReady = isRuPhoneMaskComplete(phone);
      if (phoneReady) {
        const sent = await postPhoneSendOtp({
          phone,
          createUser: false,
          full_name,
          specialization: specialization.trim(),
        });
        if (sent.ok) {
          setVerifyMode("phone");
          setStep("verify");
          setMessage(PHONE_OTP_SENT_MSG);
          setSendCooldownSec(60);
          return;
        }
      }

      setStep("character");
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

  async function onEmailConfirmedContinue() {
    setMessage("");
    setLoading(true);
    try {
      await refresh();
      const { user: sessionUser } = await fetchAuthSession();
      if (sessionUser?.id) {
        setStep("character");
        return;
      }
      setMessage("Почта ещё не подтверждена. Откройте письмо или запросите повторно.");
    } finally {
      setLoading(false);
    }
  }

  async function onResendEmail() {
    if (sendCooldownSec > 0) return;
    const res = await postResendConfirmation({ email: email.trim() });
    if (res.ok) {
      setMessage(RESEND_CONFIRMATION_MSG);
      setSendCooldownSec(60);
    } else {
      setMessage(res.error);
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
        title={verifyMode === "phone" ? "Код из SMS" : "Подтверждение почты"}
        subtitle={
          verifyMode === "phone"
            ? `Код отправлен на ${phone.trim()}`
            : `Проверьте ${email.trim()}`
        }
      >
        {verifyMode === "phone" ? (
          <>
            <OtpDigitRow value={otp} onChange={setOtp} disabled={loading} />
            <Button type="button" className="mt-6 w-full" disabled={loading} onClick={() => void onVerifyPhone()}>
              Подтвердить
            </Button>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-[var(--clinical-foreground-muted)]">
              После перехода по ссылке в письме нажмите «Я подтвердил почту».
            </p>
            <OtpDigitRow value={otp} onChange={setOtp} disabled={loading} label="Код из письма, если указан" />
            <Button type="button" className="mt-6 w-full" disabled={loading} onClick={() => void onEmailConfirmedContinue()}>
              Я подтвердил почту
            </Button>
            {pendingEmail ? (
              <button
                type="button"
                className="mt-3 w-full text-sm text-[var(--clinical-primary-deep)] hover:underline disabled:opacity-50"
                disabled={sendCooldownSec > 0}
                onClick={() => void onResendEmail()}
              >
                {sendCooldownSec > 0 ? `Отправить повторно через 0:${String(sendCooldownSec).padStart(2, "0")}` : "Отправить письмо снова"}
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
          ? "Email и пароль — основной способ. Подтвердите почту по ссылке из письма."
          : "Telegram — без пароля. Укажите ФИО и дату рождения, затем подтвердите в боте."
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
          <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Телефон (необязательно)</span>
          <input
            className={authInputClass}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 999 000-00-00"
            autoComplete="tel"
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
