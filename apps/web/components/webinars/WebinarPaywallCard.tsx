"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Props = {
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  priceRub: number;
  scheduledAt: string | null;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "Дата уточняется";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WebinarPaywallCard({ courseId, courseTitle, lessonTitle, priceRub, scheduledAt }: Props) {
  const [busy, setBusy] = useState(false);

  async function enroll() {
    setBusy(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        requiresPayment?: boolean;
        confirmationUrl?: string;
      };
      if (body.requiresPayment && body.confirmationUrl) {
        window.location.href = body.confirmationUrl;
        return;
      }
      if (!res.ok || !body.ok) {
        toast.error(body.error ?? "Не удалось оформить доступ");
        return;
      }
      toast.success("Доступ открыт");
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-8 text-center shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">Платный вебинар</p>
      <h1 className="text-xl font-semibold">{lessonTitle}</h1>
      <p className="text-sm text-[var(--clinical-foreground-muted)]">{courseTitle}</p>
      <p className="text-sm">{formatWhen(scheduledAt)}</p>
      <p className="text-2xl font-bold">{priceRub.toLocaleString("ru-RU")} ₽</p>
      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        После оплаты — прямой эфир и запись внутри SonoGyn Pro, чат с лектором.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button disabled={busy} onClick={() => void enroll()}>
          {busy ? "Оформление…" : "Оплатить и получить доступ"}
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/tools/refs/courses/${courseId}`}>О курсе</Link>
        </Button>
      </div>
    </div>
  );
}
