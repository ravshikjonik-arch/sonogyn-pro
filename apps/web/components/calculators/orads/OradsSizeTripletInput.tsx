"use client";

import {
  calcOvaryEllipsoidVolumeMl,
  countOvaryDimensionsFilled,
  formatMeasurementDecimal,
  formatOvaryDimensionsMm,
  parseMeasurementMm,
} from "@repo/medical-calculations";

import { CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

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
  /** Порог объёма для пременопаузы (мл) */
  volumeWarnPreMl?: number;
  /** Порог объёма для постменопаузы (мл) */
  volumeWarnPostMl?: number;
  menopause?: "pre" | "post";
};

export function OradsSizeTripletInput({
  lengthMm,
  widthMm,
  heightMm,
  onLengthChange,
  onWidthChange,
  onHeightChange,
  hint,
  volumeWarnPreMl = 10,
  volumeWarnPostMl = 5,
  menopause,
}: Props) {
  const l = parseMeasurementMm(lengthMm);
  const w = parseMeasurementMm(widthMm);
  const h = parseMeasurementMm(heightMm);
  const filled = countOvaryDimensionsFilled(l, w, h);
  const volumeMl = calcOvaryEllipsoidVolumeMl(l, w, h);
  const dimsLabel = formatOvaryDimensionsMm(l, w, h);

  const volumeHigh =
    volumeMl != null &&
    ((menopause === "pre" && volumeMl > volumeWarnPreMl) ||
      (menopause === "post" && volumeMl > volumeWarnPostMl));

  return (
    <div className="space-y-3">
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
        <span className="pb-2.5 text-base font-bold text-[var(--clinical-foreground)]" aria-hidden>
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
        <span className="pb-2.5 text-base font-bold text-[var(--clinical-foreground)]" aria-hidden>
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

      <div
        className={cn(
          "rounded-xl border-2 px-3 py-2.5 transition-colors",
          volumeMl != null
            ? volumeHigh
              ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/30"
              : "border-emerald-300 bg-emerald-50/80 dark:border-emerald-700 dark:bg-emerald-950/25"
            : "border-[var(--clinical-border)] bg-[var(--clinical-muted)]/50",
        )}
      >
        {volumeMl != null ? (
          <div className="space-y-1">
            <p className="text-sm font-bold text-[var(--clinical-foreground)]">{dimsLabel}</p>
            <p className="text-lg font-black tabular-nums text-[var(--clinical-primary-deep)]">
              Объём: {formatMeasurementDecimal(volumeMl)} мл
            </p>
            <p className="text-[11px] text-[var(--clinical-foreground-muted)]">эллипсоид ×0,523 · пересчёт при каждом вводе</p>
            {volumeHigh ? (
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                {menopause === "post"
                  ? `Объём >${volumeWarnPostMl} мл в постменопаузе — проверьте статус.`
                  : `Объём >${volumeWarnPreMl} мл — поликистозная морфология по объёму (AFC).`}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            {filled === 0
              ? "Формат: 40×20×40 мм — объём появится сразу после трёх диаметров"
              : `Заполнено ${filled}/3 — укажите ${filled === 1 ? "ширину и высоту" : "оставшийся диаметр"} для расчёта объёма`}
          </p>
        )}
      </div>

      {hint ? <p className="text-xs text-[var(--clinical-foreground-muted)]">{hint}</p> : null}
    </div>
  );
}

export { calcOvaryEllipsoidVolumeMl as calcOradsEllipsoidVolumeMl };
