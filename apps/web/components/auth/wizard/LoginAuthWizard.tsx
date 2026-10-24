"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { useAuth } from "@/app/providers";
import { AuthMessage, authInputClass } from "@/components/auth/AuthScreenShell";
import { AuthWizardLayout } from "@/components/auth/wizard/AuthWizardLayout";
import { Button } from "@/components/ui/button";
import type { OnboardingCharacterId } from "@repo/types";

import { readStoredOnboardingCharacter } from "@/lib/auth/auth-wizard-config";
import { postMfaVerifyLogin, postSignIn } from "@/lib/auth/client-auth-api";
import { requireOnlineForAuth } from "@/lib/auth/translate-auth-error";
import { markSessionAnchorNow } from "@/lib/security/session-anchor";

type Props = {
  nextPath: string;
};

export function LoginAuthWizard({ nextPath }: Props) {
  const router = useRouter();
  const { refresh, user, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [character, setCharacter] = useState<OnboardingCharacterId | "duo">(
    () => readStoredOnboardingCharacter() ?? "duo",
  );

  useEffect(() => {
    setCharacter(readStoredOnboardingCharacter() ?? "duo");
  }, []);

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(nextPath);
    router.refresh();
  }, [ready, user, router, nextPath]);

  const guardOnline = useCallback(() => {
    const offline = requireOnlineForAuth();
    if (offline) {
      setMessage(offline);
      return false;
    }
    return true;
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!guardOnline()) return;

    setLoading(true);
    try {
      const result = await postSignIn({ email: email.trim(), password });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (result.needsMfa && result.factorId) {
        setMfaRequired(true);
        setMfaFactorId(result.factorId);
        return;
      }
      markSessionAnchorNow();
      await refresh();
      router.replace(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onMfaSubmit(e: FormEvent) {
    e.preventDefault();
    if (!mfaFactorId) return;
    setLoading(true);
    try {
      const result = await postMfaVerifyLogin({ factorId: mfaFactorId, code: mfaCode.trim() });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      markSessionAnchorNow();
      await refresh();
      router.replace(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthWizardLayout
      title={mfaRequired ? "Код двухфакторной защиты" : "Вход"}
      subtitle={mfaRequired ? "Введите код из приложения-аутентификатора." : "Email и пароль врача SonoGyn Pro."}
      character={character}
    >
      {mfaRequired ? (
        <form className="space-y-4" onSubmit={(e) => void onMfaSubmit(e)}>
          <label className="block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Код MFA</span>
            <input
              className={authInputClass}
              inputMode="numeric"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
              autoComplete="one-time-code"
            />
          </label>
          <AuthMessage message={message} />
          <Button type="submit" className="w-full" disabled={loading}>
            Подтвердить
          </Button>
        </form>
      ) : (
        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
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
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Пароль</span>
            <input
              className={authInputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <AuthMessage message={message} />
          <Button type="submit" className="w-full" disabled={loading}>
            Войти
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--clinical-foreground-muted)]">
        Нет аккаунта?{" "}
        <Link href="/register" className="font-bold text-[var(--clinical-primary-deep)] hover:underline">
          Регистрация
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-[var(--clinical-foreground-muted)]">
        <Link href="/login?wizard=0" className="hover:underline">
          Классический вход (Telegram, SMS, Яндекс)
        </Link>
      </p>
    </AuthWizardLayout>
  );
}
