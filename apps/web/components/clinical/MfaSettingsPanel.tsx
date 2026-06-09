"use client";

import { useCallback, useEffect, useState } from "react";

import { useSupabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TotpFactor = {
  id: string;
  friendly_name?: string;
  status: string;
};

export function MfaSettingsPanel() {
  const supabase = useSupabase();
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totp = (data?.totp ?? []) as TotpFactor[];
      setFactors(totp.filter((f) => f.status === "verified"));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Не удалось загрузить MFA");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function startEnroll() {
    setMessage(null);
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator",
      });
      if (error) throw error;
      setFactorId(data.id);
      setQr(data.totp.qr_code);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "MFA недоступен. Включите TOTP в Supabase Dashboard.");
      setEnrolling(false);
    }
  }

  async function confirmEnroll() {
    if (!factorId || !verifyCode.trim()) return;
    setMessage(null);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const verified = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode.trim(),
      });
      if (verified.error) throw verified.error;
      setQr(null);
      setFactorId(null);
      setVerifyCode("");
      setEnrolling(false);
      setMessage("Двухфакторная аутентификация включена.");
      await refresh();
    } catch {
      setMessage("Неверный код. Попробуйте снова.");
    }
  }

  async function unenroll(id: string) {
    setMessage(null);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) {
      setMessage("Не удалось отключить MFA.");
      return;
    }
    setMessage("MFA отключён.");
    await refresh();
  }

  return (
    <section className="mt-10 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--clinical-foreground-muted)]">
        Двухфакторная аутентификация (TOTP)
      </p>
      <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">
        Google Authenticator / 1Password — рекомендуется для доступа к клиническим данным.
      </p>

      {loading ? <p className="mt-4 text-sm">Загрузка…</p> : null}

      {!loading && factors.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {factors.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-[var(--clinical-border)] bg-white px-4 py-3 text-sm dark:bg-slate-950"
            >
              <span>TOTP · {f.friendly_name ?? "Authenticator"}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void unenroll(f.id)}>
                Отключить
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && factors.length === 0 && !enrolling ? (
        <Button type="button" className="mt-4" onClick={() => void startEnroll()}>
          Подключить TOTP
        </Button>
      ) : null}

      {enrolling && qr ? (
        <div className="mt-4 space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR для authenticator" className="mx-auto h-40 w-40 rounded-lg bg-white p-2" />
          <label className="block text-sm">
            Код из приложения
            <Input
              className="mt-1"
              inputMode="numeric"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="000000"
            />
          </label>
          <Button type="button" onClick={() => void confirmEnroll()}>
            Подтвердить
          </Button>
        </div>
      ) : null}

      {message ? <p className="mt-4 text-sm font-medium text-[var(--clinical-primary-deep)]">{message}</p> : null}
    </section>
  );
}
