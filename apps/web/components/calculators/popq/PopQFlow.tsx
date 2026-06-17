"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { createTeachingCaseFromCalculator } from "@/app/actions/teaching-case-actions";
import { PopQAnatomyMockup } from "@/components/calculators/popq/PopQAnatomyMockup";
import { PopQDiagram } from "@/components/calculators/popq/PopQDiagram";
import { PopQGrid } from "@/components/calculators/popq/PopQGrid";
import { PopQExportPanel } from "@/components/calculators/popq/PopQExportPanel";
import { PopQReferencePanel } from "@/components/calculators/popq/PopQReferencePanel";
import { PopQResultPanel } from "@/components/calculators/popq/PopQResultPanel";
import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Button } from "@/components/ui/button";
import {
  downloadClinicalPdf,
  openClinicalEmail,
} from "@/lib/reporting/clinical-document-export";
import {
  NORMAL_ANATOMY,
  POPQ_PRESETS,
  buildPatientReportText,
  buildPopQCaseTitle,
  buildClinicalProtocolText,
  buildPopQDocumentBundle,
  buildProtocolLine,
  calculatePopQResult,
  compartmentLabel,
  inputToFieldStrings,
  leadingPointKey,
  parsePopQValues,
  stageLabel,
  type PopQInput,
  type PopQPointKey,
  type PopQStageResult,
} from "@/lib/popq";
import { cn } from "@/lib/utils/cn";

function defaultValues(): Record<PopQPointKey, string> {
  return inputToFieldStrings(NORMAL_ANATOMY);
}

