"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { createTeachingCaseFromCalculator } from "@/app/actions/teaching-case-actions";
import { PopQDiagram } from "@/components/calculators/popq/PopQDiagram";
import { PopQGrid } from "@/components/calculators/popq/PopQGrid";
import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Button } from "@/components/ui/button";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import {
  NORMAL_ANATOMY,
  POPQ_PRESETS,
  buildPatientReportText,
  buildPopQCaseTitle,
  buildProtocolLine,
  compartmentLabel,
  computePopQStage,
  inputToFieldStrings,
  leadingCompartment,
  leadingPointKey,
  parsePopQField,
  PROLAPSE_ASSISTANT_HREF,
  PROLAPSE_CASES_HREF,
  stageLabel,
  type PopQInput,
  type PopQPointKey,
} from "@/lib/popq";
import { cn } from "@/lib/utils/cn";

const pointKeys: PopQPointKey[] = ["Aa", "Ba", "Ap", "Bp", "C", "D", "GH", "PB", "TVL"];

function emptyValues(): Record<PopQPointKey, string> {
  return { Aa: "", Ba: "", Ap: "", Bp: "", C: "", D: "", GH: "", PB: "", TVL: "" };
}

export function PopQFlow() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uterusPresent, setUterusPresent] = useState(true);
  const [values, setValues] = useState<Record<PopQPointKey, string>>(emptyValues);
  const [showNormal, setShowNormal] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const input = useMemo<PopQInput>(() => {
    const parsed: PopQInput = {};
    pointKeys.forEach((k) => {
      const value = parsePopQField(values[k] ?? "");
      if (value !== undefined) parsed[k] = value;
    });
    if (!uterusPresent) delete parsed.D;
    return parsed;
  }, [values, uterusPresent]);

  const stage = useMemo(() => computePopQStage(input), [input]);
  const lead = useMemo(() => leadingCompartment(input, uterusPresent), [input, uterusPresent]);
  const leadPoint = useMemo(() => leadingPointKey(input, uterusPresent), [input, uterusPresent]);

  const protocolLine = useMemo(
    () => buildProtocolLine({ stageKey: stage.stageKey, leading: lead, tvl: input.TVL }),
    [stage.stageKey, lead, input.TVL],
  );

  const patientReport = useMemo(
    () => buildPatientReportText({ protocolLine, uterusPresent, points: input }),
    [protocolLine, uterusPresent, input],
  );

  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: `popq-stage-${stage.stageKey}`,
        title: "POP-Q · лист для пациентки",
        meta: [
          { label: "Стадия", value: stageLabel(stage.stageKey) },
          {
            label: "Ведущий отдел",
            value: lead ? compartmentLabel(lead.key) : "—",
          },
        ],
        text: patientReport,
        sectionHeading: "Результат осмотра",
      }),
    [stage.stageKey, lead, patientReport],
  );

  function updateField(key: PopQPointKey, value: string) {
    if (!uterusPresent && key === "D") return;
    setValues((prev) => ({ ...prev, [key]: value }));
    setShowNormal(false);
  }

  function applyPreset(presetId: string) {
    const preset = POPQ_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setUterusPresent(preset.uterusPresent);
    setValues(inputToFieldStrings(preset.values));
    setShowNormal(false);
    toast.success(`Пример: ${preset.label}`);
  }

  function resetAll() {
    setUterusPresent(true);
    setValues(emptyValues());
    setShowNormal(false);
  }

  function copyProtocol() {
    void navigator.clipboard.writeText(protocolLine).then(() => toast.success("Строка POP-Q скопирована"));
  }

  function saveAsCase() {
    if (stage.stageKey === "na") {
      toast.error("Сначала введите точки POP-Q");
      return;
    }
    const title = buildPopQCaseTitle(
      stageLabel(stage.stageKey),
      lead ? compartmentLabel(lead.key) : undefined,
    );
    startTransition(() => {
      void createTeachingCaseFromCalculator({
        title,
        description: patientReport,
        anatomy: "Тазовое дно / POP-Q",
        pathology: "POP-Q",
        difficulty: "intermediate",
      }).then((res) => {
        if (res.ok) {
          toast.success("Кейс создан — откройте обсуждение с коллегами");
          router.push(`/cases/${res.id}`);
        } else toast.error(res.message);
      });
    });
  }

  function saveEntry() {
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "pop-q",
        calculatorCode: "POP_Q",
        payload: { uterusPresent, input, stage, leading: lead, protocolLine },
        summary: protocolLine,
      }).then((res) => {
        if (res.ok) toast.success("POP-Q сохранён в истории");
        else toast.error(res.message);
      });
    });
  }

  return (
    <div className="space-y-4 px-4 py-4 lg:px-10">
      <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-rose-900 to-rose-600 px-2 py-2.5 text-white lg:px-4">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <span className="text-sm font-bold">POP-Q · режим приёма</span>
          <Button variant="secondary" size="sm" asChild className="ml-auto h-8 rounded-full text-xs">
            <Link href="/calculators">← Калькуляторы</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={resetAll}>
          Сброс
        </Button>
      </div>

      <div className="mx-auto max-w-3xl space-y-3 pb-44">
        <CalcStepCard title="Примеры (учебные)">
          <div className="flex flex-wrap gap-2">
            {POPQ_PRESETS.map((p) => (
              <CalcChip key={p.id} label={p.label} selected={false} onClick={() => applyPreset(p.id)} />
            ))}
          </div>
        </CalcStepCard>

        <CalcStepCard title="1. Контекст осмотра">
          <div className="flex flex-wrap gap-2">
            <CalcChip
              label="Матка сохранена"
              selected={uterusPresent}
              onClick={() => setUterusPresent(true)}
            />
            <CalcChip
              label="После гистерэктомии"
              selected={!uterusPresent}
              onClick={() => {
                setUterusPresent(false);
                setValues((prev) => ({ ...prev, D: "" }));
              }}
            />
          </div>
        </CalcStepCard>

        <CalcStepCard title="2. Схема POP-Q">
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={showNormal ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setShowNormal((v) => !v)}
            >
              {showNormal ? "Показаны: норма" : "Показать норму"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={showLabels ? "secondary" : "outline"}
              className="rounded-full"
              onClick={() => setShowLabels((v) => !v)}
            >
              {showLabels ? "Подписи точек" : "Скрыть подписи"}
            </Button>
          </div>
          <PopQDiagram
            input={input}
            uterusPresent={uterusPresent}
            showNormal={showNormal}
            normalInput={NORMAL_ANATOMY}
            showLabels={showLabels}
            leadingPoint={leadPoint}
          />
        </CalcStepCard>

        <CalcStepCard title="3. Точки POP-Q (сетка 3×3)">
          <PopQGrid values={values} uterusPresent={uterusPresent} onChange={updateField} />
        </CalcStepCard>

        <CalcStepCard title="Связанные инструменты">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={PROLAPSE_ASSISTANT_HREF}>Помощник АГ · N81</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={PROLAPSE_CASES_HREF}>Пролапс · разбор кейсов</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/assistant/gynecology">Все нозологии АГ</Link>
            </Button>
          </div>
        </CalcStepCard>

        <details className="rounded-xl border border-[var(--clinical-border)] px-3 py-2 text-sm">
          <summary className="cursor-pointer font-semibold text-[var(--clinical-foreground-muted)]">
            Лист для пациентки (PDF / печать)
          </summary>
          <div className="mt-3 space-y-3">
            <p className="whitespace-pre-wrap text-xs text-[var(--clinical-foreground-muted)]">{patientReport}</p>
            <DocumentExportToolbar spec={exportSpec} compact />
          </div>
        </details>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={saveEntry}>
            Сохранить в историю
          </Button>
          <Button type="button" disabled={pending} onClick={saveAsCase}>
            В кейс для разбора
          </Button>
          <Button type="button" variant="outline" onClick={copyProtocol}>
            В протокол
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t-2 p-3 shadow-2xl lg:left-64",
          stage.stageKey === "na"
            ? "border-slate-300 bg-slate-100"
            : stage.stageKey === "0" || stage.stageKey === "1"
              ? "border-emerald-300 bg-emerald-50"
              : stage.stageKey === "2"
                ? "border-amber-300 bg-amber-50"
                : "border-rose-300 bg-rose-50",
        )}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-black leading-tight">{stageLabel(stage.stageKey)}</p>
            <p className="text-sm font-semibold">
              {lead
                ? `${compartmentLabel(lead.key)} · ведущая точка ${lead.value} см`
                : "Введите точки для определения отдела"}
            </p>
            <p className="truncate text-xs text-[var(--clinical-foreground-muted)]">{protocolLine}</p>
          </div>
          <Button
            type="button"
            size="lg"
            className="mt-2 shrink-0 rounded-full bg-[var(--clinical-primary)] px-6 font-bold text-white hover:bg-[var(--clinical-primary-hover)] sm:mt-0"
            onClick={copyProtocol}
          >
            В протокол
          </Button>
        </div>
      </div>
    </div>
  );
}
