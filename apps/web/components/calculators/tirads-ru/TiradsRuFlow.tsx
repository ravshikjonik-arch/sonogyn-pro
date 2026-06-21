"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";

import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Button } from "@/components/ui/button";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { cn } from "@/lib/utils/cn";
import {
  buildClinicalProtocolText,
  buildPatientSheetText,
  buildProtocolOneLiner,
  DESCRIPTOR_LABELS,
  evaluateTiradsRu,
  HIGH_RISK_HINTS,
  MANUAL_SOURCE,
  type TiradsRuInput,
} from "@/lib/tirads";
import { SITUATIONAL_CASES } from "@repo/thyroid-tirads/education";

type Mode = "clinic" | "learn";

const defaultInput = (): TiradsRuInput => ({
  composition: "solid",
  echogenicity: "hypoechoic",
  shape: "wider",
  margin: "smooth",
  calcification: "none",
  vascularization: "none",
  largestDiameterMm: undefined,
  cysticWithSolidComponent: false,
  suspiciousLymphNodes: false,
  highRiskPatient: false,
  elastography: { mode: "none" },
});

function ChipField<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <CalcChip key={o.value} label={o.label} selected={value === o.value} onClick={() => onChange(o.value)} />
        ))}
      </div>
    </div>
  );
}

