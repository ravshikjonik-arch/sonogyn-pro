"use client";

import { FileDown, FileText, Mail, Printer, Share2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  downloadClinicalPdf,
  downloadClinicalWord,
  openClinicalEmail,
  printClinicalDocument,
  shareClinicalDocument,
} from "@/lib/reporting/clinical-document-export";
import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Props = {
  spec: ClinicalDocumentSpec | null;
  className?: string;
  compact?: boolean;
};

export function DocumentExportToolbar({ spec, className, compact }: Props) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);

  if (!spec) return null;

  function onPrint() {
    const ok = printClinicalDocument(spec!);
    if (!ok) toast.error("Разрешите всплывающие окна для печати");
    else toast.success("Откроется окно печати");
  }

  function onWord() {
    downloadClinicalWord(spec!);
    toast.success("Файл Word (.doc) скачан — откройте в Word или LibreOffice");
  }

  function onPdf() {
    setBusy("pdf");
    startTransition(() => {
      void downloadClinicalPdf(spec!)
        .then(() => toast.success("PDF скачан"))
        .catch(() => toast.error("Не удалось сформировать PDF. Используйте «Печать» → Сохранить как PDF."))
        .finally(() => setBusy(null));
    });
  }

  function onEmail() {
    openClinicalEmail(spec!);
    toast.info("Откроется почтовый клиент. При необходимости прикрепите скачанный PDF.");
  }

  function onShare() {
    setBusy("share");
    void shareClinicalDocument(spec!)
      .then((mode) => {
        if (mode === "shared") toast.success("Документ передан через «Поделиться»");
        else toast.info("Открыта почта (mailto). Прикрепите PDF при необходимости.");
      })
      .finally(() => setBusy(null));
  }

  const disabled = pending || busy !== null;
  const size = compact ? "sm" : "default";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3",
        className,
      )}
    >
      <span className="w-full text-xs font-bold text-[var(--clinical-foreground-muted)] sm:w-auto">
        Экспорт документа
      </span>
      <Button type="button" size={size} variant="outline" className="gap-1.5" disabled={disabled} onClick={onPrint}>
        <Printer className="h-4 w-4" />
        Печать
      </Button>
      <Button type="button" size={size} variant="outline" className="gap-1.5" disabled={disabled} onClick={onPdf}>
        <FileDown className="h-4 w-4" />
        {busy === "pdf" ? "PDF…" : "PDF"}
      </Button>
      <Button type="button" size={size} variant="outline" className="gap-1.5" disabled={disabled} onClick={onWord}>
        <FileText className="h-4 w-4" />
        Word
      </Button>
      <Button type="button" size={size} variant="outline" className="gap-1.5" disabled={disabled} onClick={onEmail}>
        <Mail className="h-4 w-4" />
        На почту
      </Button>
      <Button type="button" size={size} variant="secondary" className="gap-1.5" disabled={disabled} onClick={onShare}>
        <Share2 className="h-4 w-4" />
        {busy === "share" ? "…" : "Поделиться"}
      </Button>
    </div>
  );
}
