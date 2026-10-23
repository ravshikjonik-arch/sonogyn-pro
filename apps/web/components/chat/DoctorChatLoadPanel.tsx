"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { DoctorChatLoadState } from "@/lib/chat/resolve-doctor-chat-load-state";
import { cn } from "@/lib/utils/cn";

type Props = {
  state: DoctorChatLoadState;
  className?: string;
};

export function DoctorChatLoadPanel({ state, className }: Props) {
  const isAuth = state.kind === "auth_required";
  const isMigration = state.kind === "migration";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-sm",
        isAuth &&
          "border-[var(--clinical-border)] bg-[var(--clinical-muted)]/50 text-[var(--clinical-foreground)]",
        isMigration &&
          "border-amber-300/70 bg-amber-50/90 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
        !isAuth &&
          !isMigration &&
          "border-[var(--clinical-border)] bg-[var(--clinical-card)] text-[var(--clinical-foreground)]",
        className,
      )}
      role="status"
    >
      <p className="font-bold">{state.title}</p>
      <p className="mt-2 text-xs leading-relaxed opacity-90">{state.detail}</p>
      {state.showMigrationHint ? (
        <p className="mt-2 text-xs">
          SQL:{" "}
          <code className="rounded bg-black/10 px-1 dark:bg-white/10">
            packages/database/supabase/migrations/20260605130000_doctor_chat.sql
          </code>
          {" · "}
          gate:{" "}
          <code className="rounded bg-black/10 px-1 dark:bg-white/10">
            20260731120000_medical_access_gate.sql
          </code>
        </p>
      ) : null}
      {state.showLoginCta ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/login?redirectedFrom=/cases?tab=chat">Войти по email</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/profile">Профиль врача</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
