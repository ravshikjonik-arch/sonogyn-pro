"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/app/providers";
import { AuthMessage } from "@/components/auth/AuthScreenShell";
import { BirthDateField } from "@/components/ui/BirthDateField";
import { Button } from "@/components/ui/button";
import { postSignIn, postSignUp } from "@/lib/auth/client-auth-api";
import { parseBirthDateInput, validateBirthDateIso } from "@/lib/auth/birth-date";
import { birthDateErrorMessage } from "@repo/types";
import { normalizeRussianFio } from "@/lib/auth/doctor-display";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";
import {
  requireOnlineForAuth,
  SIGN_UP_GENERIC_MSG,
  translateAuthError,
} from "@/lib/auth/translate-auth-error";
import { cn } from "@/lib/utils/cn";

type Mode = "login" | "register";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-violet-200/40 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/40";

type Props = {
  className?: string;
};

export function LandingAuthCard({ className }: Props) {
  const router = useRouter();
  const { refresh, user, ready } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthDateIso, setBirthDateIso] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);

  if (ready && user) {
    return (
      <div
        id="join"
        className={cn(
          "rounded-2xl border border-violet-400/40 bg-[#12081f]/92 p-5 shadow-[0_0_48px_rgba(124,58,237,0.45)] backdrop-blur-xl",
          className,
        )}
      >
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-300">SonoGyn Pro</p>
        <h2 className="mt-2 text-lg font-black text-white">Вы уже вошли</h2>
        <p className="mt-1 text-sm text-violet-100/70">Продолжите работу в кабинете.</p>
        <Button className="mt-4 w-full font-bold" asChild>
          <Link href="/app">В личный кабинет</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const online = requireOnlineForAuth();
    if (online) {
      setTone("error");
      setMessage(online);
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const res = await postSignIn({ email: email.trim(), password });
        if (!res.ok) {
          setTone("error");
          setMessage(translateAuthError(res.error) || "Не удалось войти");
          return;
        }
        markSessionAnchorNow();
        await refresh();
        router.replace("/app");
        return;
      }

      const fio = normalizeRussianFio(fullName);
      if (!fio || fio.split(/\s+/).length < 2) {
        setTone("error");
        setMessage("Укажите ФИО (фамилия и имя)");
        return;
      }
      if (!birthDateIso.trim()) {
        setTone("error");
        setMessage(birthDateErrorMessage("empty"));
        return;
      }
      const birthIssue = validateBirthDateIso(birthDateIso);
      if (birthIssue) {
        setTone("error");
        setMessage(birthDateErrorMessage(birthIssue));
        return;
      }
      const birth = parseBirthDateInput(birthDateIso);
      if (!birth) {
        setTone("error");
        setMessage(birthDateErrorMessage("invalid"));
        return;
      }

      const res = await postSignUp({
        email: email.trim(),
        password,
        full_name: fio,
        birth_year: birth.year,
        birth_date: birth.iso,
        specialization: "Акушер-гинеколог",
        preferred_locale: "ru",
      });
      if (!res.ok) {
        setTone("error");
        setMessage(translateAuthError(res.error) || SIGN_UP_GENERIC_MSG);
        return;
      }
      if (res.needsEmailConfirmation) {
        setTone("success");
        setMessage("Проверьте почту и подтвердите email — затем войдите.");
        setMode("login");
        return;
      }
      markSessionAnchorNow();
      await refresh();
      router.replace("/app");
    } catch (err) {
      setTone("error");
      setMessage(err instanceof Error ? err.message : "Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id="join"
      className={cn(
        "rounded-2xl border border-violet-400/40 bg-[#12081f]/92 p-5 shadow-[0_0_56px_rgba(124,58,237,0.5)] backdrop-blur-xl ring-1 ring-violet-400/20",
        className,
      )}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-300">
        Присоединяйтесь к SonoGyn Pro
      </p>
      <h2 className="mt-2 text-xl font-black leading-snug text-white">Вход и регистрация</h2>
      <p className="mt-1 text-xs leading-relaxed text-violet-100/70">
        Для врачей УЗИ и АГ. Не диагноз — инструмент специалиста.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-black/35 p-1">
        <button
          type="button"
          className={cn(
            "rounded-lg py-2 text-xs font-bold transition",
            mode === "login" ? "bg-violet-600 text-white" : "text-violet-200/70 hover:text-white",
          )}
          onClick={() => {
            setMode("login");
            setMessage("");
          }}
        >
          Войти
        </button>
        <button
          type="button"
          className={cn(
            "rounded-lg py-2 text-xs font-bold transition",
            mode === "register" ? "bg-violet-600 text-white" : "text-violet-200/70 hover:text-white",
          )}
          onClick={() => {
            setMode("register");
            setMessage("");
          }}
        >
          Регистрация
        </button>
      </div>

      <form className="mt-4 space-y-3" onSubmit={(e) => void onSubmit(e)}>
        {mode === "register" ? (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-violet-100/80">ФИО</span>
              <input
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                autoComplete="name"
                required
              />
            </label>
            <BirthDateField
              value={birthDateIso}
              onChange={setBirthDateIso}
              required
              className={inputClass}
              labelClassName="text-xs font-semibold text-violet-100/80"
            />
          </>
        ) : null}

        <label className="block">
          <span className="text-xs font-semibold text-violet-100/80">Email</span>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="doctor@clinic.ru"
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-violet-100/80">Пароль</span>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "Минимум 8 символов" : "••••••••"}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={mode === "register" ? 8 : 1}
            required
          />
        </label>

        {message ? <AuthMessage message={message} tone={tone} /> : null}

        <Button type="submit" className="w-full font-bold" disabled={loading || !ready}>
          {loading ? "…" : mode === "login" ? "Войти" : "Создать аккаунт"}
        </Button>
      </form>

      <p className="mt-3 text-center text-[11px] text-violet-200/55">
        Полная форма:{" "}
        <Link href="/login" className="font-semibold text-violet-200 underline-offset-2 hover:underline">
          вход
        </Link>
        {" · "}
        <Link href="/register" className="font-semibold text-violet-200 underline-offset-2 hover:underline">
          регистрация
        </Link>
      </p>
    </div>
  );
}
