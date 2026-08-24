"use client";

import type { PatientMeta } from "@repo/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isoFromRu, maskRuDateInput, ruFromIso } from "@/lib/utils/ru-date";
import { detectPhi } from "@/lib/security/phi-detection";

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
  const [lmp, setLmp] = useState(ruFromIso(initial?.meta?.lmp));
  const [notes, setNotes] = useState(initial?.meta?.notes ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const label = displayLabel.trim();
    if (!label) {
      toast.error("Укажите обезличенную метку кейса");
      return;
    }

    const labelPhi = detectPhi(label);
    if (!labelPhi.ok) {
      toast.error(
        "В метке обнаружены персональные данные. Используйте формат «Кейс #12» или «O-RADS 4 слева».",
      );
      return;
    }

    const lmpIso = lmp.trim() ? isoFromRu(lmp) : undefined;
    if (lmp.trim() && !lmpIso) {
      toast.error("ПМП: формат ДД.ММ.ГГГГ, например 01.06.2026");
      return;
    }

    const notesPhi = notes.trim() ? detectPhi(notes) : { ok: true as const, reasons: [] as string[] };
    if (!notesPhi.ok) {
      toast.error("В заметках есть ПДн пациента. Оставьте только клиническое описание без ФИО и документов.");
      return;
    }

    setBusy(true);
    try {
      const body = {
        display_label: label,
        meta: {
          lmp: lmpIso,
          notes: notes.trim() || undefined,
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
      router.push(`/profile/patients/${json.patient.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold">{patientId ? "Редактирование кейса" : "Новый кейс"}</h1>
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-xs leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-semibold">Только для врачей · без ПДн пациентов</p>
        <p className="mt-1">
          Не указывайте ФИО, телефон, СНИЛС, полис ОМС, номер карты и другие идентификаторы. За
          нарушение — блокировка аккаунта. Примеры меток: «Кейс #12», «TI-RADS TR4», «O-RADS 4
          левый».
        </p>
      </div>
      <label className="block text-sm">
        Метка кейса *
        <Input
          className="mt-1 text-lg"
          value={displayLabel}
          onChange={(e) => setDisplayLabel(e.target.value)}
          placeholder="Кейс #12 · O-RADS 4 слева"
          required
        />
      </label>
      <label className="block text-sm">
        ПМП (для расчёта срока беременности, без ФИО)
        <Input
          className="mt-1 font-mono tracking-wide"
          inputMode="numeric"
          value={lmp}
          onChange={(e) => setLmp(maskRuDateInput(e.target.value))}
          onPaste={(e) => {
            e.preventDefault();
            setLmp(maskRuDateInput(e.clipboardData.getData("text")));
          }}
          placeholder="01.06.2026"
        />
        <span className="mt-1 block text-xs text-[var(--clinical-foreground-muted)]">
          Формат ДД.ММ.ГГГГ — только клинический контекст, не дата рождения пациента
        </span>
      </label>
      <label className="block text-sm">
        Клинические заметки
        <textarea
          className="mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 text-sm"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Обезличенное описание находки или тактики"
        />
      </label>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Сохранение…" : "Сохранить"}
      </Button>
    </form>
  );
}
