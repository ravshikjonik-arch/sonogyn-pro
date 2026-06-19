"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "register_failed");
        return;
      }
      router.push("/login?registered=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold">Регистрация</h1>
      <p className="mt-2 text-sm text-slate-400">Email + пароль (fallback без Google).</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          placeholder="ФИО"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
          required
        />
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
          placeholder="Пароль (мин. 8 символов)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
          minLength={8}
          required
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-sky-500 py-3 font-semibold text-slate-950"
        >
          {loading ? "…" : "Создать аккаунт"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-sky-400 underline">
          Войти
        </Link>
      </p>
    </main>
  );
}
