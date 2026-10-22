"use client";

import { BookmarkPlus, Copy, FileDown, Link2, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { REPORT_GENERATOR_DISCLAIMER_RU } from "@repo/report-generator";

import { Button } from "@/components/ui/button";
import { buildCalculatorShareUrl } from "@/lib/calculators/deep-link";
import {
  downloadClinicalPdf,
  shareClinicalDocument,
} from "@/lib/reporting/clinical-document-export";
import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";
import { diffReportParagraphs } from "@/lib/reports/report-paragraph-diff";

type Props = {
  title: string;
  reportText: string;
  filenameBase: string;
  sharePath: string;
  shareParams: Record<string, string | number | boolean | null>;
  disclaimer?: string;
  repeatHref?: string;
  onSaveToHistory?: () => void;
  /** Включить AI «Улучшить формулировки» (O-RADS и др.). */
  aiRefine?: { toolId: string; category?: string | number | null };
};

export function CalculatorReportPanel({
  title,
  reportText,
  filenameBase,
  sharePath,
  shareParams,
  disclaimer = REPORT_GENERATOR_DISCLAIMER_RU,
  repeatHref,
  onSaveToHistory,
  aiRefine,
}: Props) {
  const [busy, setBusy] = useState<"pdf" | "share" | "refine" | null>(null);
  const [refinedText, setRefinedText] = useState<string | null>(null);

  useEffect(() => {
    setRefinedText(null);
  }, [reportText]);

  const activeText = refinedText ?? reportText;

  const spec = useMemo((): ClinicalDocumentSpec => {
    return {
      filenameBase,
      title,
      sections: [{ heading: "Черновик заключения", body: activeText }],
      disclaimer,
    };
  }, [activeText, disclaimer, filenameBase, title]);

  const paragraphDiff = useMemo(() => {
    if (!refinedText) return [];
    return diffReportParagraphs(reportText, refinedText);
  }, [refinedText, reportText]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(`${activeText}\n\n${disclaimer}`);
      toast.success("Текст скопирован");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }

  async function onPdf() {
    setBusy("pdf");
    try {
      await downloadClinicalPdf(spec);
    } catch {
      toast.error("PDF недоступен в этом браузере");
    } finally {
      setBusy(null);
    }
  }

  async function onShareLink() {
    const path = buildCalculatorShareUrl(sharePath, shareParams);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success("Ссылка с параметрами скопирована");
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  }

  async function onShare() {
    setBusy("share");
    try {
      await shareClinicalDocument(spec);
    } finally {
      setBusy(null);
    }
  }

  async function onAiRefine() {
    if (!aiRefine) return;
    setBusy("refine");
    try {
      const res = await fetch("/api/ai/calculator-report-refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: aiRefine.toolId,
          draftText: reportText,
          category: aiRefine.category ?? undefined,
        }),
      });
      const data = (await res.json()) as { refinedText?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Не удалось улучшить текст");
        return;
      }
      if (data.refinedText) {
        setRefinedText(data.refinedText);
        toast.success("Черновик обновлён — проверьте diff");
      }
    } catch {
      toast.error("Сеть недоступна");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/25 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[var(--clinical-foreground)]">Черновик для протокола</h2>
        {refinedText ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => setRefinedText(null)}>
            Вернуть исходный текст
          </Button>
        ) : null}
      </div>
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        {activeText.split(/(\[не указано\])/g).map((chunk, i) =>
          chunk === "[не указано]" ? (
            <span key={i} className="rounded bg-[var(--clinical-muted)] px-0.5 text-[var(--clinical-foreground-muted)]">
              {chunk}
            </span>
          ) : (
            chunk
          ),
        )}
      </pre>

      {paragraphDiff.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50/80 p-3 dark:border-sky-900 dark:bg-sky-950/30">
          <p className="text-[10px] font-bold uppercase tracking-wide text-sky-900 dark:text-sky-200">
            Изменения по абзацам (AI)
          </p>
          <ul className="max-h-40 space-y-2 overflow-auto text-[11px]">
            {paragraphDiff.map((row) => (
              <li key={row.index} className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-2">
                <span className="font-semibold text-[var(--clinical-foreground)]">
                  {row.status === "changed" ? "Изменено" : row.status === "added" ? "Добавлено" : "Удалено"}
                </span>
                {row.before ? (
                  <p className="mt-1 text-[var(--clinical-foreground-muted)] line-through opacity-80">{row.before}</p>
                ) : null}
                {row.after ? <p className="mt-1 text-[var(--clinical-foreground)]">{row.after}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-[11px] leading-relaxed text-[var(--clinical-foreground-muted)]">{disclaimer}</p>
      <div className="flex flex-wrap gap-2">
        {aiRefine ? (
          <Button type="button" size="sm" variant="secondary" disabled={busy === "refine"} onClick={() => void onAiRefine()}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Улучшить формулировки
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="secondary" onClick={onCopy}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Скопировать
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={busy === "pdf"} onClick={onPdf}>
          <FileDown className="mr-1.5 h-3.5 w-3.5" />
          PDF
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onShareLink}>
          <Link2 className="mr-1.5 h-3.5 w-3.5" />
          Ссылка с параметрами
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy === "share"} onClick={onShare}>
          Поделиться
        </Button>
        {repeatHref ? (
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={repeatHref}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Повторить расчёт
            </Link>
          </Button>
        ) : null}
        {onSaveToHistory ? (
          <Button type="button" size="sm" variant="outline" onClick={onSaveToHistory}>
            <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
            В историю
          </Button>
        ) : null}
      </div>
    </section>
  );
}