export function TiradsRuFlow({ embedded = false }: { embedded?: boolean } = {}) {
  const [mode, setMode] = useState<Mode>("clinic");
  const [input, setInput] = useState<TiradsRuInput>(defaultInput);
  const [location, setLocation] = useState("");
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const result = useMemo(() => evaluateTiradsRu(input), [input]);
  const protocolLine = useMemo(
    () => buildProtocolOneLiner(result, input.largestDiameterMm),
    [result, input.largestDiameterMm],
  );
  const clinicalText = useMemo(
    () => buildClinicalProtocolText({ noduleLocation: location || undefined, tiradsInput: input, result }),
    [input, result, location],
  );
  const patientText = useMemo(
    () => buildPatientSheetText({ result, largestDiameterMm: input.largestDiameterMm }),
    [result, input.largestDiameterMm],
  );

  const patientSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: `tirads-ru-${result.category}`,
        title: "ЩЖ · лист для пациента",
        meta: [
          { label: "TI-RADS", value: result.category },
          { label: "Риск", value: result.malignancyRiskPercent },
        ],
        text: patientText,
        sectionHeading: "Результат УЗИ",
      }),
    [result.category, result.malignancyRiskPercent, patientText],
  );

  const clinicalSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: `tirads-ru-clinical-${result.category}`,
        title: "ЩЖ · протокол УЗИ (TI-RADS РФ)",
        meta: [
          { label: "Категория", value: result.categoryLabel },
          { label: "ТАБ", value: result.fnaRecommended ? "рассматривается" : "не по порогам" },
        ],
        text: clinicalText,
        sectionHeading: "Протокол осмотра",
      }),
    [result, clinicalText],
  );

  function patch(partial: Partial<TiradsRuInput>) {
    setInput((prev) => ({ ...prev, ...partial }));
    setActiveCaseId(null);
  }

  function applyCase(caseId: string) {
    const c = SITUATIONAL_CASES.find((x) => x.id === caseId);
    if (!c) return;
    setInput(c.preset);
    setActiveCaseId(caseId);
    setMode("clinic");
    toast.success(`Пример: ${c.figureRef}`);
  }

  function copyProtocol() {
    void navigator.clipboard.writeText(protocolLine).then(() => toast.success("Строка скопирована"));
  }

  function copyClinical() {
    void navigator.clipboard.writeText(clinicalText).then(() => toast.success("Протокол скопирован"));
  }

  function saveEntry() {
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "ti-rads",
        calculatorCode: "TI_RADS_RU",
        payload: { input, location, result, protocolLine },
        summary: protocolLine,
      }).then((res) => {
        if (res.ok) toast.success("TI-RADS сохранён в истории");
        else toast.error(res.message);
      });
    });
  }

  const bannerStyle =
    result.category === "1" || result.category === "2"
      ? "border-emerald-300 bg-emerald-50"
      : result.category === "3"
        ? "border-amber-300 bg-amber-50"
        : result.category === "4"
          ? "border-orange-300 bg-orange-50"
          : "border-rose-300 bg-rose-50";

  return (
    <div className="space-y-4 px-4 py-4 lg:px-10">
      {!embedded ? (
        <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-sky-900 to-cyan-700 px-2 py-2.5 text-white lg:px-4">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
            <span className="text-sm font-bold">ЩЖ · TI-RADS (РФ, 2023)</span>
            <span className="text-xs opacity-80">Катрич · Фисенко · Ветшева</span>
            <Button variant="secondary" size="sm" asChild className="ml-auto h-8 rounded-full text-xs">
              <Link href="/calculators">← Калькуляторы</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-3xl gap-2">
        <CalcChip label="Режим приёма" selected={mode === "clinic"} onClick={() => setMode("clinic")} />
        <CalcChip label="Обучение" selected={mode === "learn"} onClick={() => setMode("learn")} />
      </div>

      <div className="mx-auto max-w-3xl space-y-3 pb-44">
        {mode === "learn" ? (
          <>
            <CalcStepCard title="Структура пособия">
              <p className="text-xs text-[var(--clinical-foreground-muted)]">
                {MANUAL_SOURCE.title} ({MANUAL_SOURCE.year}). Источник: открытое учебное пособие; в продукте —
                справочная реализация правил, не полная копия книги.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--clinical-foreground-muted)]">
                <li>Разделы 1–5: анатомия, терминология, B-режим, допплер, эластография (TI-MDS)</li>
                <li>Раздел 6: категории TI-RADS 1–5 и пороги ТАБ</li>
                <li>Раздел 9 + приложения: заключение, Bethesda, таблица рисков</li>
              </ul>
            </CalcStepCard>

            <CalcStepCard title="Ситуационные задачи (из таблицы пособия)">
              <div className="flex flex-wrap gap-2">
                {SITUATIONAL_CASES.map((c) => (
                  <CalcChip
                    key={c.id}
                    label={`${c.figureRef} → TR${c.expectedCategory}`}
                    selected={activeCaseId === c.id}
                    onClick={() => applyCase(c.id)}
                  />
                ))}
              </div>
              {activeCaseId ? (
                <p className="text-xs text-[var(--clinical-foreground-muted)]">
                  {SITUATIONAL_CASES.find((c) => c.id === activeCaseId)?.teachingPoint}
                </p>
              ) : null}
            </CalcStepCard>
          </>
        ) : null}

        <CalcStepCard title="1. Узел · композиция и эхогенность" required>
          <ChipField
            title="Композиция"
            value={input.composition}
            onChange={(v) => patch({ composition: v })}
            options={Object.entries(DESCRIPTOR_LABELS.composition).map(([value, label]) => ({
              value: value as TiradsRuInput["composition"],
              label,
            }))}
          />
          <ChipField
            title="Эхогенность"
            value={input.echogenicity}
            onChange={(v) => patch({ echogenicity: v })}
            options={Object.entries(DESCRIPTOR_LABELS.echogenicity).map(([value, label]) => ({
              value: value as TiradsRuInput["echogenicity"],
              label,
            }))}
          />
        </CalcStepCard>

        <CalcStepCard title="2. Форма, контур, кальцинаты">
          <ChipField
            title="Форма"
            value={input.shape}
            onChange={(v) => patch({ shape: v })}
            options={Object.entries(DESCRIPTOR_LABELS.shape).map(([value, label]) => ({
              value: value as TiradsRuInput["shape"],
              label,
            }))}
          />
          <ChipField
            title="Контур"
            value={input.margin}
            onChange={(v) => patch({ margin: v })}
            options={Object.entries(DESCRIPTOR_LABELS.margin).map(([value, label]) => ({
              value: value as TiradsRuInput["margin"],
              label,
            }))}
          />
          <ChipField
            title="Кальцификаты"
            value={input.calcification}
            onChange={(v) => patch({ calcification: v })}
            options={Object.entries(DESCRIPTOR_LABELS.calcification).map(([value, label]) => ({
              value: value as TiradsRuInput["calcification"],
              label,
            }))}
          />
        </CalcStepCard>

        <CalcStepCard title="3. Размер и контекст">
          <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
            Наибольший размер, мм
            <input
              type="number"
              min={0}
              step={1}
              value={input.largestDiameterMm ?? ""}
              onChange={(e) =>
                patch({
                  largestDiameterMm: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold"
            />
          </label>
          <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
            Локализация (доля / сегмент)
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="напр. правая доля, нижний сегмент"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <CalcChip
              label="Кистозно-солидный компонент"
              selected={!!input.cysticWithSolidComponent}
              onClick={() => patch({ cysticWithSolidComponent: !input.cysticWithSolidComponent })}
            />
            <CalcChip
              label="Группа риска"
              selected={!!input.highRiskPatient}
              onClick={() => patch({ highRiskPatient: !input.highRiskPatient })}
            />
            <CalcChip
              label="Подозрительные ЛУ"
              selected={!!input.suspiciousLymphNodes}
              onClick={() => patch({ suspiciousLymphNodes: !input.suspiciousLymphNodes })}
            />
          </div>
          <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
            Группа риска: {HIGH_RISK_HINTS.slice(0, 3).join("; ")}…
          </p>
        </CalcStepCard>

        <CalcStepCard title="4. Эластография (TI-MDS, опционально)">
          <div className="flex flex-wrap gap-2">
            {(["none", "strain", "sw2"] as const).map((m) => (
              <CalcChip
                key={m}
                label={m === "none" ? "Не выполнялась" : m === "strain" ? "Strain" : "2D-SWE"}
                selected={input.elastography?.mode === m}
                onClick={() => patch({ elastography: { ...input.elastography, mode: m } })}
              />
            ))}
            {input.elastography?.mode !== "none" ? (
              <CalcChip
                label="Повышенная жёсткость"
                selected={!!input.elastography?.stiff}
                onClick={() =>
                  patch({
                    elastography: { ...input.elastography!, stiff: !input.elastography?.stiff },
                  })
                }
              />
            ) : null}
          </div>
          {result.tiMdsHint ? (
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{result.tiMdsHint}</p>
          ) : null}
        </CalcStepCard>

        <details className="rounded-xl border border-[var(--clinical-border)] px-3 py-2 text-sm">
          <summary className="cursor-pointer font-semibold">Лист для пациента</summary>
          <div className="mt-3 space-y-3">
            <p className="whitespace-pre-wrap text-xs">{patientText}</p>
            <DocumentExportToolbar spec={patientSpec} compact />
          </div>
        </details>

        <details className="rounded-xl border border-[var(--clinical-border)] px-3 py-2 text-sm">
          <summary className="cursor-pointer font-semibold">Протокол для врача</summary>
          <div className="mt-3 space-y-3">
            <p className="whitespace-pre-wrap text-xs">{clinicalText}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={copyClinical}>
                Копировать протокол
              </Button>
              <DocumentExportToolbar spec={clinicalSpec} compact />
            </div>
          </div>
        </details>
      </div>

      <div className={cn("fixed inset-x-0 bottom-0 z-30 border-t-2 p-3 shadow-2xl lg:left-64", bannerStyle)}>
        <div className="mx-auto flex max-w-3xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-black">{result.categoryLabel}</p>
            <p className="text-sm font-semibold">
              Риск {result.malignancyRiskPercent} · {result.fnaRecommended ? "ТАБ: да" : "ТАБ: по порогам нет"}
            </p>
            <p className="truncate text-xs text-[var(--clinical-foreground-muted)]">{protocolLine}</p>
          </div>
          <Button type="button" size="lg" className="mt-2 shrink-0 rounded-full sm:mt-0" onClick={copyProtocol}>
            В протокол
          </Button>
          <Button type="button" variant="outline" size="lg" className="mt-2 shrink-0 rounded-full sm:mt-0" onClick={saveEntry}>
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}
