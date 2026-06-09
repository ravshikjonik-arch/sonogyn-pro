"use client";

import type { PatientMeta } from "@repo/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LmpDateField } from "@/components/clinical/LmpDateField";
import { RuDateInput } from "@/components/ui/ru-date-input";

type Props = {
  patientId?: string;
  initial?: {
    display_label: string;
    external_ref?: string | null;
    meta?: PatientMeta;
  };
};

export function PatientForm({ patientId, initial }: Props) {
  const router = useRouter();
  const [displayLabel, setDisplayLabel] = useState(initial?.display_label ?? "");
  const [externalRef, setExternalRef] = useState(initial?.external_ref ?? "");
  const [dob, setDob] = useState(initial?.meta?.date_of_birth ?? "");
  const [lmp, setLmp] = useState(initial?.meta?.lmp ?? "");
  const [phone, setPhone] = useState(initial?.meta?.phone ?? "");
  const [snils, setSnils] = useState(initial?.meta?.snils ?? "");
  const [omsPolicy, setOmsPolicy] = useState(initial?.meta?.oms_policy ?? "");
  const [notes, setNotes] = useState(initial?.meta?.notes ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayLabel.trim()) {
      toast.error("Укажите имя или метку пациента");
      return;
    }
    setBusy(true);
    try {
      const body = {
        display_label: displayLabel.trim(),
        external_ref: externalRef.trim() || undefined,
        meta: {
          date_of_birth: dob || undefined,
          lmp: lmp || undefined,
          phone: phone.trim() || undefined,
          snils: snils.replace(/\D/g, "") || undefined,
          oms_policy: omsPolicy.replace(/\D/g, "") || undefined,
          notes: notes || undefined,
        },
      };
      const url = patientId ? `/api/patients/${patientId}` : "/api/patients";
      const method = patientId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: unknown } | null;
        const msg =
          typeof err?.error === "string"
            ? err.error
            : err?.error && typeof err.error === "object"
              ? "Проверьте поля формы"
              : "Ошибка сохранения";
        toast.error(msg);
        return;
      }
      const json = (await res.json()) as { patient: { id: string } };
      toast.success("Сохранено");
      router.push(`/patients/${json.patient.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold">{patientId ? "Редактирование" : "Новый пациент"}</h1>
      <label className="block text-sm">
        ФИО / метка *
        <Input className="mt-1 text-lg" value={displayLabel} onChange={(e) => setDisplayLabel(e.target.value)} required />
      </label>
      <label className="block text-sm">
        Внешний № карты
        <Input className="mt-1" value={externalRef} onChange={(e) => setExternalRef(e.target.value)} />
      </label>
      <label className="block text-sm">
        Дата рождения
        <RuDateInput className="mt-1" value={dob} onChange={(iso) => setDob(iso ?? "")} />
        <span className="mt-1 block text-xs text-[var(--clinical-foreground-muted)]">дд.мм.гггг — точки подставятся сами</span>
      </label>
      <LmpDateField value={lmp} onChange={(iso) => setLmp(iso ?? "")} />
      <label className="block text-sm">
        Телефон
        <Input
          className="mt-1"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+79001234567"
        />
      </label>
      <label className="block text-sm">
        СНИЛС
        <Input
          className="mt-1 font-mono"
          value={snils}
          onChange={(e) => setSnils(e.target.value.replace(/[^\d-]/g, "").slice(0, 14))}
          placeholder="12345678901"
          inputMode="numeric"
        />
        <span className="mt-1 block text-xs text-[var(--clinical-foreground-muted)]">11 цифр, проверка контрольной суммы на сервере</span>
      </label>
      <label className="block text-sm">
        Полис ОМС
        <Input
          className="mt-1 font-mono"
          value={omsPolicy}
          onChange={(e) => setOmsPolicy(e.target.value.replace(/\D/g, "").slice(0, 16))}
          placeholder="16 цифр"
          inputMode="numeric"
        />
      </label>
      <label className="block text-sm">
        Заметки
        <textarea
          className="mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 text-sm"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Сохранение…" : "Сохранить"}
      </Button>
    </form>
  );
}
