"use client";

import type { PatientMeta } from "@repo/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { GestationalAgeSummary } from "@/components/clinical/GestationalAgeSummary";
import { LmpDateField } from "@/components/clinical/LmpDateField";
import { Button } from "@/components/ui/button";

type Props = {
  patientId: string;
  initialMeta?: PatientMeta;
};

export function PregnancyLmpPanel({ patientId, initialMeta }: Props) {
  const router = useRouter();
  const [lmp, setLmp] = useState(initialMeta?.lmp ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta: {
            ...initialMeta,
            lmp: lmp || undefined,
          },
        }),
      });
      if (!res.ok) {
        toast.error("Не удалось сохранить ПМП");
        return;
      }
      toast.success("ПМП сохранена — срок пересчитан");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
      <div>
        <h2 className="font-semibold">Срок беременности</h2>
        <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
          Введите первый день последних месячных — срок, ПДР и напоминания о скринингах посчитаются автоматически.
        </p>
      </div>
      <LmpDateField value={lmp} onChange={(iso) => setLmp(iso ?? "")} showSummary={false} />
      <GestationalAgeSummary lmpIso={lmp || undefined} />
      <Button size="sm" disabled={busy} onClick={() => void save()}>
        {busy ? "Сохранение…" : "Сохранить ПМП"}
      </Button>
    </section>
  );
}
