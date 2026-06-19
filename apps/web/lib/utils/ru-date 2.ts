/** Локальный календарь без UTC-сдвигов на полночь. */

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

export function diffDaysLater(from: Date, to: Date): number {
  const a = startOfLocalDay(from).getTime();
  const b = startOfLocalDay(to).getTime();
  return Math.round((b - a) / 86400000);
}

/** dd.mm.yyyy или dd/mm/yyyy */
export function parseRuDate(s: string): Date | null {
  const t = s.trim().replace(/\s/g, "");
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

export function formatRuDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/** ISO YYYY-MM-DD → Date (локально) */
export function parseIsoDate(iso: string): Date | null {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const yyyy = Number(m[1]);
  const mm = Number(m[2]) - 1;
  const dd = Number(m[3]);
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

export function ruFromIso(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = parseIsoDate(iso);
  return d ? formatRuDate(d) : "";
}

export function isoFromRu(ru: string): string | undefined {
  const d = parseRuDate(ru);
  return d ? isoFromDate(d) : undefined;
}

/** Нормализует вставку: 20032026, 20-03-2026, 20/03/26 → цифры для маски */
export function normalizeRuDateDigits(raw: string): string {
  const t = raw.trim();
  const sep = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (sep) {
    const dd = sep[1].padStart(2, "0");
    const mm = sep[2].padStart(2, "0");
    let yyyy = sep[3];
    if (yyyy.length === 2) {
      const yy = Number(yyyy);
      yyyy = String(yy >= 50 ? 1900 + yy : 2000 + yy);
    }
    return `${dd}${mm}${yyyy}`;
  }
  return t.replace(/\D/g, "").slice(0, 8);
}

/** Маска ввода: цифры → dd.mm.yyyy */
export function maskRuDateInput(raw: string): string {
  const digits = normalizeRuDateDigits(raw);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

export function isCompleteRuDate(s: string): boolean {
  return parseRuDate(s) !== null;
}
