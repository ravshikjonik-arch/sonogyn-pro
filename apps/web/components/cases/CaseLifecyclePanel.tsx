"use client";

import { Archive, BookOpen, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  CASE_CONFIRMATION_METHOD_LABELS,
  type CaseConfirmationMethod,
} from "@repo/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatLifecycleLabel, resolveCaseLifecycle } from "@/lib/cases/lifecycle-labels";
import { cn } from "@/lib/utils/cn";

type Props = {
  caseId: string;
  userId: string;
  ownerId: string;
  status: string;
  lifecycleStatus?: string | null;
  confirmedDiagnosis?: string | null;
  knowledgeBaseAt?: string | null;
  isModerator: boolean;
  isExpert?: boolean;
};

const METHODS = Object.entries(CASE_CONFIRMATION_METHOD_LABELS) as [CaseConfirmationMethod, string][];

export function CaseLifecyclePanel({
  caseId,
  userId,
  ownerId,
  status,
  lifecycleStatus,
  confirmedDiagnosis,
  knowledgeBaseAt,
  isModerator,
  isExpert = false,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [method, setMethod] = useState<CaseConfirmationMethod>("histology");
  const [methodOther, setMethodOther] = useState("");
  const [diagnosis, setDiagnosis] = useState(confirmedDiagnosis ?? "");
  const [history, setHistory] = useState<
    { toStatus: string; createdAt: string; note?: string | null }[]
  >([]);

  const lifecycle = resolveCaseLifecycle(lifecycleStatus, status);
  const label = formatLifecycleLabel(lifecycle);
  const isOwner = userId === ownerId;
  const canConfirm = isModerator || isExpert;

  useEffect(() => {
    void fetch(`/api/cases/${caseId}/lifecycle/history`)
      .then((r) => r.json())
      .then(
        (json: {
          events?: { toStatus: string; createdAt: string; note?: string | null }[];
        }) => setHistory(json.events ?? []),
      )
      .catch(() => undefined);
  }, [caseId, lifecycle]);

  async function transition(body: Record<string, unknown>, success: string) {
    setBusy(true);
    const response = await fetch(`/api/cases/${caseId}/lifecycle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(payload?.error ?? "Не удалось изменить статус");
      return;
    }
    toast.success(success);
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        {label ? (
          <Badge
            variant="outline"
            className={cn(
              lifecycle === "confirmed" && "border-emerald-600 bg-emerald-50 text-emerald-900",
              lifecycle === "discussion" && "border-violet-600 text-violet-900",
              lifecycle === "archived" && "border-slate-500 text-slate-700",
            )}
          >
            {label}
          </Badge>
        ) : null}
        {confirmedDiagnosis?.trim() ? (
          <Badge variant="outline" className="border-emerald-700 text-emerald-900">
            ✓ {confirmedDiagnosis.trim()}
          </Badge>
        ) : null}
        {knowledgeBaseAt ? (
          <Badge variant="outline" className="border-blue-600 text-blue-900">
            База знаний
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {isOwner && lifecycle !== "resolved" && lifecycle !== "confirmed" && lifecycle !== "archived" ? (
          <Button size="sm" variant="ghost" type="button" disabled={busy} onClick={() => void transition({ action: "resolve" }, "Кейс закрыт")}>
            Закрыть (RESOLVED)
          </Button>
        ) : null}

        {canConfirm && lifecycle !== "confirmed" && lifecycle !== "archived" ? (
          <Button
            size="sm"
            variant="outline"
            type="button"
            disabled={busy}
            className="gap-1"
            onClick={() => setShowConfirmForm((v) => !v)}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Подтвердить диагноз
          </Button>
        ) : null}

        {isModerator && lifecycle === "confirmed" && !knowledgeBaseAt ? (
          <Button
            size="sm"
            variant="outline"
            type="button"
            disabled={busy}
            className="gap-1"
            onClick={() =>
              void transition({ action: "publish_knowledge_base" }, "Кейс перенесён в базу знаний")
            }
          >
            <BookOpen className="h-3.5 w-3.5" />
            В базу знаний
          </Button>
        ) : null}

        {isModerator && lifecycle !== "archived" ? (
          <Button
            size="sm"
            variant="ghost"
            type="button"
            disabled={busy}
            className="gap-1"
            onClick={() => void transition({ action: "archive" }, "Кейс архивирован")}
          >
            <Archive className="h-3.5 w-3.5" />
            Архив
          </Button>
        ) : null}

        {(isModerator || isOwner) && (lifecycle === "resolved" || lifecycle === "archived") ? (
          <Button
            size="sm"
            variant="ghost"
            type="button"
            disabled={busy}
            onClick={() => void transition({ action: "reopen" }, "Обсуждение возобновлено")}
          >
            Reopen
          </Button>
        ) : null}
      </div>

      {showConfirmForm ? (
        <div className="space-y-3 rounded-xl border border-dashed border-[var(--clinical-border)] p-4">
          <label className="flex flex-col gap-1 text-sm">
            Метод подтверждения
            <select
              className="h-10 rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3"
              value={method}
              onChange={(e) => setMethod(e.target.value as CaseConfirmationMethod)}
            >
              {METHODS.map(([value, labelRu]) => (
                <option key={value} value={value}>
                  {labelRu}
                </option>
              ))}
            </select>
          </label>
          {method === "other" ? (
            <Input
              placeholder="Пояснение метода"
              value={methodOther}
              onChange={(e) => setMethodOther(e.target.value)}
            />
          ) : null}
          <Input
            placeholder="Подтверждённый диагноз (кратко)"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() =>
              void transition(
                {
                  action: "confirm",
                  confirmationMethod: method,
                  confirmationMethodOther: method === "other" ? methodOther : undefined,
                  confirmedDiagnosis: diagnosis,
                },
                "Диагноз подтверждён",
              )
            }
          >
            Подтвердить
          </Button>
        </div>
      ) : null}

      {history.length > 0 ? (
        <details className="text-xs text-[var(--clinical-foreground-muted)]">
          <summary className="cursor-pointer font-semibold">История статусов</summary>
          <ul className="mt-2 space-y-1">
            {history.map((event, i) => (
              <li key={`${event.createdAt}-${i}`}>
                → {event.toStatus.toUpperCase()} · {new Date(event.createdAt).toLocaleString()}
                {event.note ? ` · ${event.note}` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
