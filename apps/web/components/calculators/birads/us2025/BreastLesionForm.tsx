"use client";

import { useState } from "react";
import { formatMeasurementRu, parseMeasurementMm } from "@repo/medical-calculations";
import {
  BIRADS_ASSOCIATED_OPTIONS,
  BIRADS_CALC_OPTIONS,
  BIRADS_ECHO_OPTIONS,
  BIRADS_KIND_OPTIONS,
  BIRADS_MARGIN_OPTIONS,
  BIRADS_NML_DISTRIBUTION_OPTIONS,
  BIRADS_NML_ECHO_OPTIONS,
  BIRADS_ORIENTATION_OPTIONS,
  BIRADS_POSTERIOR_OPTIONS,
  BIRADS_SHAPE_OPTIONS,
  BIRADS_SPECIAL_CASE_OPTIONS,
  BIRADS_VASCULARITY_OPTIONS,
  formatLesionDimensionsRu,
  missingLesionDimensionsRu,
  type BiradsAssociatedFeature,
  type BiradsUsLesionInput,
  type BreastDepth,
  type BreastLesion,
  type BreastSide,
} from "@repo/birads-us";

import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";

type Opt<T extends string> = { value: T; labelRu: string };

const SIDES: Opt<BreastSide>[] = [
  { value: "right", labelRu: "Правая" },
  { value: "left", labelRu: "Левая" },
];
const DEPTHS: Opt<BreastDepth>[] = [
  { value: "anterior", labelRu: "Передняя треть" },
  { value: "middle", labelRu: "Средняя треть" },
  { value: "posterior", labelRu: "Задняя треть" },
];

function Chips<T extends string>({ options, value, onChange }: { options: Opt<T>[]; value: T | undefined; onChange: (v: T | undefined) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <CalcChip key={o.value} label={o.labelRu} selected={value === o.value} onClick={() => onChange(value === o.value ? undefined : o.value)} />
      ))}
    </div>
  );
}

function NumberField({ label, value, onChange, unit = "мм" }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void; unit?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === undefined ? "" : unit === "мм" ? formatMeasurementRu(value) : String(value));
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--clinical-foreground-muted)]">
      <span>{label}</span>
      <input
        inputMode="decimal"
        className="h-10 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2 text-sm text-[var(--clinical-foreground)]"
        value={shown}
        placeholder={unit === "мм" ? "0,0" : "—"}
        aria-label={`${label}${unit ? `, ${unit}` : ""}`}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          onChange(raw.trim() === "" ? undefined : parseMeasurementMm(raw));
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
}

