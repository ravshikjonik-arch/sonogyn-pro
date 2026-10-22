"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  calculateAdnex,
  calculateLr2,
  calculateSimpleRulesRisk,
  compareIotaRiskWithOrads,
  evaluateSimpleRules,
  type AdnexInput,
  type SimpleRulesFeature,
} from "@repo/iota-models";
import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalculatorReportPanel } from "@/components/calculators/CalculatorReportPanel";
import { buildCalculatorGeneratedReport } from "@/lib/reports/calculator-report-bridge";
import { useCalculatorWorkspace } from "@/lib/hooks/use-calculator-workspace";
import { cn } from "@/lib/utils/cn";

const IOTA_CALC_ID = "iota-adnex";
const IOTA_SHARE_PATH = "/tools/calc/rads/iota";

const B_LIST: SimpleRulesFeature[] = ["B1", "B2", "B3", "B4", "B5"];
const M_LIST: SimpleRulesFeature[] = ["M1", "M2", "M3", "M4", "M5"];

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

type Props = {
  initial?: Partial<AdnexInput>;
  oradsCategory?: number | null;
};

export function IotaCalculator({ initial, oradsCategory = null }: Props) {
  const { recordRun } = useCalculatorWorkspace(IOTA_CALC_ID);
  const [hydrated, setHydrated] = useState(false);
  const [ageYears, setAgeYears] = useState(String(initial?.ageYears ?? 45));
  const [oncologyCenter, setOncologyCenter] = useState(initial?.oncologyCenter ?? false);
  const [maxDiameterMm, setMaxDiameterMm] = useState(String(initial?.maxDiameterMm ?? ""));
  const [maxSolidMm, setMaxSolidMm] = useState(String(initial?.maxSolidDiameterMm ?? "0"));
  const [moreThan10Locules, setMoreThan10Locules] = useState(initial?.moreThan10Locules ?? false);
  const [papillaryCount, setPapillaryCount] = useState<AdnexInput["papillaryCount"]>(
    initial?.papillaryCount ?? 0,
  );
  const [acousticShadows, setAcousticShadows] = useState(initial?.acousticShadows ?? false);
  const [ascites, setAscites] = useState(initial?.ascites ?? false);
  const [useCa125, setUseCa125] = useState(initial?.ca125Uml != null);
  const [ca125Uml, setCa125Uml] = useState(String(initial?.ca125Uml ?? ""));
  const [benign, setBenign] = useState<SimpleRulesFeature[]>([]);
  const [malignant, setMalignant] = useState<SimpleRulesFeature[]>([]);
  const [irregularWalls, setIrregularWalls] = useState(false);
  const [bloodFlowPapillary, setBloodFlowPapillary] = useState(false);
  const [oradsManual, setOradsManual] = useState(
    oradsCategory != null ? String(oradsCategory) : "",
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  const adnexPayload = useMemo(
    (): Partial<AdnexInput> => ({
      ageYears: Number.parseInt(ageYears, 10),
      oncologyCenter,
      maxDiameterMm: Number.parseFloat(maxDiameterMm),
      maxSolidDiameterMm: Number.parseFloat(maxSolidMm),
      moreThan10Locules,
      papillaryCount,
      acousticShadows,
      ascites,
      ca125Uml: useCa125 ? Number.parseFloat(ca125Uml) : undefined,
    }),
    [
      ageYears,
      oncologyCenter,
      maxDiameterMm,
      maxSolidMm,
      moreThan10Locules,
      papillaryCount,
      acousticShadows,
      ascites,
      useCa125,
      ca125Uml,
    ],
  );

  const adnex = useMemo(() => calculateAdnex(adnexPayload), [adnexPayload]);
  const simple = useMemo(() => evaluateSimpleRules({ benignFeatures: benign, malignantFeatures: malignant }), [benign, malignant]);
  const srr = useMemo(
    () =>
      calculateSimpleRulesRisk({
        oncologyCenter,
        benignFeatures: benign,
        malignantFeatures: malignant,
      }),
    [oncologyCenter, benign, malignant],
  );
  const lr2 = useMemo(
    () =>
      calculateLr2({
        ageYears: Number.parseInt(ageYears, 10),
        ascites,
        bloodFlowInSolidPapillary: bloodFlowPapillary,
        maxSolidDiameterMm: Number.parseFloat(maxSolidMm) || 0,
        irregularInternalWalls: irregularWalls,
        acousticShadows,
      }),
    [ageYears, ascites, bloodFlowPapillary, maxSolidMm, irregularWalls, acousticShadows],
  );

  const oradsForCompare = oradsCategory ?? (oradsManual ? Number.parseInt(oradsManual, 10) : null);
  const shareParams = useMemo(
    () => ({
      ageYears,
      oncologyCenter,
      maxDiameterMm,
      maxSolidMm,
      moreThan10Locules,
      papillaryCount,
      acousticShadows,
      ascites,
      useCa125,
      ca125Uml: useCa125 ? ca125Uml : "",
      benignFeatures: benign,
      malignantFeatures: malignant,
      irregularInternalWalls: irregularWalls,
      bloodFlowInSolidPapillary: bloodFlowPapillary,
      oradsCategory: oradsForCompare,
    }),
    [
      ageYears,
      oncologyCenter,
      maxDiameterMm,
      maxSolidMm,
      moreThan10Locules,
      papillaryCount,
      acousticShadows,
      ascites,
      useCa125,
      ca125Uml,
      benign,
      malignant,
      irregularWalls,
      bloodFlowPapillary,
      oradsForCompare,
    ],
  );

  const generatedReport = useMemo(() => {
    if (!("malignancyRisk" in adnex)) return null;
    return buildCalculatorGeneratedReport(
      "iota-adnex",
      shareParams as unknown as Record<string, unknown>,
      { adnex, simple, srr, lr2 },
      oradsForCompare,
    );
  }, [adnex, simple, srr, lr2, oradsForCompare, shareParams]);

  const iotaSummary = useMemo(() => {
    if (!("malignancyRisk" in adnex)) return "IOTA ADNEX";
    return `ADNEX ${pct(adnex.malignancyRisk)}`;
  }, [adnex]);

  const onSaveToHistory = useCallback(() => {
    if (!("malignancyRisk" in adnex)) {
      toast.error("Сначала заполните поля ADNEX");
      return;
    }
    recordRun({
      path: IOTA_SHARE_PATH,
      title: "IOTA ADNEX",
      summary: iotaSummary,
      params: shareParams as unknown as Record<string, string | number | boolean | null>,
    });
    toast.success("Добавлено в локальную историю");
  }, [adnex, iotaSummary, recordRun, shareParams]);

  const compare =
    "malignancyRisk" in adnex
      ? compareIotaRiskWithOrads(adnex.malignancyRisk, {
          categoryNumber: Number.isFinite(oradsForCompare) ? oradsForCompare : null,
        })
      : null;

  function toggle(list: SimpleRulesFeature[], code: SimpleRulesFeature, set: (v: SimpleRulesFeature[]) => void) {
    set(list.includes(code) ? list.filter((c) => c !== code) : [...list, code]);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8" data-iota-calculator-hydrated={hydrated ? "true" : "false"}>
      <header>
        <h1 className="text-2xl font-black text-[var(--clinical-foreground)]">IOTA · ADNEX / LR2 / Simple Rules</h1>
        <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">
          Детерминированные модели IOTA (источники: BMJ 2014, JCO 2005, AJOG 2016). Не заменяют клиническое решение.
        </p>
      </header>

      <CalcStepCard title="ADNEX" required>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold">
            Возраст (лет)
            <Input className="mt-1" inputMode="numeric" value={ageYears} onChange={(e) => setAgeYears(e.target.value)} aria-label="Возраст пациента в годах" />
          </label>
          <label className="text-xs font-bold">
            Макс. диаметр образования (мм)
            <Input className="mt-1" inputMode="decimal" value={maxDiameterMm} onChange={(e) => setMaxDiameterMm(e.target.value)} aria-label="Максимальный диаметр образования в миллиметрах" />
          </label>
          <label className="text-xs font-bold">
            Макс. солидный компонент (мм)
            <Input className="mt-1" inputMode="decimal" value={maxSolidMm} onChange={(e) => setMaxSolidMm(e.target.value)} aria-label="Максимальный диаметр солидного компонента в миллиметрах" />
          </label>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
              <input
                type="checkbox"
                checked={useCa125}
                onChange={(e) => setUseCa125(e.target.checked)}
                aria-label="Использовать CA-125 в модели ADNEX"
              />
              <span>Использовать CA-125 в модели ADNEX</span>
            </label>
            {useCa125 ? (
              <label className="text-xs font-bold">
                CA-125 (Ед/мл)
                <Input
                  className="mt-1"
                  inputMode="decimal"
                  value={ca125Uml}
                  onChange={(e) => setCa125Uml(e.target.value)}
                  aria-label="Уровень CA-125"
                />
              </label>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <CalcChip label="Онкологический центр" selected={oncologyCenter} onClick={() => setOncologyCenter(true)} />
          <CalcChip label="Другой центр" selected={!oncologyCenter} onClick={() => setOncologyCenter(false)} />
          <CalcChip label=">10 камер" selected={moreThan10Locules} onClick={() => setMoreThan10Locules((v) => !v)} />
          <CalcChip label="Акустическая тень" selected={acousticShadows} onClick={() => setAcousticShadows((v) => !v)} />
          <CalcChip label="Асцит" selected={ascites} onClick={() => setAscites((v) => !v)} />
        </div>
        <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">Папиллярные выросты (≥3 мм)</p>
        <div className="flex flex-wrap gap-2">
          {([0, 1, 2, 3, "4plus"] as const).map((p) => (
            <CalcChip key={p} label={p === "4plus" ? "≥4" : String(p)} selected={papillaryCount === p} onClick={() => setPapillaryCount(p)} />
          ))}
        </div>
      </CalcStepCard>

      <CalcStepCard title="Simple Rules (B / M)">
        <p className="text-xs text-[var(--clinical-foreground-muted)]">Доброкачественные (B)</p>
        <div className="flex flex-wrap gap-2">
          {B_LIST.map((c) => (
            <CalcChip key={c} label={c} selected={benign.includes(c)} onClick={() => toggle(benign, c, setBenign)} />
          ))}
        </div>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">Злокачественные (M)</p>
        <div className="flex flex-wrap gap-2">
          {M_LIST.map((c) => (
            <CalcChip key={c} label={c} selected={malignant.includes(c)} onClick={() => toggle(malignant, c, setMalignant)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <CalcChip label="Неровные стенки (LR2)" selected={irregularWalls} onClick={() => setIrregularWalls((v) => !v)} />
          <CalcChip label="Кровоток в папилле (LR2)" selected={bloodFlowPapillary} onClick={() => setBloodFlowPapillary((v) => !v)} />
        </div>
      </CalcStepCard>

      {oradsCategory == null ? (
        <CalcStepCard title="O-RADS US (для сопоставления)">
          <label className="text-xs font-bold">
            Категория 1–5
            <Input
              className="mt-1 max-w-[8rem]"
              inputMode="numeric"
              value={oradsManual}
              onChange={(e) => setOradsManual(e.target.value.replace(/[^1-5]/g, "").slice(0, 1))}
              aria-label="Категория O-RADS US от 1 до 5"
              placeholder="—"
            />
          </label>
        </CalcStepCard>
      ) : null}

      {"errors" in adnex ? (
        <p
          className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-surface-muted)] p-4 text-sm text-[var(--clinical-foreground)]"
          role="alert"
        >
          Проверьте поля ADNEX (диапазоны в мм, возраст 18–100).
        </p>
      ) : (
        <section className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4" aria-live="polite">
          <h2 className="text-lg font-black">Результат ADNEX</h2>
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            {adnex.modelId} · {adnex.modelVersion} · CA-125: {adnex.usedCa125 ? "да" : "нет"}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {(
              [
                ["benign", "Доброкачественное"],
                ["borderline", "Пограничное"],
                ["stage1", "Стадия I"],
                ["stage2_4", "Стадия II–IV"],
                ["metastatic", "Метастатическое"],
              ] as const
            ).map(([k, label]) => (
              <li key={k} className="flex items-center gap-2">
                <span className="w-36 font-medium">{label}</span>
                <span className={cn("h-2 flex-1 rounded-full bg-[var(--clinical-surface-muted)]")}>
                  <span className="block h-2 rounded-full bg-sky-600" style={{ width: pct(adnex.probabilities[k]) }} />
                </span>
                <span className="w-14 text-right tabular-nums">{pct(adnex.probabilities[k])}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-base font-bold">Суммарный риск злокачественности: {pct(adnex.malignancyRisk)}</p>
          {"malignancyRisk" in srr ? (
            <p className="text-sm">Simple Rules Risk: {pct(srr.malignancyRisk)}</p>
          ) : null}
          {"malignancyRisk" in lr2 ? <p className="text-sm">LR2: {pct(lr2.malignancyRisk)}</p> : null}
          {"verdict" in simple ? <p className="text-sm">Simple Rules: {simple.verdict}</p> : null}
          {compare ? (
            <p className="mt-3 rounded-lg bg-[var(--clinical-surface-muted)] p-3 text-sm">
              {compare.status === "concordant"
                ? `Риск ADNEX ${pct(compare.iotaMalignancyRisk)} согласуется с O-RADS US ${compare.oradsCategory ?? "—"} (порог 10%).`
                : compare.status === "discordant_iota_higher"
                  ? `Риск ADNEX ${pct(compare.iotaMalignancyRisk)} ≥10%, O-RADS US ${compare.oradsCategory} — низко/промежуточная группа (≤3).`
                  : compare.status === "discordant_orads_higher"
                    ? `O-RADS US ${compare.oradsCategory} (4–5) при риске ADNEX ${pct(compare.iotaMalignancyRisk)} <10%.`
                    : `Укажите O-RADS US для сопоставления (риск ADNEX ${pct(compare.iotaMalignancyRisk)}).`}
            </p>
          ) : null}
          <p className="mt-4 text-xs text-[var(--clinical-foreground-muted)]">
            Расчёт — вспомогательный инструмент; интерпретация и тактика остаются за специалистом.
          </p>
        </section>
      )}

      {generatedReport ? (
        <CalculatorReportPanel
          title="IOTA ADNEX — черновик заключения"
          reportText={generatedReport.plainText}
          filenameBase="iota-adnex"
          sharePath={IOTA_SHARE_PATH}
          shareParams={shareParams as unknown as Record<string, string | number | boolean | null>}
          repeatHref={IOTA_SHARE_PATH}
          onSaveToHistory={onSaveToHistory}
        />
      ) : null}

      <Button type="button" variant="outline" className="rounded-full" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        К началу формы
      </Button>
    </div>
  );
}
