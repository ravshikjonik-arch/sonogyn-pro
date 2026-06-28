"use client";

import type { StructuredReportDocument, StructuredReportInput } from "@repo/types";
import Link from "next/link";
import { useCallback, useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { ReportBlockEditor } from "@/components/reports/ReportBlockEditor";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { cn } from "@/lib/utils/cn";

type GenerateResponse = {
  document: StructuredReportDocument;
  persistedId?: string;
};

export type StructuredReportWorkspaceProps = {
  templateSlug: string;
  title: string;
  description: string;
  input: StructuredReportInput | null;
  emptyState?: ReactNode;
  backHref?: string;
  backLabel?: string;
  exportFilenameBase: string;
  exportTitle: string;
  exportMeta?: { label: string; value: string }[];
  inputMissingMessage?: string;
  className?: string;
  formPanel?: ReactNode;
};

function mergeBlocks(document: StructuredReportDocument) {
  const { output, editedBlocks } = document;
  return {
    description: editedBlocks.description ?? output.description,
    impression: editedBlocks.impression ?? output.impression,
    recommendations: editedBlocks.recommendations ?? output.recommendations,
  };
}

export function StructuredReportWorkspace({
  templateSlug,
  title,
  description,
  input,
  emptyState,
  backHref,
  backLabel,
  exportFilenameBase,
  exportTitle,
  exportMeta,
  inputMissingMessage = "Нет данных для генерации.",
  className,
  formPanel,
}: StructuredReportWorkspaceProps) {
  const [document, setDocument] = useState<StructuredReportDocument | null>(null);
  const [persistedId, setPersistedId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState({ description: "", impression: "", recommendations: "" });
  const [status, setStatus] = useState<StructuredReportDocument["status"]>("draft");
  const [locale, setLocale] = useState<StructuredReportDocument["locale"]>("ru");
  const [pending, startTransition] = useTransition();

  const exportSpec = useMemo(() => {
    if (!blocks.description && !blocks.impression) return null;
    return plainTextToDocumentSpec({
      filenameBase: exportFilenameBase,
      title: exportTitle,
      meta: exportMeta,
      text: [blocks.description, blocks.impression, blocks.recommendations].filter(Boolean).join("\n\n"),
      sectionHeading: locale === "en" ? "Ultrasound report" : "Протокол УЗИ",
    });
  }, [blocks, exportFilenameBase, exportMeta, exportTitle, locale]);

  const applyDocument = useCallback((doc: StructuredReportDocument, id?: string) => {
    setDocument(doc);
    setStatus(doc.status);
    setBlocks(mergeBlocks(doc));
    if (id) setPersistedId(id);
  }, []);

  function runGenerate(preview: boolean) {
    if (!input) {
      toast.error(inputMissingMessage);
      return;
    }

    startTransition(() => {
      void fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSlug, locale, preview, input }),
      })
        .then(async (res) => {
          const data = (await res.json()) as GenerateResponse & { error?: unknown };
          if (!res.ok) {
            const msg = typeof data.error === "string" ? data.error : "Ошибка генерации";
            throw new Error(msg);
          }
          applyDocument(data.document, data.persistedId);
          toast.success(preview ? "Черновик сгенерирован" : "Черновик сохранён");
        })
        .catch((err: Error) => toast.error(err.message));
    });
  }

  function saveEdits(nextStatus?: StructuredReportDocument["status"]) {
    if (!persistedId) {
      toast.error("Сначала сохраните черновик (без preview)");
      return;
    }

    const editedBlocks = {
      description: blocks.description !== document?.output.description ? blocks.description : undefined,
      impression: blocks.impression !== document?.output.impression ? blocks.impression : undefined,
      recommendations:
        blocks.recommendations !== document?.output.recommendations ? blocks.recommendations : undefined,
    };

    startTransition(() => {
      void fetch(`/api/reports/${persistedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editedBlocks,
          status: nextStatus ?? (Object.values(editedBlocks).some(Boolean) ? "edited" : undefined),
        }),
      })
        .then(async (res) => {
          const data = (await res.json()) as { document?: StructuredReportDocument; error?: unknown };
          if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Ошибка сохранения");
          if (data.document) {
            applyDocument(data.document, persistedId);
            setStatus(data.document.status);
          }
          toast.success(nextStatus === "finalized" ? "Протокол финализирован" : "Правки сохранены");
        })
        .catch((err: Error) => toast.error(err.message));
    });
  }

  function copyAll() {
    const text = [blocks.description, blocks.impression, blocks.recommendations].filter(Boolean).join("\n\n");
    void navigator.clipboard.writeText(text).then(() => toast.success("Скопировано в буфер"));
  }

  const readOnly = status === "finalized";
  const citations = document?.output.citations ?? [];

  return (
    <div className={cn("mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-10", className)}>
      <header className="space-y-2">
        <Badge variant="outline">Structured Reporting · Phase 1</Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1>
        <p className="max-w-3xl text-sm text-[var(--clinical-foreground-muted)]">{description}</p>
        <div className="flex flex-wrap gap-2">
          {backHref ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={backHref}>{backLabel ?? "← Назад"}</Link>
            </Button>
          ) : null}
          {status !== "draft" ? (
            <Badge variant="secondary" className="self-center">
              {status === "finalized" ? "Финализирован" : "Отредактирован"}
            </Badge>
          ) : null}
        </div>
      </header>

      {formPanel}

      {!input ? (
        (emptyState ?? (
          <Card className="border-dashed border-[var(--clinical-border)]">
            <CardHeader>
              <CardTitle className="text-base">Нет входных данных</CardTitle>
            </CardHeader>
          </Card>
        ))
      ) : (
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-surface)]/50">
          <CardContent className="flex flex-wrap items-center gap-2 pt-6">
            <label className="mr-2 flex items-center gap-2 text-sm">
              <span className="text-[var(--clinical-foreground-muted)]">Язык</span>
              <select
                className="rounded-lg border border-[var(--clinical-border)] bg-transparent px-2 py-1 text-sm"
                value={locale}
                onChange={(e) => setLocale(e.target.value as StructuredReportDocument["locale"])}
              >
                <option value="ru">RU</option>
                <option value="en">EN</option>
              </select>
            </label>
            <Button size="sm" disabled={pending} onClick={() => runGenerate(true)}>
              Сгенерировать preview
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => runGenerate(false)}>
              Сохранить черновик
            </Button>
            {persistedId ? (
              <>
                <Button size="sm" variant="outline" disabled={pending || readOnly} onClick={() => saveEdits("edited")}>
                  Сохранить правки
                </Button>
                <Button size="sm" variant="default" disabled={pending || readOnly} onClick={() => saveEdits("finalized")}>
                  Финализировать
                </Button>
              </>
            ) : null}
            <Button size="sm" variant="ghost" disabled={!blocks.description} onClick={copyAll}>
              Копировать всё
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-[var(--clinical-border)] lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Описание</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportBlockEditor
              id="sre-description"
              label="Description"
              value={blocks.description}
              onChange={(v) => setBlocks((b) => ({ ...b, description: v }))}
              readOnly={readOnly}
            />
          </CardContent>
        </Card>

        <Card className="border-[var(--clinical-border)] lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Заключение</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportBlockEditor
              id="sre-impression"
              label="Impression"
              value={blocks.impression}
              onChange={(v) => setBlocks((b) => ({ ...b, impression: v }))}
              readOnly={readOnly}
              rows={8}
            />
          </CardContent>
        </Card>

        <Card className="border-[var(--clinical-border)] lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Рекомендации</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportBlockEditor
              id="sre-recommendations"
              label="Recommendations"
              value={blocks.recommendations}
              onChange={(v) => setBlocks((b) => ({ ...b, recommendations: v }))}
              readOnly={readOnly}
              rows={8}
            />
          </CardContent>
        </Card>
      </div>

      {citations.length > 0 ? (
        <Card className="border-[var(--clinical-border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ссылки на стандарты</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {citations.map((c) => (
                <li key={c.id}>
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--clinical-primary-deep)] hover:underline"
                    >
                      {c.label}
                    </a>
                  ) : (
                    <span>{c.label}</span>
                  )}
                  {c.standard ? (
                    <span className="ml-2 text-[var(--clinical-foreground-muted)]">({c.standard})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {exportSpec ? <DocumentExportToolbar spec={exportSpec} /> : null}

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Заключение сформировано в assistive-режиме; не является гистологическим диагнозом. Интерпретация — лечащий
        специалист.
      </p>
    </div>
  );
}
