"use client";

import { useState, useTransition } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { DoctorVerificationRow } from "@/lib/trust/verification-schemas";

export type AdminVerificationRow = DoctorVerificationRow & {
  user_email?: string | null;
};

export function DoctorVerificationsAdminClient({ rows: initial }: { rows: AdminVerificationRow[] }) {
  const [rows, setRows] = useState(initial);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function review(id: string, decision: "approved" | "rejected") {
    if (decision === "rejected" && !rejectReason[id]?.trim()) {
      toast.error("Укажите причину отклонения");
      return;
    }
    setBusyId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/verifications/${id}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            rejection_reason: decision === "rejected" ? rejectReason[id] : undefined,
          }),
        });
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) {
          toast.error(typeof body?.error === "string" ? body.error : "Не удалось обновить заявку");
          return;
        }
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success(decision === "approved" ? "Врач подтверждён" : "Заявка отклонена");
      } finally {
        setBusyId(null);
      }
    });
  }

  async function openDiploma(id: string) {
    const res = await fetch(`/api/admin/verifications/${id}/diploma-url`);
    const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res.ok || !body?.url) {
      toast.error(body?.error ?? "Не удалось открыть файл");
      return;
    }
    window.open(body.url, "_blank", "noopener,noreferrer");
  }

  if (!rows.length) {
    return (
      <p className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-8 text-sm text-[var(--clinical-foreground-muted)]">
        Очередь пуста — нет заявок со статусом «на проверке».
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-[var(--clinical-foreground)]">{row.full_name}</p>
              <p className="text-sm text-[var(--clinical-foreground-muted)]">{row.specialization}</p>
              {row.user_email ? (
                <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{row.user_email}</p>
              ) : null}
              <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
                Отправлено: {new Date(row.submitted_at).toLocaleString("ru-RU")}
              </p>
              {row.org_name ? (
                <p className="text-xs text-[var(--clinical-foreground-muted)]">Место работы: {row.org_name}</p>
              ) : null}
              {row.diploma_number ? (
                <p className="text-xs text-[var(--clinical-foreground-muted)]">Диплом № {row.diploma_number}</p>
              ) : null}
            </div>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
              )}
            >
              на проверке
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {row.diploma_file_path ? (
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => void openDiploma(row.id)}>
                <ExternalLink className="h-3.5 w-3.5" />
                Открыть диплом
              </Button>
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold text-[var(--clinical-foreground-muted)]" htmlFor={`reason-${row.id}`}>
              Причина отклонения (если отклоняете)
            </label>
            <textarea
              id={`reason-${row.id}`}
              className="min-h-[72px] w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)] px-3 py-2 text-sm"
              value={rejectReason[row.id] ?? ""}
              onChange={(e) => setRejectReason((prev) => ({ ...prev, [row.id]: e.target.value }))}
              placeholder="Например: нечитаемый скан, несовпадение ФИО"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-1"
              disabled={busyId === row.id}
              onClick={() => review(row.id, "approved")}
            >
              <ShieldCheck className="h-4 w-4" />
              Подтвердить
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={busyId === row.id}
              onClick={() => review(row.id, "rejected")}
            >
              Отклонить
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
