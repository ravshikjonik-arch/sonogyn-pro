"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSendOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "sms_failed");
        return;
      }
      setOtpSent(true);
      if (data.devCode) setCode(String(data.devCode));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result =
        tab === "email"
          ? await signIn("email-password", { email, password, redirect: false })
          : await signIn("phone-sms", { phone, code, redirect: false });

      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold">Вход</h1>
      <p className="mt-2 text-sm text-slate-400">Google — если настроен; иначе email или SMS.</p>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`rounded-lg px-3 py-1 text-sm ${tab === "email" ? "bg-sky-600" : "bg-slate-800"}`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setTab("phone")}
          className={`rounded-lg px-3 py-1 text-sm ${tab === "phone" ? "bg-sky-600" : "bg-slate-800"}`}
        >
          SMS
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {tab === "email" ? (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
              required
            />
          </>
        ) : (
          <>
            <input
              type="tel"
              placeholder="+7 999 000-00-00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
              required
            />
            {otpSent ? (
              <input
                type="text"
                placeholder="Код из SMS"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
                required
              />
            ) : (
              <button
                type="button"
                onClick={onSendOtp}
                disabled={loading}
                className="w-full rounded-xl bg-slate-700 py-3 text-sm font-semibold"
              >
                Отправить код
              </button>
            )}
          </>
        )}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {(tab === "email" || otpSent) && (
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sky-500 py-3 font-semibold text-slate-950"
          >
            {loading ? "…" : "Войти"}
          </button>
        )}
      </form>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="mt-4 w-full rounded-xl border border-slate-600 py-3 text-sm"
      >
        Google OAuth
      </button>

      <p className="mt-6 text-center text-sm text-slate-400">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-sky-400 underline">
          Регистрация
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-slate-400">Загрузка…</p>}>
      <LoginForm />
    </Suspense>
  );
}
