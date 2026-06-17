import {
  approximateGaDaysFromBiometry,
  eddFromGaAtStudy,
  gaDaysFromCrlTable,
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
