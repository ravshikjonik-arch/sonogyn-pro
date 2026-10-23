"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { submitMessengerReport } from "@/lib/messenger/api-client";

type Props = {
  open: boolean;
  chatId: string;
  messageId: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export function MessengerReportDialog({ open, chatId, messageId, onClose, onSubmitted }: Props) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await submitMessengerReport({ chatId, messageId, reason: reason.trim() });
      setReason("");
      onSubmitted();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="messenger-report-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 shadow-lg">
        <h2 id="messenger-report-title" className="text-sm font-bold text-[var(--clinical-foreground)]">
          Жалоба на сообщение
        </h2>
        <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
          PHI, спам, оскорбления — модераторы увидят жалобу в очереди.
        </p>
        <textarea
          className="mt-3 min-h-[88px] w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-background)] px-3 py-2 text-sm"
          placeholder="Кратко опишите проблему (3–1000 символов)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={1000}
        />
        {error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
        <div className="mt-3 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Отмена
          </Button>
          <Button type="button" size="sm" onClick={() => void submit()} disabled={busy || reason.trim().length < 3}>
            {busy ? "…" : "Отправить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
