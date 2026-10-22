"use client";

import { Copy, FileDown, Link2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CDS_DISCLAIMER_RU } from "@/lib/config/platform";
import { buildCalculatorShareUrl } from "@/lib/calculators/deep-link";
import {
  downloadClinicalPdf,
  shareClinicalDocument,
} from "@/lib/reporting/clinical-document-export";
import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";

type Props = {
  title: string;
  reportText: string;
  filenameBase: string;
  sharePath: string;
  shareParams: Record<string, string | number | boolean | null>;
};

export function CalculatorReportPanel({
  title,
  reportText,
  filenameBase,
  sharePath,
  shareParams,
}: Props) {
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);

  const spec = useMemo((): ClinicalDocumentSpec => {
    return {
      filenameBase,
      title,
      sections: [{ heading: "Черновик заключения", body: reportText }],
      disclaimer: `${CDS_DISCLAIMER_RU} Не является медицинским диагнозом.`,
    };
  }, [filenameBase, reportText, title]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(`${reportText}\n\n${CDS_DISCLAIMER_RU}`);
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

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/25 p-4">
      <h2 className="text-sm font-bold text-[var(--clinical-foreground)]">Черновик для протокола</h2>
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        {reportText}
      </pre>
      <p className="text-[11px] leading-relaxed text-[var(--clinical-foreground-muted)]">{CDS_DISCLAIMER_RU}</p>
      <div className="flex flex-wrap gap-2">
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
      </div>
    </section>
  );
}
