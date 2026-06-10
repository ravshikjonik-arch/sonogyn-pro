"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth, useSupabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import {
  buildFioAbbreviation,
  normalizeRussianFio,
  PRODUCT_OWNER_FIO,
  PRODUCT_OWNER_FIO_SHORT,
} from "@/lib/auth/doctor-display";
import { uploadClinicalAvatar } from "@/lib/supabase/medical-storage";
import { wipeWebClinicalLocalData } from "@/lib/security/wipe-clinical-local";

type Props = {
  initial: {
    full_name: string | null;
    institution: string | null;
    specialization: string | null;
  };
};

export function ProfileSettingsForm({ initial }: Props) {
  const supabase = useSupabase();
  const router = useRouter();
  const { user } = useAuth();
  const [full_name, setFullName] = useState(initial.full_name ?? "");
  const [institution, setInstitution] = useState(initial.institution ?? "");
  const [specialization, setSpecialization] = useState(initial.specialization ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          full_name: full_name.trim(),
          institution: institution.trim() || undefined,
          specialization: specialization.trim() || undefined,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: unknown; profile?: unknown } | null;
      if (!res.ok) {
        const err =
          typeof payload?.error === "string"
            ? payload.error
            : payload?.error && typeof payload.error === "object"
              ? JSON.stringify(payload.error)
              : `HTTP ${res.status}`;
        setMessage(err);
        return;
      }
      setMessage("Saved. Profile and doctor record are synced.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onRevokeAllSessions() {
    const confirmed = window.confirm(
      "Выйти на всех устройствах? Текущая сессия тоже завершится. Используйте, если потеряли телефон или подозреваете доступ посторонних.",
    );
    if (!confirmed) return;

    setMessage("");
    setRevoking(true);
    try {
      const res = await fetch("/api/auth/revoke-all-sessions", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setMessage(payload?.error ?? `HTTP ${res.status}`);
        return;
      }

      wipeWebClinicalLocalData();
      await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
      await supabase.auth.signOut();
      router.replace("/login?reason=all-devices-signed-out");
      router.refresh();
    } finally {
      setRevoking(false);
    }
  }

  async function onAvatarPick(file: File | null) {
    if (!file || !user?.id) return;
    setMessage("");
    setLoading(true);
    try {
      const up = await uploadClinicalAvatar(supabase, user.id, file);
      if ("error" in up) {
        setMessage(up.error);
        return;
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ avatar_storage_path: up.path }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage("Avatar updated. Refresh the page to see the new preview.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={(ev) => void onSubmit(ev)}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Фамилия, имя, отчество
          </span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)] dark:bg-slate-950 dark:text-white"
            value={full_name}
            onChange={(ev) => setFullName(ev.target.value)}
            placeholder={PRODUCT_OWNER_FIO}
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            В кабинете:{" "}
            <span className="font-semibold text-[var(--clinical-primary-deep)]">
              {full_name.trim()
                ? buildFioAbbreviation(normalizeRussianFio(full_name)) ?? "—"
                : PRODUCT_OWNER_FIO_SHORT}
            </span>
          </p>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Специализация</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)] dark:bg-slate-950 dark:text-white"
            value={specialization}
            onChange={(ev) => setSpecialization(ev.target.value)}
            placeholder="Напр. акушер-гинеколог"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Учреждение</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[var(--clinical-primary)] focus:ring-4 focus:ring-[var(--clinical-ring)] dark:bg-slate-950 dark:text-white"
            value={institution}
            onChange={(ev) => setInstitution(ev.target.value)}
            placeholder="Клиника / отделение"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/40">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Фото профиля (Supabase Storage)</p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Загружается в приватный bucket <code className="rounded bg-white px-1 dark:bg-slate-950">clinical-avatars</code>{" "}
          по политикам RLS.
        </p>
        <input
          type="file"
          accept="image/*"
          className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--clinical-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-95"
          disabled={loading || !user?.id}
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            ev.target.value = "";
            void onAvatarPick(f ?? null);
          }}
        />
      </div>

      {message ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            message.startsWith("Saved") || message.startsWith("Avatar")
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      ) : null}

      <Button type="submit" className="rounded-2xl px-8" disabled={loading || revoking}>
        {loading ? "Сохранение…" : "Сохранить профиль"}
      </Button>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
        <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Безопасность сессии</p>
        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
          Сбросит вход на всех телефонах и браузерах. Офлайн-устройство выйдет при следующей синхронизации с
          сервером (или через 24 ч без сети).
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 rounded-2xl border-amber-300 text-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-100"
          disabled={loading || revoking}
          onClick={() => void onRevokeAllSessions()}
        >
          {revoking ? "Выход…" : "Выйти на всех устройствах"}
        </Button>
      </div>
    </form>
  );
}
