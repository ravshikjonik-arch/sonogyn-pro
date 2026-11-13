"use client";

import { useState } from "react";
import { formatDimensionsMmRu, formatMeasurementRu, parseMeasurementMm } from "@repo/medical-calculations";
import {
  COMPOSITION_OPTIONS,
  ECHOGENIC_FOCI_OPTIONS,
  ECHOGENICITY_OPTIONS,
  EU_COMPOSITION_OPTIONS,
  EU_ECHOGENICITY_OPTIONS,
  EU_ETE_OPTIONS,
  EU_MARGINS_OPTIONS,
  EU_MICROCALCIFICATIONS_OPTIONS,
  EU_SHAPE_OPTIONS,
  MARGIN_OPTIONS,
  SHAPE_OPTIONS,
  missingNoduleDimensionsRu,
  type ThyroidNodule,
  type ThyroidNoduleDimensionsMm,
  type ThyroidNoduleLocation,
  type TiradsEchogenicFoci,
} from "@repo/tirads-acr";

import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";

const LOCATIONS: { value: ThyroidNoduleLocation; labelRu: string }[] = [
  { value: "right_lobe", labelRu: "Правая доля" },
  { value: "left_lobe", labelRu: "Левая доля" },
  { value: "isthmus", labelRu: "Перешеек" },
];

const DIMENSIONS: { key: keyof ThyroidNoduleDimensionsMm; labelRu: string }[] = [
  { key: "longitudinal", labelRu: "Продольный" },
  { key: "anteroposterior", labelRu: "Переднезадний" },
  { key: "transverse", labelRu: "Поперечный" },
];

function stripEnglish(label: string): string {
  return label.replace(/\s*\([^)]*\)/g, "").trim();
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; labelRu: string }[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <CalcChip
          key={o.value}
          label={stripEnglish(o.labelRu)}
          selected={value === o.value}
          onClick={() => onChange(value === o.value ? undefined : o.value)}
        />
      ))}
    </div>
  );
}

type Props = {
  nodule: ThyroidNodule;
  onChange: (next: ThyroidNodule) => void;
};

export function ThyroidNoduleBasics({ nodule, onChange }: Props) {
  const dims = nodule.dimensionsMm ?? {};
  const [draft, setDraft] = useState<{ id: string; text: Partial<Record<keyof ThyroidNoduleDimensionsMm, string>> }>({
    id: nodule.id,
    text: {},
  });
  const text = draft.id === nodule.id ? draft.text : {};
  const missing = missingNoduleDimensionsRu(nodule);
  const formatted = formatDimensionsMmRu(dims.longitudinal, dims.anteroposterior, dims.transverse);
  return (
    <CalcStepCard title="Локализация и размеры узла">
      <CalcSubLabel>Локализация</CalcSubLabel>
      <ChipRow options={LOCATIONS} value={nodule.location} onChange={(location) => onChange({ ...nodule, location })} />
      <CalcSubLabel>Размеры, мм</CalcSubLabel>
      <div className="grid grid-cols-3 gap-2">
        {DIMENSIONS.map(({ key, labelRu }) => (
          <label key={key} className="space-y-1 text-xs font-semibold text-[var(--clinical-foreground-muted)]">
            <span>{labelRu}</span>
            <input
              inputMode="decimal"
              className="h-10 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2 text-sm text-[var(--clinical-foreground)]"
              value={text[key] ?? (dims[key] !== undefined ? formatMeasurementRu(dims[key]!) : "")}
              placeholder="0,0"
              onChange={(e) => {
                const raw = e.target.value;
                setDraft({ id: nodule.id, text: { ...text, [key]: raw } });
                const parsed = raw.trim() === "" ? undefined : parseMeasurementMm(raw);
                onChange({ ...nodule, dimensionsMm: { ...dims, [key]: parsed } });
              }}
              aria-label={`${labelRu} размер, мм`}
            />
          </label>
        ))}
      </div>
      <p className="text-xs font-semibold text-[var(--clinical-foreground-muted)]" aria-live="polite">
        {formatted
          ? `Размеры: ${formatted}`
          : `Для тактики (ТАБ / наблюдение) нужны все три размера — нет: ${missing.join(", ")}.`}
      </p>
    </CalcStepCard>
  );
}

