"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { explainAuthNetworkFailure } from "@/lib/auth-network-error";
import { safeInternalPath } from "@/lib/nav/safe-redirect";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [full_name, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [institution, setInstitution] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const afterAuthPath = safeInternalPath(searchParams.get("next"));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== passwordRepeat) {
      setErrorMessage("Пароли не совпадают.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: full_name.trim(),
          specialization: specialization.trim(),
          institution: institution.trim(),
        }),
        credentials: "same-origin",
      });

      const payload = (await res.json().catch(() => null)) as {
        ok?: boolean;
        needsEmailConfirmation?: boolean;
        error?: string;
      } | null;

      if (!res.ok || !payload?.ok) {
        const errText =
          typeof payload?.error === "string" && payload.error.length > 0
            ? payload.error
            : !res.ok
              ? `HTTP ${res.status}`
              : "Неизвестная ошибка";
        setErrorMessage(explainAuthNetworkFailure(errText));
        return;
      }

      // Supabase часто отдаёт session=null, пока включено «Подтвердить email» — редирект без сессии выглядит как поломка.
      if (!payload.needsEmailConfirmation) {
        router.push(afterAuthPath);
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Аккаунт создан. Откройте письмо на указанной почте и подтвердите email (иногда письмо в «Спам»). После этого войдите на странице «Вход».",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(explainAuthNetworkFailure(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-8 shadow-xl">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          Medical Ultrasound Platform
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Регистрация</h1>
        <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">
          Аккаунт и строки в{" "}
          <code className="rounded bg-slate-100 px-1 text-[11px] dark:bg-slate-900">profiles</code> /{" "}
          <code className="rounded bg-slate-100 px-1 text-[11px] dark:bg-slate-900">users</code> создаются через Supabase
          Auth и триггер на <code className="rounded bg-slate-100 px-1 text-[11px] dark:bg-slate-900">auth.users</code>.
        </p>
      </div>

      <form className="space-y-5" onSubmit={(e) => void onSubmit(e)}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">ФИО специалиста</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)] dark:bg-slate-950 dark:text-white"
            type="text"
            value={full_name}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Иванова Мария Сергеевна"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Специализация</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)] dark:bg-slate-950 dark:text-white"
            type="text"
            value={specialization}
            onChange={(event) => setSpecialization(event.target.value)}
            placeholder="Необязательно"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Учреждение</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)] dark:bg-slate-950 dark:text-white"
            type="text"
            value={institution}
            onChange={(event) => setInstitution(event.target.value)}
            placeholder="Необязательно"
          />
        </label>

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

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Повтор пароля</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)] dark:bg-slate-950 dark:text-white"
            type="password"
            value={passwordRepeat}
            onChange={(event) => setPasswordRepeat(event.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        {errorMessage ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
            {successMessage}
          </p>
        ) : null}

        <Button className="w-full rounded-2xl py-6 text-base" type="submit" disabled={loading}>
          {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
        </Button>
      </form>

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
    </section>
  );
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--clinical-canvas)] px-4 py-12">
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
