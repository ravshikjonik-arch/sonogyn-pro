"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "sonogyn-verify-banner-dismiss-count";
const MAX_DISMISS = 3;

type Props = {
  show: boolean;
};

export function VerifyDoctorReminderBanner({ show }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const count = raw ? Number.parseInt(raw, 10) : 0;
      setVisible(Number.isFinite(count) ? count < MAX_DISMISS : true);
    } catch {
      setVisible(true);
    }
  }, [show]);

  function dismiss() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const count = raw ? Number.parseInt(raw, 10) : 0;
      const next = (Number.isFinite(count) ? count : 0) + 1;
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--clinical-border)] bg-[var(--accent-soft,var(--clinical-primary-muted))]/80 px-4 py-3 text-sm text-[var(--clinical-foreground)]"
      role="status"
    >
      <p className="min-w-0 flex-1 leading-snug">
        Подтвердите статус врача — это займёт около 2 минут. Так коллеги увидят значок ✓ в чате и
        ленте кейсов.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild size="sm">
          <Link href="/verify">Подтвердить</Link>
        </Button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-2 text-[var(--clinical-foreground-muted)] hover:bg-[var(--bg-tertiary)]"
          aria-label="Скрыть напоминание"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
