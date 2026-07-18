"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLifecycleLabel, resolveCaseLifecycle } from "@/lib/cases/lifecycle-labels";
import { cn } from "@/lib/utils/cn";

type Props = {
  caseId: string;
  userId: string;
  ownerId: string;
  status: string;
  lifecycleStatus?: string | null;
  isModerator: boolean;
};

export function CaseLifecyclePanel({
  caseId,
  userId,
  ownerId,
  status,
  lifecycleStatus,
  isModerator,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const lifecycle = resolveCaseLifecycle(lifecycleStatus, status);
  const label = formatLifecycleLabel(lifecycle);
  const isOwner = userId === ownerId;
  const isConfirmed = lifecycle === "confirmed";

  async function confirmCase() {
    setBusy(true);
    const response = await fetch(`/api/cases/${caseId}/lifecycle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm" }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(payload?.error ?? "Не удалось подтвердить кейс");
      return;
    }
    toast.success("Кейс подтверждён экспертом");
    router.refresh();
  }

  async function resolveCase() {
    setBusy(true);
    const response = await fetch(`/api/cases/${caseId}/lifecycle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve" }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(payload?.error ?? "Не удалось закрыть кейс");
      return;
    }
    toast.success("Кейс закрыт");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label ? (
        <Badge
          variant="outline"
          className={cn(
            isConfirmed && "border-emerald-600 bg-emerald-50 text-emerald-900",
            lifecycle === "discussion" && "border-violet-600 text-violet-900",
          )}
        >
          {label}
        </Badge>
      ) : null}
      {isConfirmed ? (
        <span className="text-xs text-[var(--clinical-foreground-muted)]">Подтверждено экспертом</span>
      ) : null}
      {isModerator && !isConfirmed ? (
        <Button
          size="sm"
          variant="outline"
          type="button"
          disabled={busy}
          className="gap-1"
          onClick={() => void confirmCase()}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Подтвердить
        </Button>
      ) : null}
      {isOwner && lifecycle !== "resolved" && lifecycle !== "confirmed" && lifecycle !== "archived" ? (
        <Button size="sm" variant="ghost" type="button" disabled={busy} onClick={() => void resolveCase()}>
          Закрыть кейс
        </Button>
      ) : null}
    </div>
  );
}
