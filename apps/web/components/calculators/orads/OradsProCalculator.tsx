"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { AdnexConsensusPanel } from "@/components/calculators/orads/AdnexConsensusPanel";
import { IotaConsensusWebPanel } from "@/components/calculators/orads/IotaConsensusWebPanel";
import { useOradsProForm } from "@/components/calculators/orads/useOradsProForm";
import { useIotaInterpretationAchievement } from "@/lib/achievements/use-calculator-achievements";
import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import {
  ORADS_ZERO_OPTIONS,
  ORADS_VERSION_LABEL,
  buildProtocolOneLiner,
  type BloodFlow,
  type IotaColorScore,
  type PapillaryProjectionCount,
  type SeptaCount,
  type UnilocularSubtype,
} from "@/lib/orads-pro";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { saveOradsBridgePayload } from "@/lib/reports/sre-orads-bridge";
import { cn } from "@/lib/utils/cn";

function categoryColors(cat: number) {
  if (cat <= 2) return "border-emerald-400 bg-emerald-50";
  if (cat === 3) return "border-amber-400 bg-amber-50";
  if (cat === 4) return "border-orange-400 bg-orange-50";
  return "border-red-400 bg-red-50";
}

type OradsZeroId = (typeof ORADS_ZERO_OPTIONS)[number]["id"];

const COLOR_SCORE_LABELS: Record<IotaColorScore, string> = {
  "1": "1 — нет сигнала",
  "2": "2 — минимальный",
  "3": "3 — умеренный",
  "4": "4 — выраженный",
};

