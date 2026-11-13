import type { MeasurementUnit } from "../types";

type SourceUnit = "mm" | "cm" | "m" | "ml";

const UNIT_PATTERN = "(мм|mm|см3|см³|cm3|cm³|см|cm|мл|ml|м|m)";
const NUMBER_PATTERN = "(\\d+(?:[.,]\\d+)?)";

function sourceUnit(token: string): SourceUnit | null {
  const t = token.toLowerCase();
  if (t === "мм" || t === "mm") return "mm";
  if (t === "см" || t === "cm") return "cm";
  if (t === "м" || t === "m") return "m";
  if (t === "мл" || t === "ml" || t === "см3" || t === "см³" || t === "cm3" || t === "cm³") return "ml";
  return null;
}

/** Power-of-ten shift on the decimal string itself — avoids floating-point drift (0,035 м → 35 мм). */
function shiftDecimal(raw: string, exponent: number): number {
  const [intPart = "0", fracPart = ""] = raw.replace(",", ".").split(".");
  let digits = intPart + fracPart;
  let point = intPart.length + exponent;
  if (point < 0) {
    digits = "0".repeat(-point) + digits;
    point = 0;
  }
  if (point > digits.length) digits = digits + "0".repeat(point - digits.length);
  const str = `${digits.slice(0, point) || "0"}.${digits.slice(point) || "0"}`;
  return Number(str);
}

const TO_MM: Record<Exclude<SourceUnit, "ml">, number> = { mm: 0, cm: 1, m: 3 };

export type ParsedMeasurement =
  | { ok: true; value: number; unit: MeasurementUnit; raw: string }
  | { ok: false; reason: string };

/**
 * Parses one measurement and converts it to the feature's unit without changing the
 * physical value. If `measurementText` has no unit (e.g. one value of "45×30×28 мм"),
 * the unit is taken from `context` only when the context contains exactly one unit token.
 */
export function parseMeasurement(
  measurementText: string,
  targetUnit: MeasurementUnit,
  context?: string,
): ParsedMeasurement {
  const raw = measurementText.trim();
  const numbers = [...raw.matchAll(new RegExp(NUMBER_PATTERN, "g"))];
  if (numbers.length !== 1) {
    return { ok: false, reason: `expected exactly one number in "${raw}"` };
  }
  const num = numbers[0]![1]!;

  let unitToken = raw.match(new RegExp(`${NUMBER_PATTERN}\\s*${UNIT_PATTERN}(?![а-яёa-z])`, "i"))?.[2];
  if (!unitToken && context) {
    const tokens = new Set(
      [...context.matchAll(new RegExp(`\\d\\s*${UNIT_PATTERN}(?![а-яёa-z])`, "gi"))].map((m) =>
        sourceUnit(m[1]!),
      ),
    );
    if (tokens.size === 1) {
      const only = [...tokens][0];
      unitToken = only === "mm" ? "мм" : only === "cm" ? "см" : only === "m" ? "м" : only === "ml" ? "мл" : undefined;
    }
  }
  const unit = unitToken ? sourceUnit(unitToken) : null;
  if (!unit) return { ok: false, reason: `no unambiguous unit for "${raw}"` };

  if (targetUnit === "mm") {
    if (unit === "ml") return { ok: false, reason: "volume unit given for a length feature" };
    return { ok: true, value: shiftDecimal(num, TO_MM[unit]), unit: "mm", raw };
  }
  if (targetUnit === "ml") {
    if (unit !== "ml") return { ok: false, reason: "length unit given for a volume feature" };
    return { ok: true, value: shiftDecimal(num, 0), unit: "ml", raw };
  }
  return { ok: false, reason: `unsupported target unit ${targetUnit}` };
}
