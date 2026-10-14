"use client";

import type { StructuredCaseDocument, StructuredCaseSectionId, StructuredDocumentVersion } from "@repo/types";
import { emptyStructuredCaseDocument, emptyStructuredSection } from "@repo/types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AutosaveStatusBadge } from "@/components/structured-editor/AutosaveStatusBadge";
import { StructuredSectionField } from "@/components/structured-editor/StructuredSectionField";
import { VersionHistoryPanel } from "@/components/structured-editor/VersionHistoryPanel";
import { Button } from "@/components/ui/button";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { structuredCaseToDocumentSpec } from "@/lib/structured-editor/case-to-pdf-spec";
import { CASE_SECTION_DEFS } from "@/lib/structured-editor/sections";
import { useStructuredAutosave } from "@/lib/structured-editor/use-structured-autosave";

type Props = {
  caseId: string;
  caseTitle: string;
  canEdit: boolean;
};

export function StructuredCaseEditor({ caseId, caseTitle, canEdit }: Props) {
  const [document, setDocument] = useState<StructuredCaseDocument>(emptyStructuredCaseDocument());
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(canEdit);

  const saveRemote = useCallback(
    async (next: StructuredCaseDocument, opts: { isAutosave: boolean; expectedUpdatedAt?: string }) => {
      const res = await fetch(`/api/cases/${caseId}/structured`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: next,
          isAutosave: opts.isAutosave,
          expectedUpdatedAt: opts.expectedUpdatedAt,
        }),
      });
      if (res.status === 409) return { ok: false, conflict: true };
      const json = (await res.json().catch(() => null)) as {
        document?: StructuredCaseDocument;
        updatedAt?: string;
        error?: string;
      } | null;
      if (!res.ok) return { ok: false, error: json?.error ?? "save failed" };
      if (json?.updatedAt) setUpdatedAt(json.updatedAt);
      if (json?.document) setDocument(json.document);
      return { ok: true, updatedAt: json?.updatedAt };
    },
    [caseId],
  );

  const { status, lastSavedAt, error, saveNow } = useStructuredAutosave({
    scope: "case",
    entityId: caseId,
    value: document,
    enabled: canEdit && expanded,
    serverUpdatedAt: updatedAt,
    onSave: saveRemote,
    onRecovered: setDocument,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/cases/${caseId}/structured`);
      const json = (await res.json().catch(() => null)) as {
        document?: StructuredCaseDocument | null;
        updatedAt?: string | null;
      } | null;
      if (!cancelled) {
        if (json?.document) setDocument(json.document);
        setUpdatedAt(json?.updatedAt ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  function updateSection(id: StructuredCaseSectionId, section: StructuredCaseDocument["sections"][typeof id]) {
    setDocument((prev) => ({
      ...prev,
      sections: { ...prev.sections, [id]: section },
    }));
  }

  const pdfSpec = structuredCaseToDocumentSpec({ caseTitle, document });

  if (loading) {
    return <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка структурированного редактора…</p>;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight">Структурированный кейс</h2>
          <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
            Шаблон {document.templateVersion}
            {document.algorithmVersion ? ` · алгоритм ${document.algorithmVersion}` : ""}
          </p>
          <AutosaveStatusBadge status={status} lastSavedAt={lastSavedAt} error={error} className="mt-1" />
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Свернуть" : "Редактировать"}
            </Button>
          ) : null}
          <DocumentExportToolbar spec={pdfSpec} compact />
        </div>
      </div>

      {expanded ? (
        <>
          <div className="space-y-4">
            {CASE_SECTION_DEFS.map((def) => {
              const sectionId = def.id as StructuredCaseSectionId;
              return (
                <StructuredSectionField
                  key={def.id}
                  title={def.title}
                  hint={def.hint}
                  section={document.sections[sectionId] ?? emptyStructuredSection()}
                  richText={def.richText}
                  readOnly={!canEdit}
                  showCalculatorInsert={def.id === "calculator_result" && canEdit}
                  showMediaInsert={def.id === "deidentified_images" && canEdit}
                  onChange={(next) => updateSection(sectionId, next)}
                />
              );
            })}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--clinical-border)] p-4 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={document.physicianConfirmedConclusion}
              disabled={!canEdit}
              onChange={(e) =>
                setDocument((prev) => ({ ...prev, physicianConfirmedConclusion: e.target.checked }))
              }
            />
            <span>
              Подтверждаю финальное заключение как лечащий врач. Материал не содержит идентифицирующих данных
              пациента.
            </span>
          </label>

          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={async () => {
                  const ok = await saveNow();
                  if (ok) toast.success("Черновик кейса сохранён");
                }}
              >
                Сохранить черновик
              </Button>
              <VersionHistoryPanel
                fetchVersions={async () => {
                  const res = await fetch(`/api/cases/${caseId}/structured/versions`);
                  const json = (await res.json()) as { versions?: StructuredDocumentVersion[] };
                  return json.versions ?? [];
                }}
                onRestore={async (versionId) => {
                  const res = await fetch(`/api/cases/${caseId}/structured/versions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ versionId }),
                  });
                  if (!res.ok) {
                    toast.error("Не удалось восстановить версию");
                    return;
                  }
                  const json = (await res.json()) as { document: StructuredCaseDocument; updatedAt: string };
                  setDocument(json.document);
                  setUpdatedAt(json.updatedAt);
                  toast.success("Версия восстановлена");
                }}
              />
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          {document.searchText.trim()
            ? document.searchText.slice(0, 280) + (document.searchText.length > 280 ? "…" : "")
            : "Структурированные разделы пока пусты."}
        </p>
      )}

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Не диагноз. Интерпретация — за специалистом. Результаты калькуляторов вставляются как неизменяемые блоки.
      </p>
    </div>
  );
}
