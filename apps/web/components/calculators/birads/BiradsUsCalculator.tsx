"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { BreastTopographyAtlas } from "@/components/breast/BreastTopographyAtlas";
import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import {
  BIRADS_BROCHURE_SOURCE,
  BIRADS_BROCHURE_STEPS,
  BIRADS_CATEGORY_RECOMMENDATIONS,
  BI_RADS_VERSION,
  biradsOptions,
  brochureOptions,
  buildBiradsBrochureChecklist,
  buildBiradsBrochureProtocol,
  defaultBiradsBrochureInput,
  evaluateBiradsBrochure,
  resolveBiradsBrochureCategory,
  type BiradsBrochureInput,
} from "@/lib/birads-us";
import { cn } from "@/lib/utils/cn";

function toggleInList(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function ChipField({
  options,
  value,
  onChange,
  multi,
}: {
  options: { value: string; label: string }[];
  value: string | string[] | undefined;
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  const selected = multi ? (Array.isArray(value) ? value : []) : [value].filter(Boolean);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <CalcChip
          key={opt.value}
          label={opt.label}
          selected={selected.includes(opt.value)}
          onClick={() => onChange(opt.value)}
        />
      ))}
    </div>
  );
}

export function BiradsUsCalculator() {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<BiradsBrochureInput>({ ...defaultBiradsBrochureInput });
  const [pending, startTransition] = useTransition();

  const setField = useCallback(<K extends keyof BiradsBrochureInput>(key: K, value: BiradsBrochureInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  }, []);

  const autoResult = useMemo(() => evaluateBiradsBrochure(input), [input]);
  const result = useMemo(() => resolveBiradsBrochureCategory(input, autoResult), [input, autoResult]);

  const reportText = useMemo(
    () => buildBiradsBrochureProtocol({ ...input, localizationText: input.localizationText }),
    [input],
  );

  const checklist = useMemo(() => buildBiradsBrochureChecklist(input), [input]);

  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: `birads-brochure-${result.category.replace(/\s+/g, "-")}`,
        title: `Протокол УЗИ МЖ · ${result.category}`,
        meta: [
          { label: "Методика", value: "BI-RADS v2025 (брошюра)" },
          { label: "Ruleset", value: BI_RADS_VERSION },
        ],
        text: reportText,
      }),
    [reportText, result.category],
  );

  function onSave() {
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "bi-rads",
        calculatorCode: "BI_RADS_US",
        payload: { input, result, autoResult, reportText },
        summary: `${result.category} · брошюра v2025`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено в истории");
        else toast.error(res.message);
      });
    });
  }

  const massKeys = ["shape", "orientation", "margin", "echoPattern", "posteriorFeatures"] as const;

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calculators">← Каталог</Link>
        </Button>
        <Badge variant="outline">BI-RADS v2025</Badge>
        <Badge className="bg-rose-100 text-rose-900">Брошюра цикла</Badge>
      </div>

      <header className="mx-auto max-w-4xl space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Алгоритм УЗИ молочной железы по BI-RADS</h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {BIRADS_BROCHURE_SOURCE}
        </p>
      </header>

      <nav className="mx-auto flex max-w-4xl flex-wrap gap-1">
        {BIRADS_BROCHURE_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={cn(
              "rounded-lg px-2 py-1.5 text-[10px] font-bold transition sm:text-xs",
              step === s.id
                ? "bg-rose-600 text-white"
                : "bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)] hover:bg-rose-100",
            )}
          >
            {s.id}
          </button>
        ))}
      </nav>

      <div className="mx-auto max-w-4xl space-y-5 pb-36">
        {step === 1 ? (
          <CalcStepCard title="Шаг 1 — Описание общей структуры молочной железы">
            <CalcSubLabel>A. Преобладающий тип ткани</CalcSubLabel>
            <ChipField
              options={brochureOptions.prevailingTissue}
              value={input.prevailingTissue}
              onChange={(v) => setField("prevailingTissue", v)}
            />
            <CalcSubLabel>B. Количество железистой ткани (GTC)</CalcSubLabel>
            <ChipField
              options={brochureOptions.gtcAmount}
              value={input.gtcAmount}
              onChange={(v) => setField("gtcAmount", v)}
            />
          </CalcStepCard>
        ) : null}

        {step === 2 ? (
          <>
            <CalcStepCard title="Шаг 2 — Выявленные изменения">
              <ChipField
                options={biradsOptions.findingType}
                value={input.findingType}
                onChange={(v) => {
                  setField("findingType", v as BiradsBrochureInput["findingType"]);
                  if (v === "non_mass") {
                    setField("nonMassEchogenicity", "hypoechoic_area");
                    setField("nonMassDistribution", "focal");
                    setField("nonMassAssociatedFeatures", "none");
                  }
                }}
              />
              {input.findingType === "mass" ? (
                <>
                  <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                    Очаг (mass): 5 обязательных дескрипторов — форма, ориентация, контуры, эхоструктура, дорзальные
                    эффекты.
                  </p>
                  {massKeys.map((key) => (
                    <div key={key}>
                      <CalcSubLabel>
                        {key === "shape"
                          ? "Форма"
                          : key === "orientation"
                            ? "Ориентация"
                            : key === "margin"
                              ? "Контуры"
                              : key === "echoPattern"
                                ? "Эхоструктура"
                                : "Дорзальные эффекты"}
                      </CalcSubLabel>
                      <ChipField
                        options={biradsOptions[key]}
                        value={input[key]}
                        onChange={(v) => setField(key, v as BiradsBrochureInput[typeof key])}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                    NML — зона изменения эхоструктуры без объёмного эффекта, без чётких границ и определённой формы.
                  </p>
                  <CalcSubLabel>Распределение</CalcSubLabel>
                  <ChipField
                    options={biradsOptions.nonMassDistribution}
                    value={input.nonMassDistribution}
                    onChange={(v) => setField("nonMassDistribution", v)}
                  />
                  <CalcSubLabel>Эхоструктура</CalcSubLabel>
                  <ChipField
                    options={biradsOptions.nonMassEchogenicity}
                    value={input.nonMassEchogenicity}
                    onChange={(v) => setField("nonMassEchogenicity", v)}
                  />
                  <CalcSubLabel>Дорзальные эффекты / ассоциации NML</CalcSubLabel>
                  <ChipField
                    options={biradsOptions.nonMassAssociatedFeatures}
                    value={input.nonMassAssociatedFeatures}
                    onChange={(v) => setField("nonMassAssociatedFeatures", v)}
                  />
                </>
              )}
            </CalcStepCard>
            <CalcStepCard title="Локализация на схеме МЖ (обе стороны)">
              <BreastTopographyAtlas
                compact
                onProtocolTextChange={(text) => setField("localizationText", text)}
              />
            </CalcStepCard>
          </>
        ) : null}

        {step === 3 ? (
          <CalcStepCard title="Шаг 3 — Кальцификаты в молочной железе">
            <ChipField
              options={brochureOptions.calcifications}
              value={input.calcifications}
              onChange={(v) => setField("calcifications", v)}
            />
          </CalcStepCard>
        ) : null}

        {step === 4 ? (
          <CalcStepCard title="Шаг 4 — Сопутствующие признаки">
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              Отметьте влияние образования/NML на окружающие ткани (можно несколько).
            </p>
            <ChipField
              options={brochureOptions.associatedFeatures}
              value={input.associatedFeatures}
              multi
              onChange={(v) =>
                setField("associatedFeatures", toggleInList(input.associatedFeatures ?? [], v))
              }
            />
            <CalcSubLabel>Жёсткость при эластографии</CalcSubLabel>
            <ChipField
              options={brochureOptions.elastographyStiffness}
              value={input.elastographyStiffness}
              onChange={(v) => setField("elastographyStiffness", v)}
            />
          </CalcStepCard>
        ) : null}

        {step === 5 ? (
          <CalcStepCard title="Шаг 5 — Особые случаи">
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              При особом случае описывайте патогномоничные признаки без полного набора дескрипторов mass.
            </p>
            <ChipField
              options={brochureOptions.specialCase}
              value={input.specialCase}
              onChange={(v) => setField("specialCase", v)}
            />
          </CalcStepCard>
        ) : null}

        {step === 6 ? (
          <CalcStepCard title="Шаг 6 — Регионарные лимфатические узлы">
            <CalcSubLabel>Локализация (можно несколько)</CalcSubLabel>
            <ChipField
              options={brochureOptions.lymphNodeSites}
              value={input.lymphNodeSites}
              multi
              onChange={(v) =>
                setField("lymphNodeSites", toggleInList(input.lymphNodeSites ?? [], v))
              }
            />
            {(input.lymphNodeSites ?? []).length > 0 ? (
              <>
                <CalcSubLabel>Форма</CalcSubLabel>
                <ChipField
                  options={brochureOptions.lymphNodeShape}
                  value={input.lymphNodeShape}
                  onChange={(v) => setField("lymphNodeShape", v)}
                />
                <CalcSubLabel>Утолщение коры (&gt;3 мм)</CalcSubLabel>
                <ChipField
                  options={brochureOptions.lymphNodeCortex}
                  value={input.lymphNodeCortex}
                  onChange={(v) => setField("lymphNodeCortex", v)}
                />
                <CalcSubLabel>Края</CalcSubLabel>
                <ChipField
                  options={brochureOptions.lymphNodeMargin}
                  value={input.lymphNodeMargin}
                  onChange={(v) => setField("lymphNodeMargin", v)}
                />
                <CalcSubLabel>Ворота</CalcSubLabel>
                <ChipField
                  options={brochureOptions.lymphNodeHilum}
                  value={input.lymphNodeHilum}
                  onChange={(v) => setField("lymphNodeHilum", v)}
                />
                <div className="flex flex-wrap gap-2">
                  <CalcChip
                    label="Эхогенные включения"
                    selected={!!input.lymphNodeEchogenicInclusions}
                    onClick={() => setField("lymphNodeEchogenicInclusions", !input.lymphNodeEchogenicInclusions)}
                  />
                </div>
                <label className="block text-xs font-bold">Симметричность / динамика / клиника</label>
                <Input
                  placeholder="Сравнить справа и слева, интервальные изменения…"
                  value={input.lymphNodeSymmetryNote ?? ""}
                  onChange={(e) => setField("lymphNodeSymmetryNote", e.target.value)}
                />
              </>
            ) : null}
          </CalcStepCard>
        ) : null}

        {step === 7 ? (
          <CalcStepCard title="Шаг 7 — Заключение">
            <ChipField
              options={brochureOptions.conclusionMode}
              value={input.conclusionMode}
              onChange={(v) => setField("conclusionMode", v as BiradsBrochureInput["conclusionMode"])}
            />
            <Textarea
              rows={6}
              placeholder="Текст заключения врача…"
              value={input.conclusionDraft ?? ""}
              onChange={(e) => setField("conclusionDraft", e.target.value)}
            />
          </CalcStepCard>
        ) : null}

        {step === 8 ? (
          <>
            <CalcStepCard title="Шаг 8 — Категория BI-RADS и тактика">
              <p className="text-sm font-semibold text-rose-900">
                Автооценка по дескрипторам mass: {autoResult.category} ({autoResult.riskRange})
              </p>
              <CalcSubLabel>Итоговая категория (подтверждение врачом)</CalcSubLabel>
              <ChipField
                options={brochureOptions.biradsCategoryManual}
                value={input.biradsCategoryManual}
                onChange={(v) => setField("biradsCategoryManual", v)}
              />
              {input.biradsCategoryManual ? (
                <p className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900">
                  {BIRADS_CATEGORY_RECOMMENDATIONS[input.biradsCategoryManual]}
                </p>
              ) : null}
            </CalcStepCard>

            <div className="overflow-x-auto rounded-xl border border-[var(--clinical-border)]">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="bg-slate-100 text-[10px] font-black uppercase dark:bg-slate-800">
                  <tr>
                    <th className="p-2">Кат.</th>
                    <th className="p-2">Риск / тактика</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(BIRADS_CATEGORY_RECOMMENDATIONS).map(([code, rec]) => (
                    <tr key={code} className="border-t border-[var(--clinical-border)]">
                      <td className="p-2 font-bold">BI-RADS {code}</td>
                      <td className="p-2 text-[var(--clinical-foreground-muted)]">{rec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        <div className="flex flex-wrap justify-between gap-2">
          <Button type="button" variant="outline" disabled={step <= 1} onClick={() => setStep((s) => s - 1)}>
            ← Назад
          </Button>
          <Button type="button" disabled={step >= 8} onClick={() => setStep((s) => s + 1)}>
            Далее →
          </Button>
        </div>

        <section className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5">
          <p className="text-2xl font-black text-rose-950">{result.category}</p>
          <p className="font-bold text-rose-800">{result.riskRange}</p>
          <p className="mt-2 text-sm">{result.impression}</p>
        </section>

        <pre className="clinical-pre max-h-64 overflow-auto whitespace-pre-wrap rounded-xl p-4 text-xs leading-relaxed">
          {reportText}
        </pre>

        <details className="rounded-xl border p-3 text-xs">
          <summary className="cursor-pointer font-bold">Чеклист и ruleset</summary>
          <pre className="mt-2 whitespace-pre-wrap">{checklist.join("\n")}</pre>
        </details>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void navigator.clipboard.writeText(reportText)}>
            Копировать протокол
          </Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={onSave}>
            Сохранить
          </Button>
          <Button variant="outline" onClick={() => setInput({ ...defaultBiradsBrochureInput })}>
            Сброс
          </Button>
        </div>

        <DocumentExportToolbar spec={exportSpec} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rose-200 bg-rose-50/95 p-3 shadow-lg lg:left-64">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-black text-rose-950">
            {BIRADS_BROCHURE_STEPS[step - 1]?.subtitle} · {result.category}
          </span>
          <Button size="sm" onClick={() => setStep(8)}>
            К категории BI-RADS
          </Button>
        </div>
      </div>
    </div>
  );
}