export function BreastLesionForm({ lesion, onChange }: { lesion: BreastLesion; onChange: (next: BreastLesion) => void }) {
  const f = lesion.findings;
  const setF = (patch: Partial<BiradsUsLesionInput>) => onChange({ ...lesion, findings: { ...f, ...patch } });
  const dims = lesion.dimensionsMm ?? {};
  const assoc = f.associated ?? [];
  const toggleAssoc = (a: BiradsAssociatedFeature) => {
    if (a === "none") return setF({ associated: assoc.includes("none") ? [] : ["none"] });
    const rest = assoc.filter((x) => x !== "none");
    setF({ associated: rest.includes(a) ? rest.filter((x) => x !== a) : [...rest, a] });
  };

  return (
    <div className="space-y-4">
      <CalcStepCard title="Локализация и размеры" required={!lesion.side}>
        <CalcSubLabel>Сторона</CalcSubLabel>
        <Chips options={SIDES} value={lesion.side} onChange={(side) => onChange({ ...lesion, side })} />
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Циферблат, ч (1–12)" unit="" value={lesion.clock} onChange={(clock) => onChange({ ...lesion, clock })} />
          <NumberField label="От соска" value={lesion.distanceFromNippleMm} onChange={(distanceFromNippleMm) => onChange({ ...lesion, distanceFromNippleMm })} />
        </div>
        <CalcSubLabel>Глубина</CalcSubLabel>
        <Chips options={DEPTHS} value={lesion.depth} onChange={(depth) => onChange({ ...lesion, depth })} />
        <CalcSubLabel>Размеры, мм</CalcSubLabel>
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="Ширина" value={dims.width} onChange={(width) => onChange({ ...lesion, dimensionsMm: { ...dims, width } })} />
          <NumberField label="Переднезадний" value={dims.anteroposterior} onChange={(anteroposterior) => onChange({ ...lesion, dimensionsMm: { ...dims, anteroposterior } })} />
          <NumberField label="Длина" value={dims.length} onChange={(length) => onChange({ ...lesion, dimensionsMm: { ...dims, length } })} />
        </div>
        <p className="text-xs font-semibold text-[var(--clinical-foreground-muted)]" aria-live="polite">
          {formatLesionDimensionsRu(lesion)
            ? `Размеры: ${formatLesionDimensionsRu(lesion)}`
            : `Укажите все три размера — нет: ${missingLesionDimensionsRu(lesion).join(", ")}.`}
        </p>
      </CalcStepCard>

      <CalcStepCard title="Находка · лексикон ACR BI-RADS v2025" required={!f.kind}>
        <CalcSubLabel>Тип находки</CalcSubLabel>
        <Chips options={BIRADS_KIND_OPTIONS} value={f.kind} onChange={(kind) => setF({ kind })} />

        {f.kind === "special_case" ? (
          <>
            <CalcSubLabel>Особый случай</CalcSubLabel>
            <Chips options={BIRADS_SPECIAL_CASE_OPTIONS} value={f.specialCase} onChange={(specialCase) => setF({ specialCase })} />
          </>
        ) : null}

        {f.kind === "mass" ? (
          <>
            <CalcSubLabel>Форма</CalcSubLabel>
            <Chips options={BIRADS_SHAPE_OPTIONS} value={f.shape} onChange={(shape) => setF({ shape })} />
            <CalcSubLabel>Ориентация</CalcSubLabel>
            <Chips options={BIRADS_ORIENTATION_OPTIONS} value={f.orientation} onChange={(orientation) => setF({ orientation })} />
            <CalcSubLabel>Контур</CalcSubLabel>
            <Chips options={BIRADS_MARGIN_OPTIONS} value={f.margin} onChange={(margin) => setF({ margin })} />
            <CalcSubLabel>Эхоструктура</CalcSubLabel>
            <Chips options={BIRADS_ECHO_OPTIONS} value={f.echoPattern} onChange={(echoPattern) => setF({ echoPattern })} />
            <CalcSubLabel>Задние акустические признаки</CalcSubLabel>
            <Chips options={BIRADS_POSTERIOR_OPTIONS} value={f.posterior} onChange={(posterior) => setF({ posterior })} />
          </>
        ) : null}

        {f.kind === "non_mass" ? (
          <>
            <CalcSubLabel>Распределение</CalcSubLabel>
            <Chips options={BIRADS_NML_DISTRIBUTION_OPTIONS} value={f.nmlDistribution} onChange={(nmlDistribution) => setF({ nmlDistribution })} />
            <CalcSubLabel>Эхогенность</CalcSubLabel>
            <Chips options={BIRADS_NML_ECHO_OPTIONS} value={f.nmlEcho} onChange={(nmlEcho) => setF({ nmlEcho })} />
            <CalcSubLabel>Задние признаки</CalcSubLabel>
            <Chips options={BIRADS_POSTERIOR_OPTIONS} value={f.nmlPosterior} onChange={(nmlPosterior) => setF({ nmlPosterior })} />
          </>
        ) : null}

        {f.kind === "mass" || f.kind === "non_mass" ? (
          <>
            <CalcSubLabel>Кальцинаты</CalcSubLabel>
            <Chips options={BIRADS_CALC_OPTIONS} value={f.calcifications} onChange={(calcifications) => setF({ calcifications })} />
            <CalcSubLabel>Сопутствующие признаки · все, что есть</CalcSubLabel>
            <div className="flex flex-wrap gap-2">
              {BIRADS_ASSOCIATED_OPTIONS.map((o) => (
                <CalcChip key={o.value} label={o.labelRu} selected={assoc.includes(o.value)} onClick={() => toggleAssoc(o.value)} />
              ))}
            </div>
            <CalcSubLabel>Кровоток при ЦДК (необязательно)</CalcSubLabel>
            <Chips options={BIRADS_VASCULARITY_OPTIONS} value={f.vascularity} onChange={(vascularity) => setF({ vascularity })} />
            <label className="flex items-center gap-2 text-xs text-[var(--clinical-foreground-muted)]">
              <input type="checkbox" checked={Boolean(f.stableOnPriors)} onChange={(e) => setF({ stableOnPriors: e.target.checked || undefined })} />
              Стабильно 2–3 года по предыдущим снимкам
            </label>
          </>
        ) : null}
      </CalcStepCard>
    </div>
  );
}
