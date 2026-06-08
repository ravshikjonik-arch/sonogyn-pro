/** Работа с датами в локальном календаре (без UTC-сдвигов на полночь). */

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

export function splitTotalDaysToWeeksDays(totalDays: number): { weeks: number; days: number } {
  const w = Math.floor(totalDays / 7);
  const d = totalDays % 7;
  return { weeks: w, days: d };
}
