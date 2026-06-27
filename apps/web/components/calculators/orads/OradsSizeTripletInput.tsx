"use client";

import { formatMeasurementDecimal, parseMeasurementMm } from "@repo/medical-calculations";

import { CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { Input } from "@/components/ui/input";

/** Эллипсоид O-RADS / IOTA: D1×D2×D3×0,523 / 1000 → мл */
export function calcOradsEllipsoidVolumeMl(
  lengthMm?: number,
  widthMm?: number,
  heightMm?: number,
): number | null {
  if (
    ![lengthMm, widthMm, heightMm].every(
      (v) => typeof v === "number" && Number.isFinite(v) && (v as number) > 0,
    )
  ) {
    return null;
  }
  return Number((((lengthMm as number) * (widthMm as number) * (heightMm as number) * 0.523) / 1000).toFixed(2));
}

function sanitizeMmInput(raw: string): string {
  return raw.replace(/[^\d.,]/g, "");
}

type Props = {
  lengthMm: string;
  widthMm: string;
  heightMm: string;
  onLengthChange: (value: string) => void;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  /** Подсказка под полями (физиологические образования и т.п.) */
  hint?: string;
};

export function OradsSizeTripletInput({
  lengthMm,
  widthMm,
  heightMm,
  onLengthChange,
  onWidthChange,
  onHeightChange,
  hint,
}: Props) {
  const l = parseMeasurementMm(lengthMm);
  const w = parseMeasurementMm(widthMm);
  const h = parseMeasurementMm(heightMm);
  const volumeMl = calcOradsEllipsoidVolumeMl(l ?? undefined, w ?? undefined, h ?? undefined);

  const dimsLabel =
    l != null && w != null && h != null
      ? `${formatMeasurementDecimal(l)}×${formatMeasurementDecimal(w)}×${formatMeasurementDecimal(h)} мм`
      : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[4.5rem] flex-1">
          <CalcSubLabel>Длина, мм</CalcSubLabel>
          <Input
            placeholder="40"
            inputMode="decimal"
            value={lengthMm}
            onChange={(e) => onLengthChange(sanitizeMmInput(e.target.value))}
            aria-label="Длина образования в миллиметрах"
          />
        </div>
        <span
          className="pb-2.5 text-base font-bold text-[var(--clinical-foreground)]"
          aria-hidden
        >
          ×
        </span>
        <div className="min-w-[4.5rem] flex-1">
          <CalcSubLabel>Ширина, мм</CalcSubLabel>
          <Input
            placeholder="20"
            inputMode="decimal"
            value={widthMm}
            onChange={(e) => onWidthChange(sanitizeMmInput(e.target.value))}
            aria-label="Ширина образования в миллиметрах"
          />
        </div>
        <span
          className="pb-2.5 text-base font-bold text-[var(--clinical-foreground)]"
          aria-hidden
        >
          ×
        </span>
        <div className="min-w-[4.5rem] flex-1">
          <CalcSubLabel>Высота, мм</CalcSubLabel>
          <Input
            placeholder="40"
            inputMode="decimal"
            value={heightMm}
            onChange={(e) => onHeightChange(sanitizeMmInput(e.target.value))}
            aria-label="Высота образования в миллиметрах"
          />
        </div>
      </div>

      {dimsLabel ? (
        <p className="text-sm font-semibold text-[var(--clinical-foreground)]">{dimsLabel}</p>
      ) : (
        <p className="text-xs text-[var(--clinical-foreground-muted)]">Формат: 40×20×40 мм (три перпендикулярных диаметра)</p>
      )}

      {volumeMl != null ? (
        <p className="text-sm font-bold text-[var(--clinical-primary-deep)]">
          Объём: {formatMeasurementDecimal(volumeMl)} мл
          <span className="ml-1 text-xs font-normal text-[var(--clinical-foreground-muted)]">
            (эллипсоид ×0,523)
          </span>
        </p>
      ) : null}

      {hint ? <p className="text-xs text-[var(--clinical-foreground-muted)]">{hint}</p> : null}
    </div>
  );
}
