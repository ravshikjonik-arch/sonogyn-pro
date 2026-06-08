"use client";

import type { PatientMeta } from "@repo/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          phone: phone || undefined,
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
        toast.error("Ошибка сохранения");
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
        <Input type="date" className="mt-1" value={dob} onChange={(e) => setDob(e.target.value)} />
      </label>
      <label className="block text-sm">
        ПМП
        <Input type="date" className="mt-1" value={lmp} onChange={(e) => setLmp(e.target.value)} />
      </label>
      <label className="block text-sm">
        Телефон
        <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
