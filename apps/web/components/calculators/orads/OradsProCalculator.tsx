"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { IotaConsensusWebPanel } from "@/components/calculators/orads/IotaConsensusWebPanel";
import { AdnexConsensusPanel } from "@/components/calculators/orads/AdnexConsensusPanel";
import { useOradsProForm } from "@/components/calculators/orads/useOradsProForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { cn } from "@/lib/utils/cn";
import {
  ORADS_ZERO_OPTIONS,
  buildProtocolOneLiner,
  type BloodFlow,
  type IotaCenterType,
  type IotaColorScore,
  type IotaLesionType,
  type PapillaryProjectionCount,
  type PapillaryProjectionSurface,
  type SeptaCount,
  type UnilocularSubtype,
} from "@/lib/orads-pro";

function categoryColors(cat: number) {
  if (cat <= 2) return "border-emerald-400 bg-emerald-50";
  if (cat === 3) return "border-amber-400 bg-amber-50";
  if (cat === 4) return "border-orange-400 bg-orange-50";
  return "border-red-400 bg-red-50";
}

type OradsZeroId = (typeof ORADS_ZERO_OPTIONS)[number]["id"];

export function OradsProCalculator({ onCrumb }: { onCrumb?: (label: string) => void }) {
  const f = useOradsProForm();
  const [pending, startTransition] = useTransition();
  const [oradsZero, setOradsZero] = useState<OradsZeroId | null>(null);

  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: `orads-${f.result.category}`,
        title: `O-RADS ${f.result.category} · IOTA 2026`,
        text: f.reportText,
        sectionHeading: "Заключение",
      }),
    [f.reportText, f.result.category],
  );

  function onSave() {
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "o-rads",
        calculatorCode: "O_RADS",
        payload: { input: f.input, result: f.result, iota: f.iotaConsensus },
        summary: `O-RADS ${f.result.category} · ${f.result.riskText}`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено в истории калькуляторов");
        else toast.error(res.message);
      });
    });
  }

  const zeroMeta = ORADS_ZERO_OPTIONS.find((z) => z.id === oradsZero);
  const iotaReady = Boolean(f.menopause && f.lesionKind && !oradsZero);

  const protocolLine = useMemo(() => {
    if (oradsZero && zeroMeta) return `${zeroMeta.label}. ${zeroMeta.recommendation}`;
    return buildProtocolOneLiner(f.result);
  }, [oradsZero, zeroMeta, f.result]);

  function copyProtocolLine() {
    void navigator.clipboard.writeText(protocolLine).then(() => toast.success("Строка скопирована в буфер"));
  }

  return (
    <div className="space-y-4 px-4 py-4 lg:px-10">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Нажимайте чипы по порядку — итог внизу обновляется сразу.
        </p>
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
        <CalcStepCard title="1. Менопауза" required={!f.menopause}>
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
                onCrumb?.("Постменопауза");
              }}
            />
          </div>
        </CalcStepCard>

        <CalcStepCard title="2. Тип" required={!f.lesionKind}>
            <div className="flex flex-wrap gap-2">
              <CalcChip
                label="Физиологическое"
                selected={f.lesionKind === "physiological"}
                onClick={() => {
                  f.setLesionKind("physiological");
                  onCrumb?.("Физиологическое");
                }}
              />
              <CalcChip
                label="Образование"
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
                <CalcChip label="Желтое тело" selected={f.physType === "corpus_luteum"} onClick={() => f.setPhysType("corpus_luteum")} />
              </div>
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
              <CalcStepCard title="4. Вид (однокамерное)" required={!f.unilocularSubtype}>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["simple_cyst", "Простая киста"],
                      ["hemorrhagic", "Геморрагическая"],
                      ["endometrioma", "Эндометриома"],
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
                  <Input placeholder="Описание…" value={f.customDescription} onChange={(e) => f.setCustomDescription(e.target.value)} />
                ) : null}
              </CalcStepCard>
            ) : null}

            {f.structure === "multilocular" || f.structure === "solid" ? (
              <CalcStepCard title="4. Детали (многокамерное / солидное)">
                <CalcSubLabel>Перегородки</CalcSubLabel>
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
                {f.structure === "multilocular" ? (
                  <>
                    <CalcSubLabel>O-RADS US: перегородка во 2-й плоскости</CalcSubLabel>
                    <div className="flex flex-wrap gap-2">
                      <CalcChip
                        label="Полные септы"
                        selected={!f.incompleteSeptum}
                        onClick={() => f.setIncompleteSeptum(false)}
                      />
                      <CalcChip
                        label="Исчезла → однокамерное"
                        selected={f.incompleteSeptum}
                        onClick={() => f.setIncompleteSeptum(true)}
                      />
                    </div>
                  </>
                ) : null}
                <CalcSubLabel>Солидный компонент</CalcSubLabel>
                <div className="flex flex-wrap gap-2">
                  <CalcChip label="Нет" selected={f.solidComponent === false} onClick={() => f.setSolidComponent(false)} />
                  <CalcChip label="Есть" selected={f.solidComponent === true} onClick={() => f.setSolidComponent(true)} />
                </div>
                {f.solidComponent ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <CalcChip label="Гладкий" selected={f.solidType === "smooth"} onClick={() => f.setSolidType("smooth")} />
                      <CalcChip label="Неровный" selected={f.solidType === "irregular"} onClick={() => f.setSolidType("irregular")} />
                      <CalcChip label="Папиллярный" selected={f.solidType === "papillary"} onClick={() => f.setSolidType("papillary")} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CalcChip label="Анэхогенный" selected={f.echogenicity === "anechoic"} onClick={() => f.setEchogenicity("anechoic")} />
                      <CalcChip label="Гипоэхогенный" selected={f.echogenicity === "hypo"} onClick={() => f.setEchogenicity("hypo")} />
                      <CalcChip label="Изоэхогенный" selected={f.echogenicity === "iso"} onClick={() => f.setEchogenicity("iso")} />
                      <CalcChip label="Гиперэхогенный" selected={f.echogenicity === "hyper"} onClick={() => f.setEchogenicity("hyper")} />
                    </div>
                  </>
                ) : null}
              </CalcStepCard>
            ) : null}
          </>
        ) : null}

        <CalcStepCard title="5. Размер и осложнения (по желанию)">
          <Input
            placeholder="Наибольший диаметр, мм"
            value={f.lengthMm}
            onChange={(e) => f.setLengthMm(e.target.value)}
          />
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--clinical-foreground-muted)]">
              Асцит, кровоток, высыпания
            </summary>
            <div className="mt-2 space-y-2">
              <CalcSubLabel>Асцит</CalcSubLabel>
              <div className="flex flex-wrap gap-2">
                <CalcChip label="Нет" selected={!f.ascites} onClick={() => f.setAscites(false)} />
                <CalcChip label="Да" selected={f.ascites} onClick={() => f.setAscites(true)} />
              </div>
              <CalcSubLabel>Кровоток ЦДК</CalcSubLabel>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["none", "Нет"],
                    ["minimal", "Мин."],
                    ["moderate", "Умер."],
                    ["marked", "Выраж."],
                  ] as const
                ).map(([v, label]) => (
                  <CalcChip key={v} label={label} selected={f.bloodFlow === v} onClick={() => f.setBloodFlow(v as BloodFlow)} />
                ))}
              </div>
              <CalcSubLabel>Перитонеальные высыпания</CalcSubLabel>
              <div className="flex flex-wrap gap-2">
                <CalcChip label="Нет" selected={!f.peritonealNodules} onClick={() => f.setPeritonealNodules(false)} />
                <CalcChip label="Да" selected={f.peritonealNodules} onClick={() => f.setPeritonealNodules(true)} />
              </div>
            </div>
          </details>
        </CalcStepCard>

        <details className="rounded-xl border border-[var(--clinical-border)] px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--clinical-foreground-muted)]">
            IOTA / ADNEX — для эксперта (не обязательно)
          </summary>
          <div className="mt-3 space-y-4">
        <CalcStepCard title="IOTA 2026">
          {!iotaReady ? (
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              Сначала выберите менопаузу и тип образования выше.
            </p>
          ) : null}
          <CalcSubLabel>Тип образования</CalcSubLabel>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["unilocular_cyst", "Однокамерная киста"],
                ["unilocular_solid_cyst", "Однокамерно-солидное"],
                ["multilocular_cyst", "Многокамерная"],
                ["multilocular_solid_cyst", "Многокамерно-солидное"],
                ["solid_tumor", "Солидная"],
                ["not_classifiable", "Не классифицируется"],
              ] as const
            ).map(([v, label]) => (
              <CalcChip
                key={v}
                label={label}
                selected={f.iotaLesionType === v}
                onClick={() => f.setIotaLesionType(v as IotaLesionType)}
              />
            ))}
          </div>
          <Input
            placeholder="Наибольший солидный компонент, мм"
            value={f.largestSolidDiameterMm}
            onChange={(e) => f.setLargestSolidDiameterMm(e.target.value)}
          />
          <CalcSubLabel>Папиллярные проекции</CalcSubLabel>
          <div className="flex flex-wrap gap-2">
            {(["0", "1", "2", "3", "4plus"] as PapillaryProjectionCount[]).map((v) => (
              <CalcChip key={v} label={v === "4plus" ? "≥4" : v} selected={f.papillaryProjectionCount === v} onClick={() => f.setPapillaryProjectionCount(v)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <CalcChip label="Гладкая ПП" selected={f.papillaryProjectionSurface === "smooth"} onClick={() => f.setPapillaryProjectionSurface("smooth")} />
            <CalcChip label="Неровная ПП" selected={f.papillaryProjectionSurface === "irregular"} onClick={() => f.setPapillaryProjectionSurface("irregular")} />
          </div>
          <CalcSubLabel>&gt;10 камер кисты</CalcSubLabel>
          <div className="flex flex-wrap gap-2">
            <CalcChip label="Нет" selected={f.cystLoculesOver10 === false} onClick={() => f.setCystLoculesOver10(false)} />
            <CalcChip label="Да" selected={f.cystLoculesOver10 === true} onClick={() => f.setCystLoculesOver10(true)} />
          </div>
          <CalcSubLabel>Акустические тени</CalcSubLabel>
          <div className="flex flex-wrap gap-2">
            <CalcChip label="Нет" selected={f.acousticShadows === false} onClick={() => f.setAcousticShadows(false)} />
            <CalcChip label="Да" selected={f.acousticShadows === true} onClick={() => f.setAcousticShadows(true)} />
          </div>
          <CalcSubLabel>Цветовой балл IOTA</CalcSubLabel>
          <div className="flex flex-wrap gap-2">
            {(["1", "2", "3", "4"] as IotaColorScore[]).map((v) => (
              <CalcChip key={v} label={v} selected={f.iotaColorScore === v} onClick={() => f.setIotaColorScore(v)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <CalcChip label="Онкоцентр" selected={f.iotaCenterType === "oncology"} onClick={() => f.setIotaCenterType("oncology")} />
            <CalcChip label="Другой центр" selected={f.iotaCenterType === "other"} onClick={() => f.setIotaCenterType("other" as IotaCenterType)} />
          </div>
        </CalcStepCard>

        <AdnexConsensusPanel triangulation={f.triangulation} disabled={!iotaReady} />

        {iotaReady ? <IotaConsensusWebPanel consensus={f.iotaConsensus} /> : null}
          </div>
        </details>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={onSave}>
            Сохранить
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/assistant/gynecology">Помощник АГ</Link>
          </Button>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-[var(--clinical-foreground-muted)]">Полный текст и PDF</summary>
          <div className="mt-2 space-y-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void navigator.clipboard.writeText(f.reportText)}>
              Копировать полное заключение
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
