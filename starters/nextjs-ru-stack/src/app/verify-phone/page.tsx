"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function VerifyPhonePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSendOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { error?: string; devCode?: string };
      if (!res.ok) {
        setError(data.error ?? "Не удалось отправить SMS.");
        return;
      }
      setOtpSent(true);
      if (data.devCode) setCode(String(data.devCode));
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Неверный код.");
        return;
      }

      await update();
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold text-white">Подтверждение телефона</h1>
      <p className="mt-2 text-sm text-slate-400">
        {session?.user?.email
          ? `Аккаунт ${session.user.email}: укажите номер для завершения регистрации.`
          : "Укажите российский номер — отправим SMS с кодом."}
      </p>

      <form onSubmit={onVerify} className="mt-8 space-y-4">
        <input
          type="tel"
          placeholder="+7 999 000-00-00"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
          required
        />

        {otpSent ? (
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6 цифр из SMS"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
            required
          />
        ) : (
          <button
            type="button"
            onClick={() => void onSendOtp()}
            disabled={loading || !phone.trim()}
            className="w-full rounded-xl bg-slate-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Отправка…" : "Отправить код"}
          </button>
        )}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {otpSent ? (
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-xl bg-sky-500 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Проверка…" : "Подтвердить"}
          </button>
        ) : null}
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Лимиты: 1 SMS в минуту, не более 5 в час на номер.
      </p>
    </main>
  );
}
