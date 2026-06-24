/** Doctor birth date — ISO storage, RU display, age 18–100. */

export const BIRTH_DATE_MIN_AGE = 18;
export const BIRTH_DATE_MAX_AGE = 100;

export type ParsedBirthDate = {
  year: number;
  /** ISO YYYY-MM-DD */
  iso: string;
  /** DD.MM.YYYY for display */
  display: string;
};

export type BirthDateValidationError = "empty" | "invalid" | "future" | "too_young" | "too_old";

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parse ISO YYYY-MM-DD (local calendar). */
export function parseIsoBirthDate(iso: string): Date | null {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const yyyy = Number(m[1]);
  const mm = Number(m[2]) - 1;
  const dd = Number(m[3]);
  const d = new Date(yyyy, mm, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm || d.getDate() !== dd) return null;
  return d;
}

/** Parse DD.MM.YYYY (legacy). */
export function parseRuBirthDate(ru: string): Date | null {
  const t = ru.trim().replace(/\s/g, "");
  const m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]) - 1;
  const yyyy = Number(m[3]);
  if (mm < 0 || mm > 11 || dd < 1 || dd > 31) return null;
  const d = new Date(yyyy, mm, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm || d.getDate() !== dd) return null;
  return d;
}

export function isoFromDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatBirthDateRu(iso: string): string {
  const d = parseIsoBirthDate(iso);
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

/** Normalize ISO or legacy DD.MM.YYYY → ParsedBirthDate. */
export function normalizeBirthDateInput(value: string): ParsedBirthDate | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const fromIso = parseIsoBirthDate(trimmed);
  const date = fromIso ?? parseRuBirthDate(trimmed);
  if (!date) return null;

  const year = date.getFullYear();
  if (year < 1900 || year > 2100) return null;

  const iso = isoFromDate(date);
  return { year, iso, display: formatBirthDateRu(iso) };
}

/** Age in full years from ISO date of birth. */
export function ageFromBirthDateIso(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = parseIsoBirthDate(iso);
  if (!d) return null;
  const today = startOfLocalDay(new Date());
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age <= 130 ? age : null;
}

export function validateBirthDateIso(iso: string): BirthDateValidationError | null {
  if (!iso.trim()) return "empty";
  const parsed = normalizeBirthDateInput(iso);
  if (!parsed) return "invalid";

  const dob = parseIsoBirthDate(parsed.iso)!;
  const today = startOfLocalDay(new Date());
  if (dob.getTime() > today.getTime()) return "future";

  const age = ageFromBirthDateIso(parsed.iso);
  if (age === null) return "invalid";
  if (age < BIRTH_DATE_MIN_AGE) return "too_young";
  if (age > BIRTH_DATE_MAX_AGE) return "too_old";
  return null;
}

export function birthDateErrorMessage(err?: BirthDateValidationError | null): string {
  switch (err) {
    case "empty":
      return "Укажите дату рождения.";
    case "future":
      return "Дата рождения не может быть в будущем.";
    case "too_young":
      return `Врач должен быть старше ${BIRTH_DATE_MIN_AGE} лет.`;
    case "too_old":
      return `Укажите корректную дату рождения (возраст до ${BIRTH_DATE_MAX_AGE} лет).`;
    case "invalid":
    default:
      return "Укажите корректную дату рождения.";
  }
}

/** «35 лет», «21 год», «22 года». */
export function formatAgeYearsRu(age: number): string {
  const mod10 = age % 10;
  const mod100 = age % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${age} лет`;
  if (mod10 === 1) return `${age} год`;
  if (mod10 >= 2 && mod10 <= 4) return `${age} года`;
  return `${age} лет`;
}

/** Min/max ISO for native date pickers (today − 100 … today − 18). */
export function birthDatePickerBounds(now = new Date()): { minIso: string; maxIso: string; defaultIso: string } {
  const today = startOfLocalDay(now);
  const max = new Date(today.getFullYear() - BIRTH_DATE_MIN_AGE, today.getMonth(), today.getDate());
  const min = new Date(today.getFullYear() - BIRTH_DATE_MAX_AGE, today.getMonth(), today.getDate());
  const defaultDate = new Date(today.getFullYear() - 35, today.getMonth(), today.getDate());
  return { minIso: isoFromDate(min), maxIso: isoFromDate(max), defaultIso: isoFromDate(defaultDate) };
}

/** Resolve ISO from user_metadata birth_date (ISO or legacy RU). */
export function resolveBirthDateIso(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;
  return normalizeBirthDateInput(stored)?.iso ?? null;
}
