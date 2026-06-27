import { formatMeasurementDecimal } from "./units";

/** Эллипсоид O-RADS / IOTA / PCO: D1×D2×D3×0,523 / 1000 → мл */
export function calcOvaryEllipsoidVolumeMl(
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

export function countOvaryDimensionsFilled(
  lengthMm?: number,
  widthMm?: number,
  heightMm?: number,
): 0 | 1 | 2 | 3 {
  return [lengthMm, widthMm, heightMm].filter((v) => typeof v === "number" && Number.isFinite(v) && v > 0)
    .length as 0 | 1 | 2 | 3;
}

export function formatOvaryDimensionsMm(
  lengthMm?: number,
  widthMm?: number,
  heightMm?: number,
): string | null {
  if (countOvaryDimensionsFilled(lengthMm, widthMm, heightMm) !== 3) return null;
  return `${formatMeasurementDecimal(lengthMm!)}×${formatMeasurementDecimal(widthMm!)}×${formatMeasurementDecimal(heightMm!)} мм`;
}

/** @deprecated alias */
export const calcOradsEllipsoidVolumeMl = calcOvaryEllipsoidVolumeMl;
