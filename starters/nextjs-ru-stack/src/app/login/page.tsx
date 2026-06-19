"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const authError = searchParams.get("error");

  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState(authError ? mapAuthError(authError) : "");
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
    } catch {
      setError("Нет связи с сервером. Проверьте интернет.");
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
        setError(mapAuthError(result.error));
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError(
        "Google OAuth недоступен из вашей сети. Используйте email/пароль или вход по SMS.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">NextAuth v5</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Вход</h1>
        <p className="mt-2 text-sm text-slate-400">
          Google — если настроен; иначе email или SMS через sms.ru.
        </p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("email")}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === "email" ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300"}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setTab("phone")}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === "phone" ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300"}`}
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
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                required
              />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
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
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                required
              />
              {otpSent ? (
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Код из SMS (6 цифр)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                  required
                />
              ) : (
                <button
                  type="button"
                  onClick={() => void onSendOtp()}
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-700 py-3 text-sm font-semibold text-white"
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
          onClick={() => void onGoogleSignIn()}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 py-3 text-sm text-white hover:bg-slate-900"
        >
          <span className="text-lg">G</span>
          Войти через Google
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          Из РФ Google Cloud может быть недоступен — используйте SMS или email.
        </p>

        <p className="mt-6 text-center text-sm text-slate-400">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-sky-400 underline">
            Регистрация
          </Link>
        </p>
      </div>
    </main>
  );
}

function mapAuthError(code: string): string {
  switch (code) {
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthAccountNotLinked":
      return "Google OAuth недоступен или отклонён. Попробуйте SMS/email или VPN.";
    case "CredentialsSignin":
      return "Неверный email, пароль или код SMS.";
    case "Configuration":
      return "Auth не настроен: проверьте GOOGLE_CLIENT_* и NEXTAUTH_SECRET.";
    default:
      return "Ошибка входа. Попробуйте другой способ.";
  }
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-slate-400">Загрузка…</p>}>
      <LoginForm />
    </Suspense>
  );
}
