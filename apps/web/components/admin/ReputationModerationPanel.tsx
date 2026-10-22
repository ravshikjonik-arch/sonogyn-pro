"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReputationModerationPanel() {
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  function submitPenalty() {
    if (!userId.trim() || reason.trim().length < 3) {
      toast.error("Укажите UUID пользователя и причину (от 3 символов)");
      return;
    }
    setBusy(true);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/reputation/penalty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userId.trim(), reason: reason.trim() }),
        });
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) {
          toast.error(body?.error ?? "Не удалось применить штраф");
          return;
        }
        toast.success("Штраф −20 репутации записан в аудит-лог");
        setReason("");
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[var(--clinical-foreground)]">Штраф репутации</h2>
      <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
        Модерация: −20 баллов через <code className="text-xs">moderation_penalty</code>. Пересчёт профиля
        выполняется на сервере.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold" htmlFor="penalty-user-id">
            User ID (UUID)
          </label>
          <Input
            id="penalty-user-id"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="00000000-0000-4000-8000-000000000001"
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold" htmlFor="penalty-reason">
            Причина
          </label>
          <textarea
            id="penalty-reason"
            className="min-h-[88px] w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-muted)] px-3 py-2 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Кратко: нарушение правил сообщества, спам, PHI…"
          />
        </div>
      </div>
      <Button type="button" className="mt-4" disabled={busy} onClick={submitPenalty}>
        {busy ? "Отправка…" : "Применить штраф −20"}
      </Button>
    </div>
  );
}
