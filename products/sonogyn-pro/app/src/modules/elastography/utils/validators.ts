import { HARD_LIMITS } from "@repo/medical-calculations/elastography";
import { DEVICE_CALIBRATION } from "../constants/device";
import type { FieldDefinition } from "../types";

export type ValidationIssue = {
  field: string;
  messageKey: string;
  severity: "error" | "warning";
};

/** Проверка числового поля по определению */
export function validateField(field: FieldDefinition, raw: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!raw.trim()) {
    if (!field.optional) issues.push({ field: field.key, messageKey: "elasto_val_required", severity: "error" });
    return issues;
  }
  const n = Number(raw.replace(",", "."));
  if (Number.isNaN(n)) {
    issues.push({ field: field.key, messageKey: "elasto_val_number", severity: "error" });
    return issues;
  }
  if (n < field.min || n > field.max) {
    issues.push({ field: field.key, messageKey: "elasto_val_range", severity: "error" });
  }
  return issues;
}

/** Предупреждения калибровки прибора */
export function calibrationWarnings(fieldKey: string, value: number): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (
    fieldKey.includes("Kpa") ||
    fieldKey.includes("kpa") ||
    fieldKey === "emaxKpa" ||
    fieldKey === "youngModulusKpa" ||
    fieldKey === "lesionYoungModulusKpa" ||
    fieldKey === "referenceMyometriumKpa"
  ) {
    if (value > DEVICE_CALIBRATION.kpa.warnAbove) {
      out.push({ field: fieldKey, messageKey: "elasto_warn_kpa_calibration", severity: "warning" });
    }
  }
  if (fieldKey === "strainRatio" && value > DEVICE_CALIBRATION.strainRatio.warnAbove) {
    out.push({ field: fieldKey, messageKey: "elasto_warn_strain_calibration", severity: "warning" });
  }
  if (
    (fieldKey === "internalOsStiffness" || fieldKey === "externalOsStiffness") &&
    (value < HARD_LIMITS.stiffnessIndex.min || value > HARD_LIMITS.stiffnessIndex.max)
  ) {
    out.push({ field: fieldKey, messageKey: "elasto_warn_cci_range", severity: "warning" });
  }
  return out;
}

export function validateAllFields(fields: FieldDefinition[], values: Record<string, string>): ValidationIssue[] {
  const all: ValidationIssue[] = [];
  for (const f of fields) {
    all.push(...validateField(f, values[f.key] ?? ""));
    const raw = values[f.key];
    if (raw?.trim()) {
      const n = Number(raw.replace(",", "."));
      if (!Number.isNaN(n)) all.push(...calibrationWarnings(f.key, n));
    }
  }
  return all;
}

export function parseNumeric(values: Record<string, string>, key: string): number | undefined {
  const raw = values[key]?.trim();
  if (!raw) return undefined;
  const n = Number(raw.replace(",", "."));
  return Number.isNaN(n) ? undefined : n;
}

/** Быстрая проверка диапазона кПа */
export function isKpaInRange(kpa: number): boolean {
  return kpa >= HARD_LIMITS.kPa.min && kpa <= HARD_LIMITS.kPa.max;
}

export function isBreastEmaxInRange(kpa: number): boolean {
  return kpa >= HARD_LIMITS.kPa.min && kpa <= HARD_LIMITS.kPa.max;
}

export function isOvaryStrainInRange(ratio: number): boolean {
  return ratio >= HARD_LIMITS.strainRatio.min && ratio <= HARD_LIMITS.strainRatio.max;
}
