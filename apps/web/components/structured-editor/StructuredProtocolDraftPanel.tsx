"use client";

import type {
  StructuredDocumentVersion,
  StructuredProtocolDraft,
  StructuredProtocolSectionId,
} from "@repo/types";
import { CALCULATOR_ALGORITHM_CATALOG, emptyStructuredProtocolDraft, emptyStructuredSection } from "@repo/types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AutosaveStatusBadge } from "@/components/structured-editor/AutosaveStatusBadge";
import { StructuredSectionField } from "@/components/structured-editor/StructuredSectionField";
import { VersionHistoryPanel } from "@/components/structured-editor/VersionHistoryPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RuDateInput } from "@/components/ui/ru-date-input";
import { PROTOCOL_SECTION_DEFS } from "@/lib/structured-editor/sections";
import { useStructuredAutosave } from "@/lib/structured-editor/use-structured-autosave";

type Props = {
  studyId: string;
};

export function StructuredProtocolDraftPanel({ studyId }: Props) {
  const [draft, setDraft] = useState<StructuredProtocolDraft>(emptyStructuredProtocolDraft());
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const saveRemote = useCallback(
    async (next: StructuredProtocolDraft, opts: { isAutosave: boolean; expectedUpdatedAt?: string }) => {
      const res = await fetch(`/api/studies/${studyId}/protocol/structured-draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: next,
          isAutosave: opts.isAutosave,
          expectedUpdatedAt: opts.expectedUpdatedAt,
        }),
      });
      if (res.status === 409) return { ok: false, conflict: true };
      const json = (await res.json().catch(() => null)) as {
        draft?: StructuredProtocolDraft;
        updatedAt?: string;
        error?: string;
      } | null;
      if (!res.ok) return { ok: false, error: json?.error ?? "save failed" };
      if (json?.updatedAt) setUpdatedAt(json.updatedAt);
      if (json?.draft) setDraft(json.draft);
      return { ok: true, updatedAt: json?.updatedAt };
    },
    [studyId],
  );

  const { status, lastSavedAt, error, saveNow } = useStructuredAutosave({
    scope: "protocol",
    entityId: studyId,
    value: draft,
    enabled: open,
    serverUpdatedAt: updatedAt,
    onSave: saveRemote,
    onRecovered: setDraft,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/studies/${studyId}/protocol/structured-draft`);
      const json = (await res.json().catch(() => null)) as {
        draft?: StructuredProtocolDraft | null;
        updatedAt?: string | null;
      } | null;
      if (!cancelled) {
        if (json?.draft) setDraft(json.draft);
        setUpdatedAt(json?.updatedAt ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studyId]);

  function updateSection(
    id: StructuredProtocolSectionId,
    section: StructuredProtocolDraft["sections"][typeof id],
  ) {
    setDraft((prev) => ({
      ...prev,
      sections: { ...prev.sections, [id]: section },
    }));
  }

  if (loading) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black tracking-tight">Структурированный черновик протокола</h2>
          <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
            Шаблон {draft.templateVersion}
            {draft.algorithmVersion ? ` · ${draft.algorithmVersion}` : ""}
          </p>
          {open ? (
            <AutosaveStatusBadge status={status} lastSavedAt={lastSavedAt} error={error} className="mt-1" />
          ) : null}
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Свернуть" : "Открыть редактор"}
        </Button>
      </div>

      {open ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Источник шкалы
              <Input
                value={draft.scaleSource ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, scaleSource: e.target.value }))}
                placeholder={CALCULATOR_ALGORITHM_CATALOG["O-RADS"].sourceLabel}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Версия алгоритма
              <Input
                value={draft.algorithmVersion ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, algorithmVersion: e.target.value }))}
                placeholder="2022"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Дата медицинского алгоритма
              <RuDateInput
                value={draft.algorithmDate ?? ""}
                onChange={(iso) => setDraft((p) => ({ ...p, algorithmDate: iso || undefined }))}
              />
            </label>
          </div>

          <div className="space-y-4">
            {PROTOCOL_SECTION_DEFS.map((def) => {
              const sectionId = def.id as StructuredProtocolSectionId;
              return (
                <StructuredSectionField
                  key={def.id}
                  title={def.title}
                  hint={def.hint}
                  section={draft.sections[sectionId] ?? emptyStructuredSection()}
                  richText={def.richText}
                  showCalculatorInsert={def.id === "classification_category"}
                  onChange={(next) => updateSection(sectionId, next)}
                />
              );
            })}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--clinical-border)] p-4 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={draft.physicianConfirmedConclusion}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, physicianConfirmedConclusion: e.target.checked }))
              }
            />
            <span>Финальное заключение протокола подтверждаю как лечащий врач.</span>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={async () => {
                const ok = await saveNow();
                if (ok) toast.success("Черновик протокола сохранён");
              }}
            >
              Сохранить черновик
            </Button>
            <VersionHistoryPanel
              fetchVersions={async () => {
                const res = await fetch(
                  `/api/studies/${studyId}/protocol/structured-draft?list=versions`,
                );
                const json = (await res.json()) as { versions?: StructuredDocumentVersion[] };
                return json.versions ?? [];
              }}
              onRestore={async (versionId) => {
                const res = await fetch(`/api/studies/${studyId}/protocol/structured-draft`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ versionId }),
                });
                if (!res.ok) {
                  toast.error("Не удалось восстановить версию");
                  return;
                }
                const json = (await res.json()) as { draft: StructuredProtocolDraft; updatedAt: string };
                setDraft(json.draft);
                setUpdatedAt(json.updatedAt);
                toast.success("Версия восстановлена");
              }}
            />
          </div>
        </>
      ) : null}

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Черновик хранится отдельно от legacy-полей протокола. Калькулятор не перезаписывает категорию
        автоматически.
      </p>
    </div>
  );
}
