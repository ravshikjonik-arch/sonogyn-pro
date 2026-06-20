import {
  approximateGaDaysFromBiometry,
  eddFromGaAtStudy,
  gaDaysFromCrlTable,
  gaDaysFromLmp,
  type BiometryKind,
} from "./gestationalAge";

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
  const gaDays = gaDaysFromCrlTable(crlMm);
  if (gaDays == null) return null;
  return eddFromGaAtStudy(startOfDay(usDate), gaDays);
}

export function eddFromBiometryAndUsDate(usDate: Date, kind: BiometryKind, mm: number): Date | null {
  const gaDays = approximateGaDaysFromBiometry(kind, mm);
  if (gaDays == null) return null;
  return eddFromGaAtStudy(startOfDay(usDate), gaDays);
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
): { edd: Date; lmpEstimate: Date; gaTodayDays: number } {
  const gaAtVisit = Math.max(0, weeksAtVisit) * 7 + Math.min(6, Math.max(0, daysAtVisit));
  const edd = eddFromGaAtStudy(startOfDay(visitDate), gaAtVisit);
  const lmpEstimate = lmpFromEdd(edd);
  const gaTodayDays = gaDaysFromLmp(lmpEstimate, new Date());
  return { edd, lmpEstimate, gaTodayDays };
}
