import type { BiometryKind } from "./gestationalAge";

export type ValidationSeverity = "info" | "warning" | "critical";

export type ValidationMessage = {
  field: string;
  severity: ValidationSeverity;
  message: string;
};

/** Physiological ranges (mm) — orienting; not exhaustive. */
const BIOMETRY_RANGES: Record<BiometryKind | "CRL", { min: number; max: number; label: string }> = {
  CRL: { min: 2, max: 84, label: "КТР" },
  BPD: { min: 15, max: 120, label: "БПР" },
  HC: { min: 80, max: 380, label: "ОГ" },
  AC: { min: 80, max: 400, label: "ОЖ" },
  FL: { min: 8, max: 90, label: "ДБ" },
  HL: { min: 8, max: 70, label: "ДП" },
};

export function validateBiometryMm(
  kind: BiometryKind | "CRL",
  mm: number,
): ValidationMessage | null {
  if (!Number.isFinite(mm) || mm <= 0) {
    return {
      field: kind,
      severity: "warning",
      message: `${BIOMETRY_RANGES[kind].label}: введите положительное число`,
    };
  }
  const { min, max, label } = BIOMETRY_RANGES[kind];
  if (mm < min || mm > max) {
    return {
      field: kind,
      severity: "critical",
      message: `${label} ${mm} мм вне ориентировочного диапазона (${min}–${max} мм)`,
    };
  }
  return null;
}

export function validateLmpBeforeStudy(lmp: Date, studyDate: Date): ValidationMessage | null {
  const l = startOfDay(lmp);
  const s = startOfDay(studyDate);
  if (l.getTime() > s.getTime()) {
    return {
      field: "lmp",
      severity: "critical",
      message: "Дата последней менструации не может быть позже даты исследования",
    };
  }
  const gaDays = Math.floor((s.getTime() - l.getTime()) / 86_400_000);
  if (gaDays > 310) {
    return {
      field: "lmp",
      severity: "warning",
      message: "Срок по ПМП > 44 нед — проверьте даты",
    };
  }
  return null;
}

/** BPD should generally increase with GA — soft check vs expected median. */
export function validateBpdVsGa(bpdMm: number, gaDays: number): ValidationMessage | null {
  if (!Number.isFinite(bpdMm) || !Number.isFinite(gaDays)) return null;
  const expectedApprox = 10 + 0.25 * gaDays;
  const diff = Math.abs(bpdMm - expectedApprox);
  if (diff > 25) {
    return {
      field: "BPD",
      severity: "warning",
      message: `БПР (${bpdMm} мм) существенно расходится с ожидаемым для срока ~${Math.floor(gaDays / 7)} нед`,
    };
  }
  return null;
}

export function validateEfwGrams(grams: number, gaDays: number): ValidationMessage | null {
  if (!Number.isFinite(grams) || grams <= 0) return null;
  const weeks = gaDays / 7;
  if (weeks < 18) return null;
  const expected = 100 * weeks ** 1.5;
  if (grams < expected * 0.5) {
    return {
      field: "EFW",
      severity: "critical",
      message: `Масса плода ${grams} г критически мала для ~${Math.floor(weeks)} нед`,
    };
  }
  if (grams > expected * 2.2) {
    return {
      field: "EFW",
      severity: "warning",
      message: `Масса плода ${grams} г выше ожидаемого диапазона для ~${Math.floor(weeks)} нед`,
    };
  }
  return null;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