export function PopQFlow() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uterusPresent, setUterusPresent] = useState(true);
  const [values, setValues] = useState<Record<PopQPointKey, string>>(defaultValues);
  const [showNormal, setShowNormal] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [calculatedInput, setCalculatedInput] = useState<PopQInput | null>(null);
  const [stageResult, setStageResult] = useState<PopQStageResult | null>(null);
  const [physicianName, setPhysicianName] = useState("");
  const [institution, setInstitution] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/profile", { signal: AbortSignal.timeout(6000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { profile?: { full_name?: string | null; institution?: string | null } } | null) => {
        if (cancelled || !data?.profile) return;
        if (data.profile.full_name?.trim()) setPhysicianName(data.profile.full_name.trim());
        if (data.profile.institution?.trim()) setInstitution(data.profile.institution.trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const diagramInput = useMemo<PopQInput>(() => {
    if (calculatedInput) return calculatedInput;
    const { input, errors: parseErrors } = parsePopQValues(values, uterusPresent);
    return parseErrors.length ? {} : input;
  }, [calculatedInput, values, uterusPresent]);

  const leadPoint = useMemo(
    () => (calculatedInput ? leadingPointKey(calculatedInput, uterusPresent) : null),
    [calculatedInput, uterusPresent],
  );

  const protocolLine = useMemo(() => {
    if (!stageResult || !calculatedInput) return "";
    return buildProtocolLine({
      stageKey: stageResult.stageKey,
      leading: stageResult.leading,
      tvl: calculatedInput.TVL,
    });
  }, [stageResult, calculatedInput]);

  const patientReport = useMemo(() => {
    if (!calculatedInput || !protocolLine) return "";
    return buildPatientReportText({ protocolLine, uterusPresent, points: calculatedInput });
  }, [protocolLine, uterusPresent, calculatedInput]);

  const clinicalProtocol = useMemo(() => {
    if (!calculatedInput || !stageResult || !protocolLine) return "";
    return buildClinicalProtocolText({
      protocolLine,
      uterusPresent,
      points: calculatedInput,
      stageKey: stageResult.stageKey,
      leading: stageResult.leading,
      leadingPoint: stageResult.leadingPoint,
      maxPoint: stageResult.maxPoint,
    });
  }, [protocolLine, uterusPresent, calculatedInput, stageResult]);

  const documentBundle = useMemo(() => {
    if (!stageResult || !calculatedInput || !protocolLine) return null;
    return buildPopQDocumentBundle({
      uterusPresent,
      points: calculatedInput,
      stageResult,
      protocolLine,
      patientReport,
      clinicalProtocol,
      physicianName,
      institution,
    });
  }, [
    stageResult,
    calculatedInput,
    protocolLine,
    patientReport,
    clinicalProtocol,
    uterusPresent,
    physicianName,
    institution,
  ]);

  function clearResult() {
    setCalculatedInput(null);
    setStageResult(null);
    setErrors([]);
  }

  function updateField(key: PopQPointKey, value: string) {
    if (!uterusPresent && key === "D") return;
    setValues((prev) => ({ ...prev, [key]: value }));
    setShowNormal(false);
    clearResult();
  }

  function applyPreset(presetId: string) {
    const preset = POPQ_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setUterusPresent(preset.uterusPresent);
    setValues(inputToFieldStrings(preset.values));
    setShowNormal(false);
    clearResult();
    toast.success(`Пример: ${preset.label}`);
  }

  function resetAll() {
    setUterusPresent(true);
    setValues(defaultValues());
    setShowNormal(false);
    clearResult();
  }

  function handleCalculate() {
    const out = calculatePopQResult(values, uterusPresent);
    if (!out.ok) {
      setErrors(out.errors);
      clearResult();
      return;
    }
    const { input } = parsePopQValues(values, uterusPresent);
    setCalculatedInput(input);
    setStageResult(out.result);
    setErrors([]);
    toast.success(stageLabel(out.result.stageKey));
  }

  function copyProtocol() {
    if (!protocolLine) return;
    void navigator.clipboard.writeText(protocolLine).then(() => toast.success("Строка POP-Q скопирована"));
  }

  function quickPdfClinical() {
    if (!documentBundle) return;
    void downloadClinicalPdf(documentBundle.clinicalSpec)
      .then(() => toast.success("PDF протокола скачан"))
      .catch(() => toast.error("Не удалось сформировать PDF"));
  }

  function quickEmailClinical() {
    if (!documentBundle) return;
    openClinicalEmail(documentBundle.clinicalSpec);
    toast.info("Откроется почта. PDF — кнопка «Скачать PDF» в блоке документов.");
  }

  function saveAsCase() {
    if (!stageResult) {
      toast.error("Сначала нажмите «Рассчитать стадию»");
      return;
    }
    const title = buildPopQCaseTitle(
      stageLabel(stageResult.stageKey),
      stageResult.leading ? compartmentLabel(stageResult.leading.key) : undefined,
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
    if (!stageResult || !calculatedInput) {
      toast.error("Сначала нажмите «Рассчитать стадию»");
      return;
    }
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "pop-q",
        calculatorCode: "POP_Q",
        payload: { uterusPresent, input: calculatedInput, stage: stageResult, protocolLine },
        summary: protocolLine,
      }).then((res) => {
        if (res.ok) toast.success("POP-Q сохранён в истории");
        else toast.error(res.message);
      });
    });
  }

  return (
    <div className="space-y-4 px-4 py-4 lg:px-10">
      <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-rose-900 to-rose-600 px-2 py-3 text-white lg:px-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
          <div>
            <p className="text-base font-bold">Калькулятор POP-Q</p>
            <p className="text-xs text-rose-100">Русская версия · золотой стандарт стадирования пролапса</p>
          </div>
          <Button variant="secondary" size="sm" asChild className="ml-auto h-8 rounded-full text-xs">
            <Link href="/calculators">← Калькуляторы</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={resetAll}>
          Сброс
        </Button>
      </div>

      <div className="mx-auto grid max-w-4xl gap-4 pb-44 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-3">
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
                onClick={() => {
                  setUterusPresent(true);
                  clearResult();
                }}
              />
              <CalcChip
                label="После гистерэктомии"
                selected={!uterusPresent}
                onClick={() => {
                  setUterusPresent(false);
                  setValues((prev) => ({ ...prev, D: "" }));
                  clearResult();
                }}
              />
            </div>
          </CalcStepCard>

          <CalcStepCard title="2. Макет · где измерять точки">
            <PopQAnatomyMockup uterusPresent={uterusPresent} />
          </CalcStepCard>

          <CalcStepCard title="3. Ваши измерения (см)">
            <PopQGrid values={values} uterusPresent={uterusPresent} onChange={updateField} />

            {errors.length ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {errors.map((e) => (
                  <p key={e}>• {e}</p>
                ))}
              </div>
            ) : null}

            <Button type="button" size="lg" className="mt-4 w-full rounded-xl font-bold" onClick={handleCalculate}>
              Рассчитать стадию
            </Button>
          </CalcStepCard>

          {stageResult ? <PopQResultPanel result={stageResult} /> : null}

          {stageResult && calculatedInput && protocolLine ? (
            <PopQExportPanel
              stageResult={stageResult}
              calculatedInput={calculatedInput}
              uterusPresent={uterusPresent}
              protocolLine={protocolLine}
              patientReport={patientReport}
              clinicalProtocol={clinicalProtocol}
              initialPhysicianName={physicianName}
              initialInstitution={institution}
              pending={pending}
              onSave={saveEntry}
              onSaveCase={saveAsCase}
            />
          ) : null}

          <CalcStepCard title="5. Динамическая схема по введённым точкам">
            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={showNormal ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setShowNormal((v) => !v)}
              >
                {showNormal ? "Показаны: норма" : "Сравнить с нормой"}
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
              input={diagramInput}
              uterusPresent={uterusPresent}
              showNormal={showNormal}
              normalInput={NORMAL_ANATOMY}
              showLabels={showLabels}
              leadingPoint={leadPoint}
            />
          </CalcStepCard>
        </div>

        <div className="space-y-3">
          <PopQReferencePanel />
          <CalcStepCard title="Связанные инструменты">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/assistant/gynecology">Помощник АГ · N81</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/cases?pathology=POP-Q">Пролапс · разбор кейсов</Link>
              </Button>
            </div>
          </CalcStepCard>
        </div>
      </div>

      {stageResult ? (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 border-t-2 p-3 shadow-2xl lg:left-64",
            stageResult.stageKey === "0" || stageResult.stageKey === "1"
              ? "border-emerald-300 bg-emerald-50"
              : stageResult.stageKey === "2"
                ? "border-amber-300 bg-amber-50"
                : "border-rose-300 bg-rose-50",
          )}
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-black leading-tight">{stageLabel(stageResult.stageKey)}</p>
              <p className="text-sm font-semibold">
                Самая низкая точка: {stageResult.maxPoint != null ? `${stageResult.maxPoint} см` : "—"}
                {stageResult.leadingPoint ? ` · ${stageResult.leadingPoint}` : ""}
              </p>
              <p className="truncate text-xs text-[var(--clinical-foreground-muted)]">{protocolLine}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:mt-0">
              <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={quickPdfClinical}>
                PDF
              </Button>
              <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={quickEmailClinical}>
                Почта
              </Button>
              <Button
                type="button"
                size="lg"
                className="rounded-full bg-[var(--clinical-primary)] px-6 font-bold text-white hover:bg-[var(--clinical-primary-hover)]"
                onClick={copyProtocol}
              >
                В протокол
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
