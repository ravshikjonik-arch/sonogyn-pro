import {
  ageFromBirthDateIso,
  birthDateErrorMessage,
  formatAgeYearsRu,
  formatBirthDateRu,
  normalizeBirthDateInput,
  type BirthDateValidationError,
  type ParsedBirthDate,
  validateBirthDateIso,
} from "@repo/types";

export type { BirthDateValidationError, ParsedBirthDate };

export {
  ageFromBirthDateIso,
  formatAgeYearsRu,
  formatBirthDateRu,
  normalizeBirthDateInput,
  validateBirthDateIso,
};

/** Parses and validates birth date (ISO or legacy DD.MM.YYYY). */
export function parseBirthDateInput(value: string): ParsedBirthDate | null {
  const parsed = normalizeBirthDateInput(value);
  if (!parsed) return null;
  if (validateBirthDateIso(parsed.iso)) return null;
  return parsed;
}

/** From API body: birth_date (ISO / DD.MM.YYYY) or birth_year. */
export function parseBirthYearFromBody(body: Record<string, unknown>): number | null {
  const birthDateRaw = body.birth_date;
  if (typeof birthDateRaw === "string" && birthDateRaw.trim()) {
    const parsed = normalizeBirthDateInput(birthDateRaw);
    if (parsed && !validateBirthDateIso(parsed.iso)) return parsed.year;
  }

  const birthYearRaw = body.birth_year;
  if (typeof birthYearRaw === "number" && Number.isFinite(birthYearRaw)) {
    const y = Math.trunc(birthYearRaw);
    return y >= 1900 && y <= 2100 ? y : null;
  }
  if (typeof birthYearRaw === "string" && /^\d{4}$/.test(birthYearRaw.trim())) {
    return Number.parseInt(birthYearRaw.trim(), 10);
  }

  return null;
}

export function birthDateErrorMessageForValue(value: string): string {
  if (!value.trim()) return birthDateErrorMessage("empty");
  const parsed = normalizeBirthDateInput(value);
  if (!parsed) return birthDateErrorMessage("invalid");
  return birthDateErrorMessage(validateBirthDateIso(parsed.iso));
}

export { birthDateErrorMessage };
