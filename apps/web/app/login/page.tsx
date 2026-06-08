"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { useSupabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { explainAuthNetworkFailure } from "@/lib/auth-network-error";
import { safeInternalPath } from "@/lib/nav/safe-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const nextPath = safeInternalPath(searchParams.get("redirectedFrom"));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: "same-origin",
      });

      const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!res.ok || !payload?.ok) {
        const errText =
          typeof payload?.error === "string" && payload.error.length > 0
            ? payload.error
            : !res.ok
              ? `HTTP ${res.status}`
              : "Неизвестная ошибка";
        setMessage(explainAuthNetworkFailure(errText));
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessage(explainAuthNetworkFailure(msg));
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setMessage("");
    setLoading(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    setLoading(false);
    if (error) setMessage(explainAuthNetworkFailure(error.message));
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-8 shadow-xl">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          Medical Ultrasound Platform
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Вход</h1>
        <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">
          После входа вы попадёте в кабинет. Если страница была закрытая — вернём вас обратно (безопасный редирект только
          внутри сайта).
        </p>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          variant="secondary"
          className="w-full border-slate-200"
          disabled={loading}
          onClick={() => void signInWithGoogle()}
        >
          Войти через Google
        </Button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--clinical-border)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-[var(--clinical-card)] px-3 text-[var(--clinical-foreground-muted)]">или email</span>
        </div>
      </div>

      <form className="space-y-5" onSubmit={(e) => void onSubmit(e)}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)] dark:bg-slate-950 dark:text-white"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="doctor@example.com"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Пароль</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)] dark:bg-slate-950 dark:text-white"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        {message ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </p>
        ) : null}

        <Button className="w-full rounded-2xl py-6 text-base" type="submit" disabled={loading}>
          {loading ? "Входим…" : "Войти"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--clinical-foreground-muted)]">
        Нет аккаунта?{" "}
        <Link className="font-bold text-[var(--clinical-primary-deep)] hover:underline" href="/register">
          Регистрация
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-slate-400">
        <Link href="/landing" className="hover:underline">
          ← Главная страница
        </Link>
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--clinical-canvas)] px-4 py-12">
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
