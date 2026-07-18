"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CASE_ANON_CHECKS } from "@/lib/cases/anonymization-gate";
import { cn } from "@/lib/utils/cn";

type Props = {
  mediaId: string;
  caseId: string;
  onConfirmed: () => void;
};

/** Per-file anonymization checklist (gate R6). */
export function CaseMediaAnonymizationPanel({ mediaId, caseId, onConfirmed }: Props) {
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const allOk = checks.every(Boolean) && confirmed;

  async function markPassed() {
    if (!allOk) {
      toast.message("Отметьте все пункты чеклиста");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/cases/${caseId}/media/${mediaId}/anonymization`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed: true }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      toast.error(data?.error ?? "Не удалось подтвердить анонимизацию");
      return;
    }
    toast.success("Анонимизация подтверждена");
    onConfirmed();
  }

  return (
    <div className="space-y-3 border-t border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
        Анонимизация (R6)
      </p>
      <ul className="space-y-2">
        {CASE_ANON_CHECKS.map((label, i) => (
          <li key={label}>
            <label className="flex cursor-pointer items-start gap-2 text-xs">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={checks[i]}
                onChange={(e) => {
                  const next = [...checks];
                  next[i] = e.target.checked;
                  setChecks(next);
                }}
              />
              <span>{label}</span>
            </label>
          </li>
        ))}
      </ul>
      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-2 text-xs">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <span>
          Подтверждаю отсутствие PHI. Не диагноз — интерпретация специалиста.
        </span>
      </label>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={busy || !allOk}
        className={cn("gap-1", allOk && "border-emerald-600 text-emerald-800")}
        onClick={() => void markPassed()}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {busy ? "Сохранение…" : "Подтвердить анонимизацию"}
      </Button>
    </div>
  );
}
