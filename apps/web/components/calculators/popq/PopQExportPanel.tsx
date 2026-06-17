"use client";

import { Copy, FileDown, Mail, Printer, Share2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  downloadClinicalPdf,
  openClinicalEmail,
  printClinicalDocument,
  shareClinicalDocument,
} from "@/lib/reporting/clinical-document-export";
import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";
import {
  buildPopQDocumentBundle,
  stageLabel,
  type PopQInput,
  type PopQStageResult,
} from "@/lib/popq";
import { cn } from "@/lib/utils/cn";

type ExportTab = "clinical" | "patient" | "oneliner";

type Props = {
  stageResult: PopQStageResult;
  calculatedInput: PopQInput;
  uterusPresent: boolean;
  protocolLine: string;
  patientReport: string;
  clinicalProtocol: string;
  initialPhysicianName?: string;
  initialInstitution?: string;
  pending?: boolean;
  onSave?: () => void;
  onSaveCase?: () => void;
};

const TAB_LABELS: Record<ExportTab, string> = {
  clinical: "Протокол врача",
  patient: "Лист для пациентки",
  oneliner: "Строка в осмотр",
};

export function PopQExportPanel({
  stageResult,
  calculatedInput,
  uterusPresent,
  protocolLine,
  patientReport,
  clinicalProtocol,
  initialPhysicianName = "",
  initialInstitution = "",
  pending,
  onSave,
  onSaveCase,
}: Props) {
  const [tab, setTab] = useState<ExportTab>("clinical");
  const [physicianName, setPhysicianName] = useState(initialPhysicianName);
  const [institution, setInstitution] = useState(initialInstitution);
  const [patientLabel, setPatientLabel] = useState("");
  const [conclusionDraft, setConclusionDraft] = useState("");
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (initialPhysicianName) setPhysicianName(initialPhysicianName);
    if (initialInstitution) setInstitution(initialInstitution);
  }, [initialPhysicianName, initialInstitution]);

  const bundle = useMemo(
    () =>
      buildPopQDocumentBundle({
        uterusPresent,
        points: calculatedInput,
        stageResult,
        protocolLine,
        patientReport,
        clinicalProtocol,
        physicianName,
        institution,
        patientLabel,
        conclusionDraft,
      }),
    [
      uterusPresent,
      calculatedInput,
      stageResult,
      protocolLine,
      patientReport,
      clinicalProtocol,
      physicianName,
      institution,
      patientLabel,
      conclusionDraft,
    ],
  );

  const activeSpec: ClinicalDocumentSpec =
    tab === "clinical" ? bundle.clinicalSpec : tab === "patient" ? bundle.patientSpec : bundle.oneLinerSpec;

  const previewText =
    tab === "clinical"
      ? [protocolLine, "", clinicalProtocol, conclusionDraft.trim() ? `\nДоп. заключение:\n${conclusionDraft.trim()}` : ""]
          .filter(Boolean)
          .join("\n")
      : tab === "patient"
        ? patientReport
        : protocolLine;

  function copyPreview() {
    void navigator.clipboard.writeText(previewText).then(() => toast.success("Текст скопирован"));
  }

  function quickPrint() {
    const ok = printClinicalDocument(activeSpec);
    if (!ok) toast.error("Разрешите всплывающие окна для печати");
    else toast.success("Откроется окно печати · можно «Сохранить как PDF»");
  }

  function quickPdf() {
    setBusy("pdf");
    startTransition(() => {
      void downloadClinicalPdf(activeSpec)
        .then(() => toast.success("PDF скачан"))
        .catch(() => toast.error("Не удалось сформировать PDF. Попробуйте «Печать» → Сохранить как PDF."))
        .finally(() => setBusy(null));
    });
  }

  function quickEmail() {
    openClinicalEmail(activeSpec);
    toast.info("Откроется почтовый клиент. При необходимости прикрепите скачанный PDF.");
  }

  function quickShare() {
    setBusy("share");
    void shareClinicalDocument(activeSpec)
      .then((mode) => {
        if (mode === "shared") toast.success("Документ передан через «Поделиться»");
        else toast.info("Открыта почта. Прикрепите PDF при необходимости.");
      })
      .finally(() => setBusy(null));
  }

  const disabled = pending || busy !== null;

  return (
    <CalcStepCard title="4. Документы · PDF · печать · почта">
      <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
        Сформируйте протокол для медкарты, лист для пациентки или одну строку в осмотр. Экспорт:{" "}
        <strong>PDF</strong>, <strong>Word</strong>, <strong>печать</strong>, <strong>почта</strong>,{" "}
        <strong>«Поделиться»</strong> (на телефоне — с PDF-вложением).
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
          ФИО врача (в шапке документа)
          <Input
            value={physicianName}
            onChange={(e) => setPhysicianName(e.target.value)}
            placeholder="Якубов Р.В."
            className="mt-1"
          />
        </label>
        <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
          Учреждение
          <Input
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="Клиника / МО"
            className="mt-1"
          />
        </label>
        <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)] sm:col-span-2">
          Пациентка (инициалы или № карты — опционально)
          <Input
            value={patientLabel}
            onChange={(e) => setPatientLabel(e.target.value)}
            placeholder="Иванова А.А. / карта 12345"
            className="mt-1"
          />
        </label>
      </div>

      <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
        Дополнительное заключение (попадёт в протокол врача)
        <Textarea
          rows={3}
          value={conclusionDraft}
          onChange={(e) => setConclusionDraft(e.target.value)}
          placeholder="Напр.: рекомендована консультация урогинеколога, обучение упражнениям Кегеля…"
          className="mt-1"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as ExportTab[]).map((key) => (
          <CalcChip key={key} label={TAB_LABELS[key]} selected={tab === key} onClick={() => setTab(key)} />
        ))}
      </div>

      <div
        className={cn(
          "rounded-xl border-2 px-4 py-3",
          stageResult.stageKey === "0" || stageResult.stageKey === "1"
            ? "border-emerald-300 bg-emerald-50"
            : stageResult.stageKey === "2"
              ? "border-amber-300 bg-amber-50"
              : "border-rose-300 bg-rose-50",
        )}
      >
        <p className="text-lg font-black">{stageLabel(stageResult.stageKey)}</p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{TAB_LABELS[tab]}</p>
      </div>

      <div className="rounded-xl border border-[var(--clinical-border)] bg-slate-50">
        <div className="flex items-center justify-between border-b border-[var(--clinical-border)] px-3 py-2">
          <span className="text-xs font-bold text-[var(--clinical-foreground-muted)]">Предпросмотр</span>
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={copyPreview}>
            <Copy className="h-3.5 w-3.5" />
            Копировать
          </Button>
        </div>
        <pre className="max-h-64 overflow-auto p-3 text-xs leading-relaxed whitespace-pre-wrap text-[var(--clinical-foreground)]">
          {previewText}
        </pre>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button type="button" variant="outline" className="gap-2" disabled={disabled} onClick={quickPrint}>
          <Printer className="h-4 w-4" />
          Печать
        </Button>
        <Button type="button" variant="outline" className="gap-2" disabled={disabled} onClick={quickPdf}>
          <FileDown className="h-4 w-4" />
          {busy === "pdf" ? "PDF…" : "Скачать PDF"}
        </Button>
        <Button type="button" variant="outline" className="gap-2" disabled={disabled} onClick={quickEmail}>
          <Mail className="h-4 w-4" />
          На почту
        </Button>
        <Button type="button" variant="secondary" className="gap-2" disabled={disabled} onClick={quickShare}>
          <Share2 className="h-4 w-4" />
          {busy === "share" ? "…" : "Поделиться"}
        </Button>
      </div>

      <DocumentExportToolbar spec={activeSpec} />

      <div className="flex flex-wrap gap-2 border-t border-[var(--clinical-border)] pt-3">
        {onSave ? (
          <Button type="button" variant="secondary" disabled={pending} onClick={onSave}>
            Сохранить в историю
          </Button>
        ) : null}
        {onSaveCase ? (
          <Button type="button" disabled={pending} onClick={onSaveCase}>
            В кейс для разбора
          </Button>
        ) : null}
      </div>

      <p className="text-[10px] leading-relaxed text-[var(--clinical-foreground-muted)]">
        «На почту» открывает ваш почтовый клиент (Outlook, Mail, Gmail). Текст письма — из документа; PDF лучше
        прикрепить кнопкой «Скачать PDF» или «Поделиться». Печать в Chrome/Edge: «Сохранить как PDF» в диалоге
        принтера.
      </p>
    </CalcStepCard>
  );
}
