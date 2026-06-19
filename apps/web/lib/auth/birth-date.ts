import { isoFromRu, parseIsoDate, parseRuDate } from "@/lib/utils/ru-date";

export type ParsedBirthDate = {
  year: number;
  /** ISO YYYY-MM-DD */
  iso: string;
  /** DD.MM.YYYY */
  display: string;
};

/** Парсит дату рождения в формате ДД.ММ.ГГГГ (или ISO). */
export function parseBirthDateInput(value: string): ParsedBirthDate | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const fromRu = parseRuDate(trimmed);
  const date = fromRu ?? parseIsoDate(trimmed);
  if (!date) return null;

  const year = date.getFullYear();
  if (year < 1900 || year > 2100) return null;

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const iso = `${year}-${mm}-${dd}`;

  return { year, iso, display: `${dd}.${mm}.${year}` };
}

/** Из тела API: birth_date (ДД.ММ.ГГГГ / ISO) или birth_year (4 цифры). */
export function parseBirthYearFromBody(body: Record<string, unknown>): number | null {
  const birthDateRaw = body.birth_date;
  if (typeof birthDateRaw === "string" && birthDateRaw.trim()) {
    const parsed = parseBirthDateInput(birthDateRaw);
    if (parsed) return parsed.year;
    const iso = isoFromRu(birthDateRaw);
    if (iso) {
      const fromIso = parseBirthDateInput(iso);
      if (fromIso) return fromIso.year;
    }
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

export function birthDateErrorMessage(): string {
  return "Укажите дату рождения в формате ДД.ММ.ГГГГ, например 21.12.1988.";
}