export function OradsProCalculator({ onCrumb }: { onCrumb?: (label: string) => void }) {
  const f = useOradsProForm();
  useIotaInterpretationAchievement(f.iotaConsensus.readiness === "complete" ? "benign" : "inconclusive");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [oradsZero, setOradsZero] = useState<OradsZeroId | null>(null);

  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: `orads-${f.result.category}`,
        title: `O-RADS ${f.result.category} · ACR / IOTA`,
        text: f.reportText,
        sectionHeading: "Заключение",
      }),
    [f.reportText, f.result.category],
  );

  const zeroMeta = ORADS_ZERO_OPTIONS.find((z) => z.id === oradsZero);
  const showTriangulation = Boolean(f.menopause && f.lesionKind && !oradsZero);

  const protocolLine = useMemo(() => {
    if (oradsZero && zeroMeta) return `${zeroMeta.label}. ${zeroMeta.recommendation}`;
    return buildProtocolOneLiner(f.result);
  }, [oradsZero, zeroMeta, f.result]);

  function onSave() {
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "o-rads",
        calculatorCode: "O_RADS",
        payload: { input: f.input, result: f.result, triangulation: f.triangulation },
        summary: `O-RADS ${f.result.category} · ${f.result.riskText}`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено в истории калькуляторов");
        else toast.error(res.message);
      });
    });
  }

  function copyProtocolLine() {
    void navigator.clipboard.writeText(protocolLine).then(() => toast.success("Строка скопирована в буфер"));
  }

  function openStructuredReport() {
    if (!f.menopause || !f.lesionKind) {
      toast.error("Заполните менопаузу и тип образования для протокола");
      return;
    }
    saveOradsBridgePayload({ input: f.input, result: f.result, triangulation: f.triangulation });
    router.push("/reports/adnex");
  }

  return (
    <div className="space-y-4 px-4 py-4 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-2">
        <p className="text-sm font-bold text-[var(--clinical-foreground)]">
          {ORADS_VERSION_LABEL} + IOTA Simple Rules / IOTA 2026
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Отмечайте то, что видите на УЗИ — чипами, сверху вниз. Итог O-RADS и перекрёстная проверка IOTA обновляются
          сразу. Не диагноз; интерпретация — лечащий специалист.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOradsZero(null);
              f.reset();
            }}
          >
            Сброс
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tools/refs/orads-echograms">Эхограммы O-RADS →</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-3 pb-44">
        <details className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-surface-muted)]/40 px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--clinical-foreground-muted)]">
            O-RADS 0 — не оценено / техника
          </summary>
          <div className="mt-2 space-y-2">
            <div className="flex flex-col gap-2">
              {ORADS_ZERO_OPTIONS.map((z) => (
                <CalcChip
                  key={z.id}
                  label={z.label}
                  selected={oradsZero === z.id}
                  onClick={() => {
                    setOradsZero(z.id);
                    onCrumb?.(z.label);
                  }}
                />
              ))}
              <CalcChip
                label="Оценить образование (O-RADS 1–5)"
                selected={oradsZero === null}
                onClick={() => setOradsZero(null)}
              />
            </div>
            {zeroMeta ? (
              <p className="rounded-lg bg-white/80 p-2 text-xs dark:bg-slate-900/50">
                {zeroMeta.detail}
                <br />
                <strong>Дальше:</strong> {zeroMeta.recommendation}
              </p>
            ) : null}
          </div>
        </details>

        {!oradsZero ? (
          <>
            <CalcStepCard title="1. Пациентка" required={!f.menopause}>
              <CalcSubLabel>Возраст, лет</CalcSubLabel>
              <Input
                placeholder="например, 42"
                inputMode="numeric"
                value={f.ageYears}
                onChange={(e) => f.setAgeYears(e.target.value.replace(/[^\d]/g, ""))}
              />
              <CalcSubLabel>Менопауза</CalcSubLabel>
              <div className="flex flex-wrap gap-2">
                <CalcChip
                  label="Пременопауза"
                  selected={f.menopause === "pre"}
                  onClick={() => {
                    f.setMenopause("pre");
                    onCrumb?.("Пременопауза");
                  }}
                />
                <CalcChip
                  label="Постменопауза"
                  selected={f.menopause === "post"}
                  onClick={() => {
                    f.setMenopause("post");
                    f.setCycleDay("");
                    onCrumb?.("Постменопауза");
                  }}
                />
              </div>
              {f.menopause === "pre" ? (
                <>
                  <CalcSubLabel>День цикла</CalcSubLabel>
                  <Input
                    placeholder="например, 12"
                    inputMode="numeric"
                    value={f.cycleDay}
                    onChange={(e) => f.setCycleDay(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </>
              ) : null}
              {Number(f.ageYears) >= 50 && f.menopause === "pre" ? (
                <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  Возраст ≥50: при сомнении учитывайте как постменопаузу (O-RADS US v2022).
                </p>
              ) : null}
            </CalcStepCard>

            <CalcStepCard title="2. Что видите?" required={!f.lesionKind}>
              <div className="flex flex-wrap gap-2">
                <CalcChip
                  label="Физиологическое (фолликул / ЖТ)"
                  selected={f.lesionKind === "physiological"}
                  onClick={() => {
                    f.setLesionKind("physiological");
                    onCrumb?.("Физиологическое");
                  }}
                />
                <CalcChip
                  label="Образование (киста / солидное)"
                  selected={f.lesionKind === "nonphysiological"}
                  onClick={() => {
                    f.setLesionKind("nonphysiological");
                    onCrumb?.("Образование");
                  }}
                />
              </div>
              {f.lesionKind === "physiological" && f.menopause === "pre" ? (
                <div className="flex flex-wrap gap-2">
                  <CalcChip label="Фолликул" selected={f.physType === "follicle"} onClick={() => f.setPhysType("follicle")} />
                  <CalcChip
                    label="Желтое тело"
                    selected={f.physType === "corpus_luteum"}
                    onClick={() => f.setPhysType("corpus_luteum")}
                  />
                </div>
              ) : null}
              {f.lesionKind === "physiological" && f.menopause === "post" ? (
                <p className="text-xs text-amber-800">Физиологические находки — только в пременопаузе (O-RADS 1).</p>
              ) : null}
            </CalcStepCard>

            {f.lesionKind === "nonphysiological" ? (
              <>
                <CalcStepCard title="3. Структура" required={!f.structure}>
                  <div className="flex flex-wrap gap-2">
                    <CalcChip label="Однокамерное" selected={f.structure === "unilocular"} onClick={() => f.setStructure("unilocular")} />
                    <CalcChip label="Многокамерное" selected={f.structure === "multilocular"} onClick={() => f.setStructure("multilocular")} />
                    <CalcChip label="Солидное" selected={f.structure === "solid"} onClick={() => f.setStructure("solid")} />
                  </div>
                </CalcStepCard>

                {f.structure === "unilocular" ? (
                  <CalcStepCard title="4. Содержимое / вид кисты" required={!f.unilocularSubtype}>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          ["simple_cyst", "Простая / анэхогенная"],
                          ["hemorrhagic", "Геморрагическая"],
                          ["endometrioma", "Эндометриома («стекло»)"],
                          ["dermoid", "Дермоидная"],
                          ["paraovarian", "Параовариальная"],
                          ["peritoneal_inclusion", "Перитонеальная инклюзия"],
                          ["hydrosalpinx", "Гидросальпинкс"],
                          ["other", "Другое"],
                        ] as const
                      ).map(([v, label]) => (
                        <CalcChip
                          key={v}
                          label={label}
                          selected={f.unilocularSubtype === v}
                          onClick={() => f.setUnilocularSubtype(v as UnilocularSubtype)}
                        />
                      ))}
                    </div>
                    {f.unilocularSubtype === "other" ? (
                      <Input placeholder="Краткое описание…" value={f.customDescription} onChange={(e) => f.setCustomDescription(e.target.value)} />
                    ) : null}
                  </CalcStepCard>
                ) : null}

                {f.structure === "multilocular" || f.structure === "solid" ? (
                  <CalcStepCard title="4. Перегородки и солидный компонент">
                    {f.structure === "multilocular" ? (
                      <>
                        <CalcSubLabel>Количество перегородок</CalcSubLabel>
                        <div className="flex flex-wrap gap-2">
                          {(["0", "1-3", ">3"] as SeptaCount[]).map((v) => (
                            <CalcChip key={v} label={v} selected={f.septaCount === v} onClick={() => f.setSeptaCount(v)} />
                          ))}
                        </div>
                        <CalcSubLabel>Толщина перегородок</CalcSubLabel>
                        <div className="flex flex-wrap gap-2">
                          <CalcChip label="Тонкие &lt;3 мм" selected={f.septaThickness === "thin"} onClick={() => f.setSeptaThickness("thin")} />
                          <CalcChip label="Толстые ≥3 мм" selected={f.septaThickness === "thick"} onClick={() => f.setSeptaThickness("thick")} />
                        </div>
                        <CalcSubLabel>Перегородка во 2-й плоскости</CalcSubLabel>
                        <div className="flex flex-wrap gap-2">
                          <CalcChip label="Полная" selected={!f.incompleteSeptum} onClick={() => f.setIncompleteSeptum(false)} />
                          <CalcChip label="Исчезла → однокамерное" selected={f.incompleteSeptum} onClick={() => f.setIncompleteSeptum(true)} />
                        </div>
                      </>
                    ) : null}
                    <CalcSubLabel>Солидный компонент ≥3 мм</CalcSubLabel>
                    <div className="flex flex-wrap gap-2">
                      <CalcChip label="Нет" selected={f.solidComponent === false} onClick={() => f.setSolidComponent(false)} />
                      <CalcChip label="Есть" selected={f.solidComponent === true} onClick={() => f.setSolidComponent(true)} />
                    </div>
                    {f.solidComponent ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <CalcChip label="Гладкий" selected={f.solidType === "smooth"} onClick={() => f.setSolidType("smooth")} />
                          <CalcChip label="Неровный" selected={f.solidType === "irregular"} onClick={() => f.setSolidType("irregular")} />
                          <CalcChip label="Папиллярный ≥3 мм" selected={f.solidType === "papillary"} onClick={() => f.setSolidType("papillary")} />
                        </div>
                        <CalcSubLabel>Число папиллярных проекций</CalcSubLabel>
                        <div className="flex flex-wrap gap-2">
                          {(["0", "1", "2", "3", "4plus"] as PapillaryProjectionCount[]).map((v) => (
                            <CalcChip
                              key={v}
                              label={v === "4plus" ? "≥4" : v}
                              selected={f.papillaryProjectionCount === v}
                              onClick={() => f.setPapillaryProjectionCount(v)}
                            />
                          ))}
                        </div>
                        <Input
                          placeholder="Наибольший солидный компонент, мм"
                          value={f.largestSolidDiameterMm}
                    onChange={(e) => f.setLargestSolidDiameterMm(e.target.value.replace(/[^\d.,]/g, ""))}
                        />
                      </>
                    ) : null}
                  </CalcStepCard>
                ) : null}

                {f.structure === "unilocular" ? (
                  <CalcStepCard title="5. Солидные элементы в кисте">
                    <CalcSubLabel>Солидный компонент / папилляры ≥3 мм</CalcSubLabel>
                    <div className="flex flex-wrap gap-2">
                      <CalcChip label="Нет" selected={f.solidComponent === false} onClick={() => f.setSolidComponent(false)} />
                      <CalcChip label="Есть" selected={f.solidComponent === true} onClick={() => f.setSolidComponent(true)} />
                    </div>
                    {f.solidComponent ? (
                      <>
                        <CalcSubLabel>Число папиллярных проекций</CalcSubLabel>
                        <div className="flex flex-wrap gap-2">
                          {(["0", "1", "2", "3", "4plus"] as PapillaryProjectionCount[]).map((v) => (
                            <CalcChip
                              key={v}
                              label={v === "4plus" ? "≥4" : v}
                              selected={f.papillaryProjectionCount === v}
                              onClick={() => f.setPapillaryProjectionCount(v)}
                            />
                          ))}
                        </div>
                        <Input
                          placeholder="Наибольший солидный компонент, мм"
                          value={f.largestSolidDiameterMm}
                    onChange={(e) => f.setLargestSolidDiameterMm(e.target.value.replace(/[^\d.,]/g, ""))}
                        />
                      </>
                    ) : null}
                    <CalcSubLabel>Акустические тени (IOTA B3)</CalcSubLabel>
                    <div className="flex flex-wrap gap-2">
                      <CalcChip label="Нет" selected={f.acousticShadows === false} onClick={() => f.setAcousticShadows(false)} />
                      <CalcChip label="Да" selected={f.acousticShadows === true} onClick={() => f.setAcousticShadows(true)} />
                    </div>
                  </CalcStepCard>
                ) : null}

                {f.structure === "solid" ? (
                  <CalcStepCard title="5. Контур солидного образования">
                    <div className="flex flex-wrap gap-2">
                      <CalcChip label="Гладкий контур" selected={f.solidType === "smooth"} onClick={() => f.setSolidType("smooth")} />
                      <CalcChip label="Неровный / lobulated" selected={f.solidType === "irregular"} onClick={() => f.setSolidType("irregular")} />
                    </div>
                    <CalcSubLabel>Акустические тени</CalcSubLabel>
                    <div className="flex flex-wrap gap-2">
                      <CalcChip label="Нет" selected={f.acousticShadows === false} onClick={() => f.setAcousticShadows(false)} />
                      <CalcChip label="Да" selected={f.acousticShadows === true} onClick={() => f.setAcousticShadows(true)} />
                    </div>
                  </CalcStepCard>
                ) : null}

                <CalcStepCard title="6. Размер">
                  <Input
                    placeholder="Наибольший диаметр, мм"
                    inputMode="numeric"
                    value={f.lengthMm}
                    onChange={(e) => f.setLengthMm(e.target.value.replace(/[^\d.,]/g, ""))}
                  />
                </CalcStepCard>

                <CalcStepCard title="7. ЦДК и осложнения">
                  <CalcSubLabel>Цветовой балл IOTA (worst-case в образовании)</CalcSubLabel>
                  <div className="flex flex-wrap gap-2">
                    {(["1", "2", "3", "4"] as IotaColorScore[]).map((v) => (
                      <CalcChip
                        key={v}
                        label={COLOR_SCORE_LABELS[v]}
                        selected={f.iotaColorScore === v || f.bloodFlow === colorScoreToBloodFlow(v)}
                        onClick={() => {
                          f.setIotaColorScore(v);
                          f.setBloodFlow(colorScoreToBloodFlow(v));
                        }}
                      />
                    ))}
                  </div>
                  <CalcSubLabel>Асцит</CalcSubLabel>
                  <div className="flex flex-wrap gap-2">
                    <CalcChip label="Нет" selected={!f.ascites} onClick={() => f.setAscites(false)} />
                    <CalcChip label="Да (M2)" selected={f.ascites} onClick={() => f.setAscites(true)} />
                  </div>
                  <CalcSubLabel>Перитонеальные высыпания</CalcSubLabel>
                  <div className="flex flex-wrap gap-2">
                    <CalcChip label="Нет" selected={!f.peritonealNodules} onClick={() => f.setPeritonealNodules(false)} />
                    <CalcChip label="Да" selected={f.peritonealNodules} onClick={() => f.setPeritonealNodules(true)} />
                  </div>
                </CalcStepCard>
              </>
            ) : f.lesionKind === "physiological" ? (
              <CalcStepCard title="3. Размер, мм">
                <Input
                  placeholder="Наибольший диаметр (≤30 мм → O-RADS 1)"
                  inputMode="numeric"
                  value={f.lengthMm}
                  onChange={(e) => f.setLengthMm(e.target.value.replace(/[^\d.,]/g, ""))}
                />
              </CalcStepCard>
            ) : null}

            {showTriangulation ? (
              <>
                <AdnexConsensusPanel triangulation={f.triangulation} />
                <IotaConsensusWebPanel consensus={f.iotaConsensus} />
              </>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="secondary" disabled={pending} onClick={onSave}>
                Сохранить
              </Button>
              <Button type="button" variant="default" disabled={pending || !showTriangulation} onClick={openStructuredReport}>
                Структурированный протокол
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/assistant/gynecology">Помощник АГ</Link>
              </Button>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-[var(--clinical-foreground-muted)]">Полный текст и PDF</summary>
              <div className="mt-2 space-y-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void navigator.clipboard.writeText(f.reportText)}>
                  Копировать заключение
                </Button>
                <DocumentExportToolbar spec={exportSpec} compact />
              </div>
            </details>
          </>
        ) : null}
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t-2 p-3 shadow-2xl lg:left-64",
          oradsZero ? "border-slate-400 bg-slate-100" : categoryColors(f.result.category),
        )}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            {oradsZero && zeroMeta ? (
              <>
                <p className="text-2xl font-black leading-tight sm:text-3xl">{zeroMeta.label}</p>
                <p className="text-sm font-semibold">Дальше: {zeroMeta.recommendation}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black leading-tight sm:text-3xl">O-RADS {f.result.category}</p>
                <p className="font-bold">{f.result.riskText}</p>
                {f.result.patternLabel ? (
                  <p className="text-sm font-semibold text-[var(--clinical-primary-deep)]">{f.result.patternLabel}</p>
                ) : null}
                <p className="text-sm font-semibold">Дальше: {f.result.recommendation}</p>
                {f.result.warning ? <p className="text-xs font-bold text-red-800">{f.result.warning}</p> : null}
              </>
            )}
            <p className="mt-1 truncate text-xs text-[var(--clinical-foreground-muted)]">{protocolLine}</p>
          </div>
          <Button
            type="button"
            size="lg"
            className="shrink-0 rounded-full bg-[var(--clinical-primary)] px-6 font-bold text-white hover:bg-[var(--clinical-primary-hover)]"
            onClick={copyProtocolLine}
          >
            В протокол
          </Button>
        </div>
      </div>
    </div>
  );
}

function colorScoreToBloodFlow(score: IotaColorScore): BloodFlow {
  if (score === "1") return "none";
  if (score === "2") return "minimal";
  if (score === "3") return "moderate";
  return "marked";
}
