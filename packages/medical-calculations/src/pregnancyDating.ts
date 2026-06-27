import {
  approximateGaDaysFromBiometry,
  eddFromGaAtStudy,
  eddFromLmp,
  gaDaysFromCrlTable,
  gaDaysFromMsdTable,
  gaDaysFromLmp,
  splitGaDays,
  type BiometryKind,
} from "./gestationalAge";

/** Максимум для «текущей» беременности (43+0). */
export const MAX_ONGOING_GA_DAYS = 43 * 7;

export type DatingFromStudyStatus = "ongoing" | "post_term" | "completed";

export type DatingFromStudyResult = {
  lmpEstimate: Date;
  edd: Date;
  gaAtStudyDays: number;
  gaAtReferenceDays: number;
  status: DatingFromStudyStatus;
  daysPastEdd: number;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() + n);
  return x;
}

function diffCalendarDays(from: Date, to: Date): number {
  return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

/** ПМП-оценка: дата УЗИ − срок на момент исследования (без обхода через ПДР). */
export function lmpEstimateFromGaAtStudy(studyDate: Date, gaDaysAtStudy: number): Date {
  return addDays(studyDate, -Math.max(0, gaDaysAtStudy));
}

/**
 * Датировка по сроку на дату УЗИ → ПМП, ПДР, срок на reference (обычно сегодня).
 * Если ПДР давно прошла — status completed (не показываем 300+ нед.).
 */
export function datingFromGaAtStudy(
  studyDate: Date,
  gaDaysAtStudy: number,
  referenceDate: Date = new Date(),
): DatingFromStudyResult {
  const study = startOfDay(studyDate);
  const ref = startOfDay(referenceDate);
  const gaAtStudyDays = Math.max(0, gaDaysAtStudy);
  const lmpEstimate = lmpEstimateFromGaAtStudy(study, gaAtStudyDays);
  const edd = eddFromLmp(lmpEstimate);

  const daysSinceStudy = Math.max(0, diffCalendarDays(study, ref));
  let gaAtReferenceDays = gaAtStudyDays + daysSinceStudy;
  const daysPastEdd = diffCalendarDays(edd, ref);

  let status: DatingFromStudyStatus = "ongoing";
  if (daysPastEdd > 14) {
    status = "completed";
    gaAtReferenceDays = gaAtStudyDays;
  } else if (gaAtReferenceDays > MAX_ONGOING_GA_DAYS) {
    status = "post_term";
    gaAtReferenceDays = MAX_ONGOING_GA_DAYS;
  }

  return { lmpEstimate, edd, gaAtStudyDays, gaAtReferenceDays, status, daysPastEdd };
}

export function datingFromCrlAndUsDate(
  usDate: Date,
  crlMm: number,
  referenceDate?: Date,
): (DatingFromStudyResult & { crlMm: number }) | null {
  const gaDays = gaDaysFromCrlTable(crlMm);
  if (gaDays == null) return null;
  return { ...datingFromGaAtStudy(usDate, gaDays, referenceDate ?? new Date()), crlMm };
}

/** Датировка по СВД (MSD) — табл. 1.1 Medvedev / Grisolia 1993, gaP50. */
export function datingFromMsdAndUsDate(
  usDate: Date,
  msdMm: number,
  referenceDate?: Date,
): (DatingFromStudyResult & { msdMm: number }) | null {
  const gaDays = gaDaysFromMsdTable(msdMm);
  if (gaDays == null) return null;
  return { ...datingFromGaAtStudy(usDate, gaDays, referenceDate ?? new Date()), msdMm };
}

export function datingFromBiometryAndUsDate(
  usDate: Date,
  kind: BiometryKind,
  mm: number,
  referenceDate?: Date,
): DatingFromStudyResult | null {
  const gaDays = approximateGaDaysFromBiometry(kind, mm);
  if (gaDays == null) return null;
  return datingFromGaAtStudy(usDate, gaDays, referenceDate ?? new Date());
}

export function formatGaTodayLabel(d: DatingFromStudyResult): { line: string; hintsGaDays: number } {
  const hintsGaDays = d.status === "completed" ? d.gaAtStudyDays : d.gaAtReferenceDays;
  if (d.status === "completed") {
    return {
      line: "Срок на сегодня: — (ПДР прошла; для текущей беременности укажите свежую дату УЗИ или ПМП)",
      hintsGaDays,
    };
  }
  const { weeks, days } = splitGaDays(d.gaAtReferenceDays);
  if (d.status === "post_term") {
    return {
      line: `Срок на сегодня: ${weeks} нед. ${days} дн. (переношенная — уточните на приёме)`,
      hintsGaDays: d.gaAtReferenceDays,
    };
  }
  return { line: `Срок на сегодня: ${weeks} нед. ${days} дн.`, hintsGaDays: d.gaAtReferenceDays };
}

/** Обратный расчёт от введённой ПДР. */
export function datingFromEdd(edd: Date, referenceDate: Date = new Date()): DatingFromStudyResult {
  const eddDay = startOfDay(edd);
  const lmpEstimate = lmpFromEdd(eddDay);
  const ref = startOfDay(referenceDate);
  let gaAtReferenceDays = gaDaysFromLmp(lmpEstimate, ref);
  const daysPastEdd = diffCalendarDays(eddDay, ref);

  let status: DatingFromStudyStatus = "ongoing";
  const gaAtStudyDays = gaAtReferenceDays;
  if (daysPastEdd > 14) {
    status = "completed";
    gaAtReferenceDays = 0;
  } else if (gaAtReferenceDays > MAX_ONGOING_GA_DAYS) {
    status = "post_term";
    gaAtReferenceDays = MAX_ONGOING_GA_DAYS;
  }

  return {
    lmpEstimate,
    edd: eddDay,
    gaAtStudyDays: status === "completed" ? 0 : gaAtStudyDays,
    gaAtReferenceDays,
    status,
    daysPastEdd,
  };
}

/** ПДР по дате УЗИ и сроку на момент исследования (нед + дни). */
export function eddFromUltrasound(usDate: Date, weeks: number, days: number): Date {
  const gaDays = Math.max(0, weeks) * 7 + Math.min(6, Math.max(0, days));
  return eddFromGaAtStudy(startOfDay(usDate), gaDays);
}

/** ПМП «обратно» от ПДР (Негеле +280). */
export function lmpFromEdd(edd: Date): Date {
  return addDays(edd, -280);
}

/** ПДР от овуляции (+266 дн.). */
export function eddFromOvulation(ovulationDate: Date): Date {
  return addDays(ovulationDate, 266);
}

/** ПДР после переноса эмбриона (5 суток → +261, 3 суток → +263). */
export function eddFromEmbryoTransfer(transferDate: Date, embryoDay: 3 | 5): Date {
  return addDays(transferDate, embryoDay === 5 ? 261 : 263);
}

export function eddFromCrlAndUsDate(usDate: Date, crlMm: number): Date | null {
  const d = datingFromCrlAndUsDate(usDate, crlMm, usDate);
  return d?.edd ?? null;
}

export function eddFromBiometryAndUsDate(usDate: Date, kind: BiometryKind, mm: number): Date | null {
  const d = datingFromBiometryAndUsDate(usDate, kind, mm, usDate);
  return d?.edd ?? null;
}

/** Ориентиры отпуска по БиР (упрощённо, ТК РФ). */
export function maternityLeaveHintsRu(edd: Date): { prenatalStart: Date; note: string } {
  return {
    prenatalStart: addDays(edd, -70),
    note:
      "Упрощённый ориентир: отпуск по беременности и родам часто оформляют с ~70 календарных дней до ПДР (одноплодие). При многоплодии и осложнениях сроки другие — сверяйте с кадровой службой и приказами МЗ.",
  };
}

export const PREGNANCY_DATING_DISCLAIMER =
  "Ориентиры срока и ПДР. Не заменяют протокол учреждения, ЭМК и приказы МЗ РФ.";

/** Срок по первым шевелениям: primipara ~20 нед, multipara ~18 нед от quickening. */
export function datingFromFetalMovement(
  movementDate: Date,
  multiparous: boolean,
): { estimatedGaDays: number; edd: Date; note: string } {
  const quickeningGaDays = multiparous ? 18 * 7 : 20 * 7;
  const today = startOfDay(new Date());
  const mov = startOfDay(movementDate);
  const daysSinceMovement = Math.max(0, Math.floor((today.getTime() - mov.getTime()) / 86400000));
  const estimatedGaDays = quickeningGaDays + daysSinceMovement;
  const edd = addDays(mov, 280 - quickeningGaDays);
  return {
    estimatedGaDays,
    edd,
    note: multiparous
      ? "Многородящие: ориентир quickening ~18 нед (±2). Погрешность высокая — предпочтительна датировка по УЗI I триместра."
      : "Первобеременные: quickening ~20 нед (±2). Не заменяет КТР/ПМП при расхождении >7 дней.",
  };
}

/** Срок по явке в ЖК: дата постановки на учёт + срок на момент явки. */
export function datingFromAntenatalVisit(
  visitDate: Date,
  weeksAtVisit: number,
  daysAtVisit: number,
  referenceDate: Date = new Date(),
): DatingFromStudyResult {
  const gaAtVisit = Math.max(0, weeksAtVisit) * 7 + Math.min(6, Math.max(0, daysAtVisit));
  return datingFromGaAtStudy(visitDate, gaAtVisit, referenceDate);
}
