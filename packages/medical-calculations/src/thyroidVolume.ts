/**
 * Эллипс/эллипсоид для щитовидной железы:
 * V = (D1 × D2 × D3 × 0.523) / 1000 → мл
 */

export function calcThyroidEllipsoidVolumeMl(
  lengthMm?: number,
  widthMm?: number,
  heightMm?: number,
): number | null {
  if (
    ![lengthMm, widthMm, heightMm].every(
      (v) => typeof v === "number" && Number.isFinite(v) && v > 0,
    )
  ) {
    return null;
  }

  return Number(
    (((lengthMm as number) * (widthMm as number) * (heightMm as number) * 0.523) /
      1000)
      .toFixed(2),
  );
}

export function countThyroidDimensionsFilled(
  lengthMm?: number,
  widthMm?: number,
  heightMm?: number,
): 0 | 1 | 2 | 3 {
  return [lengthMm, widthMm, heightMm].filter(
    (v) => typeof v === "number" && Number.isFinite(v) && v > 0,
  ).length as 0 | 1 | 2 | 3;
}

export function formatThyroidDimensionsMm(
  lengthMm?: number,
  widthMm?: number,
  heightMm?: number,
): string | null {
  if (countThyroidDimensionsFilled(lengthMm, widthMm, heightMm) !== 3) {
    return null;
  }

  const fmt = (v: number) =>
    Number.isInteger(v) ? `${v}` : `${Number(v.toFixed(2))}`;

  return `${fmt(lengthMm as number)}×${fmt(widthMm as number)}×${fmt(heightMm as number)} мм`;
}
