"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, Smartphone } from "lucide-react";

import { OtpInput } from "@/components/auth/OtpInput";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { Button } from "@/components/ui/button";
import { normalizePhone } from "@/lib/auth/oauth-providers";
import { isRuPhoneMaskComplete } from "@/lib/auth/ru-phone-mask";
import { safeInternalPath } from "@/lib/nav/safe-redirect";

const RESEND_COOLDOWN_SEC = 60;

type ApiErrorBody = {
  error?: string;
  retryAfterSec?: number;
  devOtp?: string;
  ok?: boolean;
};

export function VerifyPhoneForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeInternalPath(searchParams.get("redirectedFrom"), "/dashboard");

  const [phone, setPhone] = useState("+7 ");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [info, setInfo] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function sendCode() {
    setPhoneError("");
    setInfo("");
    if (!isRuPhoneMaskComplete(phone)) {
      setPhoneError("Введите номер полностью: +7 XXX XXX-XX-XX");
      return;
    }
    if (cooldown > 0) return;

    setSending(true);
    try {
      const res = await fetch("/api/auth/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone: normalizePhone(phone) }),
      });
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody;

      if (!res.ok || !body.ok) {
        if (res.status === 429) {
          setPhoneError(body.error ?? "Слишком много запросов. Подождите.");
          if (body.retryAfterSec) setCooldown(body.retryAfterSec);
        } else {
          setPhoneError(body.error ?? "Не удалось отправить код.");
        }
        return;
      }

      setOtpSent(true);
      setCooldown(RESEND_COOLDOWN_SEC);
      if (body.devOtp) {
        setCode(body.devOtp);
        setInfo(`Dev: код ${body.devOtp} (SMS mock)`);
      } else {
        setInfo("Код отправлен. Проверьте SMS.");
      }
    } finally {
      setSending(false);
    }
  }

  async function verifyCode() {
    setCodeError("");
    setInfo("");
    if (code.trim().length !== 6) {
      setCodeError("Введите 6 цифр кода.");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/auth/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          phone: normalizePhone(phone),
          code: code.trim(),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody;

      if (!res.ok || !body.ok) {
        if (res.status === 429) {
          setCodeError(body.error ?? "Превышен лимит попыток.");
        } else if (res.status === 401) {
          setCodeError(body.error ?? "Неверный или просроченный код.");
        } else {
          setCodeError(body.error ?? "Не удалось подтвердить номер.");
        }
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]">
          <Smartphone className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Подтвердите телефон
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          После входа через Google, почту или Telegram нужен номер для уведомлений и доступа к клиническим
          разделам. Вход по SMS уже считается подтверждённым.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <PhoneInput
          value={phone}
          onChange={setPhone}
          disabled={otpSent && verifying}
          error={phoneError}
        />

        {!otpSent ? (
          <Button className="w-full" size="lg" disabled={sending} onClick={() => void sendCode()}>
            {sending ? "Отправка…" : "Отправить код"}
          </Button>
        ) : (
          <div className="space-y-4">
            <OtpInput value={code} onChange={setCode} disabled={verifying} error={codeError} />
            <Button className="w-full gap-2" size="lg" disabled={verifying} onClick={() => void verifyCode()}>
              <ShieldCheck className="h-4 w-4" />
              {verifying ? "Проверка…" : "Подтвердить"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              disabled={sending || cooldown > 0}
              onClick={() => void sendCode()}
            >
              {cooldown > 0 ? `Отправить снова через ${cooldown} с` : "Отправить код повторно"}
            </Button>
          </div>
        )}

        {info ? <p className="text-center text-xs text-emerald-700 dark:text-emerald-400">{info}</p> : null}
      </div>

      <p className="text-center text-xs text-slate-500">
        Проблемы с SMS?{" "}
        <Link href="/profile" className="text-[var(--clinical-primary)] underline">
          Профиль
        </Link>{" "}
        ·{" "}
        <Link href="/login" className="text-[var(--clinical-primary)] underline">
          Другой вход
        </Link>
      </p>
    </div>
  );
}