export function ThyroidEuFeaturesForm({ nodule, onChange }: Props) {
  const eu = nodule.eu ?? {};
  const set = (patch: Partial<NonNullable<ThyroidNodule["eu"]>>) => onChange({ ...nodule, eu: { ...eu, ...patch } });
  const solid = eu.composition === "mixed" || eu.composition === "solid";
  return (
    <CalcStepCard title="EU-TIRADS · признаки узла" required={!eu.composition}>
      <CalcSubLabel>Состав</CalcSubLabel>
      <ChipRow options={EU_COMPOSITION_OPTIONS} value={eu.composition} onChange={(composition) => set({ composition })} />
      {solid ? (
        <>
          <CalcSubLabel>Эхогенность солидного компонента</CalcSubLabel>
          <ChipRow options={EU_ECHOGENICITY_OPTIONS} value={eu.echogenicity} onChange={(echogenicity) => set({ echogenicity })} />
          <CalcSubLabel>Форма</CalcSubLabel>
          <ChipRow options={EU_SHAPE_OPTIONS} value={eu.shape} onChange={(shape) => set({ shape })} />
          <CalcSubLabel>Контуры</CalcSubLabel>
          <ChipRow options={EU_MARGINS_OPTIONS} value={eu.margins} onChange={(margins) => set({ margins })} />
          <CalcSubLabel>Микрокальцинаты</CalcSubLabel>
          <ChipRow
            options={EU_MICROCALCIFICATIONS_OPTIONS}
            value={eu.microcalcifications}
            onChange={(microcalcifications) => set({ microcalcifications })}
          />
          <label className="flex items-center gap-2 text-xs text-[var(--clinical-foreground-muted)]">
            <input
              type="checkbox"
              checked={Boolean(eu.highRiskFeaturesUncertain)}
              onChange={(e) => set({ highRiskFeaturesUncertain: e.target.checked || undefined })}
            />
            Сомневаюсь в признаках высокого риска
          </label>
        </>
      ) : null}
      {eu.composition && eu.composition !== "no_nodule" ? (
        <>
          <CalcSubLabel>Экстратиреоидное распространение</CalcSubLabel>
          <ChipRow
            options={EU_ETE_OPTIONS}
            value={eu.extrathyroidalExtension}
            onChange={(extrathyroidalExtension) => set({ extrathyroidalExtension })}
          />
        </>
      ) : null}
    </CalcStepCard>
  );
}

export function ThyroidAcrFeaturesForm({ nodule, onChange }: Props) {
  const acr = nodule.acr ?? {};
  const set = (patch: Partial<NonNullable<ThyroidNodule["acr"]>>) => onChange({ ...nodule, acr: { ...acr, ...patch } });
  const full = acr.composition !== undefined && acr.composition !== "spongiform" && acr.composition !== "no_nodule";
  const foci = acr.echogenicFoci ?? [];
  const toggleFocus = (f: TiradsEchogenicFoci) => {
    if (f === "none_or_comet_tail") {
      set({ echogenicFoci: foci.includes(f) ? [] : [f] });
      return;
    }
    const without = foci.filter((x) => x !== "none_or_comet_tail");
    set({ echogenicFoci: without.includes(f) ? without.filter((x) => x !== f) : [...without, f] });
  };
  return (
    <CalcStepCard title="ACR TI-RADS · признаки узла" required={!acr.composition}>
      <CalcSubLabel>Состав</CalcSubLabel>
      <ChipRow options={COMPOSITION_OPTIONS} value={acr.composition} onChange={(composition) => set({ composition })} />
      {full ? (
        <>
          <CalcSubLabel>Эхогенность</CalcSubLabel>
          <ChipRow options={ECHOGENICITY_OPTIONS} value={acr.echogenicity} onChange={(echogenicity) => set({ echogenicity })} />
          <CalcSubLabel>Форма (поперечный срез)</CalcSubLabel>
          <ChipRow options={SHAPE_OPTIONS} value={acr.shape} onChange={(shape) => set({ shape })} />
          <CalcSubLabel>Контуры</CalcSubLabel>
          <ChipRow options={MARGIN_OPTIONS} value={acr.margin} onChange={(margin) => set({ margin })} />
          <CalcSubLabel>Эхогенные включения · все, что есть</CalcSubLabel>
          <div className="flex flex-wrap gap-2">
            {ECHOGENIC_FOCI_OPTIONS.map((o) => (
              <CalcChip key={o.value} label={stripEnglish(o.labelRu)} selected={foci.includes(o.value)} onClick={() => toggleFocus(o.value)} />
            ))}
          </div>
        </>
      ) : null}
    </CalcStepCard>
  );
}
