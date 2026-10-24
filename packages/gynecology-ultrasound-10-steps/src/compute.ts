/** Детерминированные формулы из источника (без скрытых пересчётов единиц). */
export function evaluateVolumeFormula(
  formula: string,
  values: Record<string, number | undefined | null>,
): number | null {
  const nums = (keys: string[]) => {
    const picked = keys.map((k) => values[k]);
    if (picked.some((v) => v == null || Number.isNaN(v))) return null;
    return picked as number[];
  };

  if (formula === "length * thickness * width * 0.52") {
    const v = nums(["length", "thickness", "width"]);
    if (!v) return null;
    return v[0]! * v[1]! * v[2]! * 0.52;
  }

  if (formula === "size_1_mm * size_2_mm * size_3_mm * 0.52") {
    const v = nums(["size_1_mm", "size_2_mm", "size_3_mm"]);
    if (!v) return null;
    return v[0]! * v[1]! * v[2]! * 0.52;
  }

  return null;
}

export function formatNumber(value: number, maxFraction = 1): string {
  const rounded = Math.round(value * 10 ** maxFraction) / 10 ** maxFraction;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(maxFraction).replace(/\.?0+$/, "");
}
