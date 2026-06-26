"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/app/providers";
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
  const supabase = useSupabase();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const lifecycle = resolveCaseLifecycle(lifecycleStatus, status);
  const label = formatLifecycleLabel(lifecycle);
  const isOwner = userId === ownerId;
  const isConfirmed = lifecycle === "confirmed";

  async function confirmCase() {
    setBusy(true);
    const { error } = await supabase.rpc("confirm_teaching_case", { p_case_id: caseId });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("schema cache") || error.code === "PGRST202"
          ? "RPC не в кэше — выполните BUNDLE_RPC_CONFIRM.sql в SQL Editor"
          : error.message,
      );
      return;
    }
    toast.success("Кейс подтверждён экспертом");
    router.refresh();
  }

  async function resolveCase() {
    setBusy(true);
    const { error } = await supabase
      .from("cases")
      .update({ lifecycle_status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", caseId)
      .eq("user_id", userId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
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
