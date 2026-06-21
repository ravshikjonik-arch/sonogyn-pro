"use client";

import type { AdnexStructuredReportInput, StructuredReportDocument } from "@repo/types";
import { ADNEX_ORADS_V1_TEMPLATE_SLUG } from "@repo/report-engine";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { ReportBlockEditor } from "@/components/reports/ReportBlockEditor";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapOradsToAdnexSreInput } from "@/lib/reports/map-orads-to-sre-input";
import { clearOradsBridgePayload, loadOradsBridgePayload } from "@/lib/reports/sre-orads-bridge";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { cn } from "@/lib/utils/cn";

type Props = {
  initialInput?: AdnexStructuredReportInput;
  className?: string;
};

type GenerateResponse = {
  document: StructuredReportDocument;
  persistedId?: string;
};

function mergeBlocks(document: StructuredReportDocument) {
  const { output, editedBlocks } = document;
  return {
    description: editedBlocks.description ?? output.description,
    impression: editedBlocks.impression ?? output.impression,
    recommendations: editedBlocks.recommendations ?? output.recommendations,
  };
}

export function ReportWorkspace({ initialInput, className }: Props) {
  const [sreInput, setSreInput] = useState<AdnexStructuredReportInput | null>(initialInput ?? null);
  const [document, setDocument] = useState<StructuredReportDocument | null>(null);
  const [persistedId, setPersistedId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState({ description: "", impression: "", recommendations: "" });
  const [status, setStatus] = useState<StructuredReportDocument["status"]>("draft");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (initialInput) return;
    const bridge = loadOradsBridgePayload();
    if (!bridge) return;
    setSreInput(mapOradsToAdnexSreInput(bridge.input, bridge.result));
    clearOradsBridgePayload();
  }, [initialInput]);

  const exportSpec = useMemo(() => {
    if (!blocks.description && !blocks.impression) return null;
    const cat = sreInput?.classification.oradsCategory;
    return plainTextToDocumentSpec({
      filenameBase: `sre-adnex${cat != null ? `-orads-${cat}` : ""}`,
      title: "Структурированный протокол · придатки O-RADS",
      meta: cat != null ? [{ label: "O-RADS US", value: String(cat) }] : undefined,
      text: [blocks.description, blocks.impression, blocks.recommendations].filter(Boolean).join("\n\n"),
      sectionHeading: "Протокол УЗИ",
    });
  }, [blocks, sreInput?.classification.oradsCategory]);

  const applyDocument = useCallback((doc: StructuredReportDocument, id?: string) => {
    setDocument(doc);
    setStatus(doc.status);
    setBlocks(mergeBlocks(doc));
    if (id) setPersistedId(id);
  }, []);

  function runGenerate(preview: boolean) {
    if (!sreInput) {
      toast.error("Нет данных для генерации. Заполните O-RADS Pro или передайте input.");
      return;
    }

    startTransition(() => {
      void fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateSlug: ADNEX_ORADS_V1_TEMPLATE_SLUG,
          locale: "ru",
          preview,
          input: sreInput,
        }),
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Протокол · придатки O-RADS
        </h1>
        <p className="max-w-3xl text-sm text-[var(--clinical-foreground-muted)]">
          Три блока — описание, заключение, рекомендации. Редактируйте перед сохранением. Не диагноз; интерпретация —
          лечащий специалист.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/calculators/o-rads">← O-RADS Pro</Link>
          </Button>
          {status !== "draft" ? (
            <Badge variant="secondary" className="self-center">
              {status === "finalized" ? "Финализирован" : "Отредактирован"}
            </Badge>
          ) : null}
        </div>
      </header>

      {!sreInput ? (
        <Card className="border-dashed border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="text-base">Нет входных данных</CardTitle>
            <CardDescription>
              Заполните калькулятор O-RADS Pro и нажмите «Структурированный протокол», либо откройте эту страницу после
              расчёта.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/calculators/o-rads">Перейти к O-RADS Pro</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-surface)]/50">
          <CardContent className="flex flex-wrap items-center gap-2 pt-6">
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
                <Button
                  size="sm"
                  variant="default"
                  disabled={pending || readOnly}
                  onClick={() => saveEdits("finalized")}
                >
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
