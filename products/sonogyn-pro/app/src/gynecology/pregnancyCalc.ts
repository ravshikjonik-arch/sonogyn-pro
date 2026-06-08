import { addDays, diffDaysLater, splitTotalDaysToWeeksDays, startOfLocalDay } from "./dateUtils";

export const PREGNANCY_CALC_VERSION =
  "Ориентиры срока беременности v1 (ПДР по ПМП ±280 дн.; УЗИ; КТР по таблице; ЭКО — условные +261/+263 дн.; не замена приказов/ЭМК)";

/** ПДР по первому дню последней менструации (правило Негеле: +280 дней). */
export function eddFromLmp(lmp: Date): Date {
  return addDays(startOfLocalDay(lmp), 280);
}

/** Срок беременности на указанную дату от ПМП. */
export function gaFromLmp(lmp: Date, ref: Date): { weeks: number; days: number; totalDays: number } {
  const totalDays = Math.max(0, diffDaysLater(startOfLocalDay(lmp), startOfLocalDay(ref)));
  const { weeks, days } = splitTotalDaysToWeeksDays(totalDays);
  return { weeks, days, totalDays };
}

/** Оценка ПДР по дате УЗИ и сроку на момент исследования (GA в полных неделях + днях). */
export function eddFromUltrasound(usDate: Date, gw: number, gDays: number): Date {
  const gaDays = Math.max(0, gw) * 7 + Math.min(6, Math.max(0, gDays));
  const remaining = 280 - gaDays;
  return addDays(startOfLocalDay(usDate), remaining);
}

/** Оценка ПДР по дате овуляции (+266 дней от овуляции как ориентир «от зачатия»). */
export function eddFromOvulation(ovulationDate: Date): Date {
  return addDays(startOfLocalDay(ovulationDate), 266);
}

/** ПДР после переноса эмбриона (часто в приложениях: 5 суток → +261 к.д., 3 суток → +263 к.д.; уточняйте у клиники ЭКО). */
export function eddFromEmbryoTransfer(transferDate: Date, embryoDay: 3 | 5): Date {
  const add = embryoDay === 5 ? 261 : 263;
  return addDays(startOfLocalDay(transferDate), add);
}

/** ПМП «обратно» от ПДР. */
export function lmpFromEdd(edd: Date): Date {
  return addDays(startOfLocalDay(edd), -280);
}

/** Точки КТР (мм) → срок в днях от ПМП; линейная интерполяция (упрощённо по табличным ориентирам I trimester). */
const CRL_MM_POINTS: [number, number][] = [
  [2, 29],
  [5, 36],
  [10, 49],
  [15, 55],
  [20, 60],
  [25, 64],
  [30, 67],
  [35, 70],
  [40, 73],
  [45, 76],
  [50, 79],
  [55, 81],
  [60, 84],
  [65, 87],
  [70, 90],
  [75, 93],
  [80, 96],
  [84, 98],
];

export function gaDaysFromCrlMm(crlMm: number): number | null {
  if (!Number.isFinite(crlMm) || crlMm < 2 || crlMm > 84) return null;
  for (let i = 0; i < CRL_MM_POINTS.length - 1; i++) {
    const [x0, y0] = CRL_MM_POINTS[i];
    const [x1, y1] = CRL_MM_POINTS[i + 1];
    if (crlMm >= x0 && crlMm <= x1) {
      const t = (crlMm - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return null;
}

export function eddFromCrlAndUsDate(usDate: Date, crlMm: number): Date | null {
  const gaDays = gaDaysFromCrlMm(crlMm);
  if (gaDays == null) return null;
  const remaining = 280 - gaDays;
  return addDays(startOfLocalDay(usDate), remaining);
}

/** Упрощённые ориентиры по одному параметру фетометрии (II–III триместр; для скринингов — ориентир, не замена CRL в I трим.). */
export function approximateGaDaysFromSingleBiometry(
  kind: "BPD" | "HC" | "FL" | "AC",
  mm: number
): number | null {
  if (!Number.isFinite(mm) || mm <= 0) return null;
  const cm = mm / 10;
  let days: number;
  switch (kind) {
    case "BPD":
      if (mm < 15 || mm > 120) return null;
      days = Math.round(42 + 2.1 * mm);
      break;
    case "HC":
      if (mm < 80 || mm > 380) return null;
      days = Math.round(52 + 0.62 * mm);
      break;
    case "FL":
      if (mm < 8 || mm > 90) return null;
      days = Math.round(46 + 2.7 * mm);
      break;
    case "AC":
      if (mm < 80 || mm > 400) return null;
      days = Math.round(48 + 0.35 * mm);
      break;
    default:
      return null;
  }
  return Math.max(49, Math.min(287, days));
}

export function eddFromBiometryAndUsDate(
  usDate: Date,
  kind: "BPD" | "HC" | "FL" | "AC",
  mm: number
): Date | null {
  const gaDays = approximateGaDaysFromSingleBiometry(kind, mm);
  if (gaDays == null) return null;
  return addDays(startOfLocalDay(usDate), 280 - gaDays);
}

/** Ориентиры скринингов по сроку (полные дни от ПМП). */
export function screeningHintsRu(totalDays: number): string[] {
  const lines: string[] = [];
  const w = totalDays / 7;
  if (totalDays >= 77 && totalDays <= 97) {
    lines.push("1-й скрининг (ориентир): примерно 11–13+6 нед (77–97 дн. от ПМП).");
  }
  if (w >= 18 && w <= 22) {
    lines.push("2-й скрининг (ориентир): примерно 18–22 недели.");
  }
  if (w >= 30 && w <= 34) {
    lines.push("3-й скрининг (ориентир): примерно 30–34 недели.");
  }
  if (lines.length === 0) {
    lines.push("Для выбора окна скрининга уточните срок по УЗИ/КТР или скорректируйте ПМП.");
  }
  return lines;
}

/** Ориентиры по ТК РФ (упрощённо): отпуск по БиР ~70 к.д. до ПДР при одноплодии. */
export function maternityLeaveHintsRu(edd: Date): { prenatalStart: Date; note: string } {
  const prenatalStart = addDays(startOfLocalDay(edd), -70);
  return {
    prenatalStart,
    note:
      "Упрощённый ориентир: отпуск по беременности и родам часто оформляют с ~70 календарных дней до предполагаемой даты родов (одноплодие). При многоплодии, осложнениях, региональных правилах и приказах МЗ — сроки другие; сверяйте с кадровой службой.",
  };
}
