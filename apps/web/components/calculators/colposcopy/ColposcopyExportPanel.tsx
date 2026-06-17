"use client";

import { Copy, FileDown, Mail, Printer, Share2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  applyColposcopyTemplate,
  buildTemplateVars,
  DEFAULT_COLOPOSCOPY_TEMPLATES,
  type ColposcopyProtocolInput,
  type ColposcopyTemplate,
  type SwedeScoreInput,
  type SwedeScoreResult,
} from "@/lib/colposcopy";
import { buildColposcopyDocumentBundle } from "@/lib/colposcopy/build-document-specs";
import {
  downloadClinicalPdf,
  openClinicalEmail,
  printClinicalDocument,
  shareClinicalDocument,
} from "@/lib/reporting/clinical-document-export";
import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";

const TEMPLATE_STORAGE = "sonogyn_colposcopy_templates_v1";

type ExportTab = "clinical" | "patient" | "oneliner";

type Props = {
  protocol: ColposcopyProtocolInput;
  swede: SwedeScoreInput;
  result: SwedeScoreResult;
  clinicalText: string;
  patientText: string;
  calculated: boolean;
  onSaveHistory?: () => void;
};

export function ColposcopyExportPanel({
  protocol,
  swede,
  result,
  clinicalText,
  patientText,
  calculated,
  onSaveHistory,
}: Props) {
  const [tab, setTab] = useState<ExportTab>("clinical");
  const [templates, setTemplates] = useState<ColposcopyTemplate[]>(DEFAULT_COLOPOSCOPY_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_COLOPOSCOPY_TEMPLATES[0]?.id ?? "");
  const [conclusionText, setConclusionText] = useState("");
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE);
      if (raw) {
        const custom = JSON.parse(raw) as ColposcopyTemplate[];
        setTemplates([...DEFAULT_COLOPOSCOPY_TEMPLATES, ...custom]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const templateVars = useMemo(
    () => buildTemplateVars({ protocol, swede, result }),
    [protocol, swede, result],
  );

  useEffect(() => {
    if (!calculated) return;
    const autoId =
      result.riskLevel === "high" ? "cin2" : result.riskLevel === "moderate" ? "biopsy" : "norm";
    setSelectedTemplateId(autoId);
  }, [calculated, result.riskLevel]);

  useEffect(() => {
    const t = templates.find((x) => x.id === selectedTemplateId);
    if (t && calculated) {
      setConclusionText(applyColposcopyTemplate(t.text, templateVars));
    }
  }, [selectedTemplateId, templates, templateVars, calculated]);

  const bundle = useMemo(
    () =>
      calculated
        ? buildColposcopyDocumentBundle({
            protocol,
            result,
            clinicalText,
            patientText,
            conclusionText,
          })
        : null,
    [calculated, protocol, result, clinicalText, patientText, conclusionText],
  );

  const activeSpec: ClinicalDocumentSpec | null = bundle
    ? tab === "clinical"
      ? bundle.clinicalSpec
      : tab === "patient"
        ? bundle.patientSpec
        : bundle.oneLinerSpec
    : null;

  const previewText =
    tab === "clinical"
      ? conclusionText || clinicalText
      : tab === "patient"
        ? patientText
        : `Swede Score ${result.total}/10 — ${result.riskLabel}`;

  function saveCustomTemplate() {
    const name = prompt("Название шаблона:", "Мой шаблон");
    if (!name?.trim()) return;
    const entry: ColposcopyTemplate = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      text: conclusionText,
    };
    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE);
      const custom = raw ? (JSON.parse(raw) as ColposcopyTemplate[]) : [];
      custom.push(entry);
      localStorage.setItem(TEMPLATE_STORAGE, JSON.stringify(custom));
      setTemplates([...DEFAULT_COLOPOSCOPY_TEMPLATES, ...custom]);
      setSelectedTemplateId(entry.id);
      toast.success("Шаблон сохранён");
    } catch {
      toast.error("Не удалось сохранить шаблон");
    }
  }

  function copyPreview() {
    void navigator.clipboard.writeText(previewText).then(() => toast.success("Скопировано"));
  }

  function quickPrint() {
    if (!activeSpec) return;
    if (!printClinicalDocument(activeSpec)) toast.error("Разрешите всплывающие окна");
    else toast.success("Окно печати");
  }

  function quickPdf() {
    if (!activeSpec) return;
    setBusy("pdf");
    startTransition(() => {
      void downloadClinicalPdf(activeSpec)
        .then(() => toast.success("PDF скачан"))
        .catch(() => toast.error("Ошибка PDF — попробуйте Печать → Сохранить как PDF"))
        .finally(() => setBusy(null));
    });
  }

  function quickEmail() {
    if (!activeSpec) return;
    openClinicalEmail(activeSpec);
    toast.info("Откроется почта. PDF — кнопка «Скачать PDF».");
  }

  function quickShare() {
    if (!activeSpec) return;
    setBusy("share");
    void shareClinicalDocument(activeSpec)
      .then((m) => toast.success(m === "shared" ? "Отправлено" : "Открыта почта"))
      .finally(() => setBusy(null));
  }

  if (!calculated) return null;

  const disabled = busy !== null;

  return (
    <CalcStepCard title="5. Документы · PDF · печать · почта">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["clinical", "Протокол врача"],
            ["patient", "Лист для пациентки"],
            ["oneliner", "Строка в осмотр"],
          ] as const
        ).map(([key, label]) => (
          <CalcChip key={key} label={label} selected={tab === key} onClick={() => setTab(key)} />
        ))}
      </div>

      <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
        Шаблон заключения
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <Textarea
        rows={6}
        value={conclusionText}
        onChange={(e) => setConclusionText(e.target.value)}
        className="font-mono text-xs"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={saveCustomTemplate}>
          Сохранить как шаблон
        </Button>
        {onSaveHistory ? (
          <Button type="button" size="sm" variant="secondary" onClick={onSaveHistory}>
            В локальную историю
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border border-[var(--clinical-border)] bg-slate-50">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-bold text-[var(--clinical-foreground-muted)]">Предпросмотр</span>
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={copyPreview}>
            <Copy className="h-3.5 w-3.5" />
            Копировать
          </Button>
        </div>
        <pre className="max-h-48 overflow-auto p-3 text-xs whitespace-pre-wrap">{previewText}</pre>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button type="button" variant="outline" className="gap-2" disabled={disabled} onClick={quickPrint}>
          <Printer className="h-4 w-4" />
          Печать
        </Button>
        <Button type="button" variant="outline" className="gap-2" disabled={disabled} onClick={quickPdf}>
          <FileDown className="h-4 w-4" />
          {busy === "pdf" ? "PDF…" : "PDF"}
        </Button>
        <Button type="button" variant="outline" className="gap-2" disabled={disabled} onClick={quickEmail}>
          <Mail className="h-4 w-4" />
          На почту
        </Button>
        <Button type="button" variant="secondary" className="gap-2" disabled={disabled} onClick={quickShare}>
          <Share2 className="h-4 w-4" />
          Поделиться
        </Button>
      </div>

      <DocumentExportToolbar spec={activeSpec} />

      <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
        Переменные шаблона: {"{name}"}, {"{age}"}, {"{score}"}, {"{risk}"}, {"{recommendation}"},{" "}
        {"{colposcopic_diagnosis}"}, {"{findings}"}…
      </p>
    </CalcStepCard>
  );
}
