"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import type { OnboardingCharacterId } from "@repo/types";
import { DOCTOR_SPECIALIZATION_OPTIONS } from "@repo/clinical-tools";

import { useAuth } from "@/app/providers";
import { AuthMessage, authInputClass } from "@/components/auth/AuthScreenShell";
import { AuthCharacterPicker } from "@/components/auth/wizard/AuthCharacterPicker";
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
import { readAppLocale } from "@/lib/i18n/locale";
import { beginFirstRunOnboarding } from "@/lib/onboarding/first-run-storage";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";

type Step = "register" | "verify" | "character";

type Props = {
  afterAuthPath: string;
};

export function RegisterAuthWizard({ afterAuthPath }: Props) {
  const router = useRouter();
  const { refresh, user, ready } = useAuth();

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

  const heroCharacter =
    step === "character" && character ? character : step === "verify" ? "duo" : "duo";

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
      <AuthWizardLayout
        title="Расскажите о себе"
        subtitle="Я мужчина / я женщина — для оформления входа. Затем укажите специализацию."
        character={character ?? "duo"}
      >
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

        <AuthCharacterPicker
          value={character}
          onChange={(id) => {
            setCharacter(id);
            writeStoredOnboardingCharacter(id);
          }}
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
          Пропустить персонажа
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
        character="duo"
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

  return (
    <AuthWizardLayout title="Регистрация" subtitle="Клиническая платформа для врачей УЗИ и АГ." character="duo">
      <form className="space-y-3" onSubmit={(e) => void onRegisterSubmit(e)}>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Имя</span>
            <input
              className={authInputClass}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Фамилия</span>
            <input
              className={authInputClass}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
            />
          </label>
        </div>
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
      <p className="mt-6 text-center text-sm text-[var(--clinical-foreground-muted)]">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-bold text-[var(--clinical-primary-deep)] hover:underline">
          Войти
        </Link>
      </p>
    </AuthWizardLayout>
  );
}
