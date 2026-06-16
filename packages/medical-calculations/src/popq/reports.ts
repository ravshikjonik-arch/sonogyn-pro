import type { CompartmentKey, PopQInput, PopQPointKey, PopQStageKey } from "./types";

function stageLabel(stage: PopQStageKey): string {
  if (stage === "na") return "—";
  return `POP-Q Stage ${stage === "0" ? "0" : stage}`;
}

function compartmentLabel(key: CompartmentKey): string {
  if (key === "anterior") return "Передний компартмент";
  if (key === "posterior") return "Задний компартмент";
  return "Апикальный компартмент";
}

function formatPoint(v: number | undefined, unit = "см"): string {
  return v !== undefined && Number.isFinite(v) ? `${v} ${unit}` : "—";
}

function contextLabel(uterusPresent: boolean): string {
  return uterusPresent ? "Матка сохранена" : "После гистерэктомии (точка D не оценивается)";
}

function formatExamDate(examinedAt?: string | Date): string {
  const d = examinedAt ? new Date(examinedAt) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString("ru-RU");
  return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
}

/** Лист для пациентки — понятный язык, без клинического жаргона в заголовках. */
export function buildPatientReportText(input: {
  protocolLine: string;
  uterusPresent: boolean;
  points: PopQInput;
}): string {
  const lines = [
    "Результаты осмотра по шкале POP-Q",
    "",
    input.protocolLine,
    "",
    "Точки (см относительно гимена):",
    ...(["Aa", "Ba", "Ap", "Bp", "C", "D", "GH", "PB", "TVL"] as PopQPointKey[])
      .filter((k) => k !== "D" || input.uterusPresent)
      .map((k) => {
        const v = input.points[k];
        return `  ${k}: ${v !== undefined ? `${v} см` : "—"}`;
      }),
    "",
    "Иллюстрация носит обучающий характер и не является точным изображением вашего осмотра.",
    "Интерпретация и тактика лечения определяются лечащим врачом.",
  ];
  return lines.join("\n");
}

/** Протокол для медицинской документации / вставки в осмотр или УЗИ-протокол. */
export function buildClinicalProtocolText(input: {
  protocolLine: string;
  uterusPresent: boolean;
  points: PopQInput;
  stageKey: PopQStageKey;
  leading: { key: CompartmentKey; value: number } | null;
  leadingPoint?: PopQPointKey | null;
  maxPoint?: number | null;
  examinedAt?: string | Date;
}): string {
  const p = input.points;
  const leadPoint = input.leadingPoint ? ` (${input.leadingPoint})` : "";
  const maxText =
    input.maxPoint != null
      ? `${input.maxPoint} см${leadPoint}`
      : input.leading
        ? `${input.leading.value} см${leadPoint}`
        : "—";

  const gridBlock = [
    "Сетка POP-Q (см, 0 — уровень гимена):",
    "",
    `       Aa: ${formatPoint(p.Aa)}    Ba: ${formatPoint(p.Ba)}    C: ${formatPoint(p.C)}`,
    `       GH: ${formatPoint(p.GH)}    PB: ${formatPoint(p.PB)}    TVL: ${formatPoint(p.TVL)}`,
    input.uterusPresent
      ? `       Ap: ${formatPoint(p.Ap)}    Bp: ${formatPoint(p.Bp)}    D: ${formatPoint(p.D)}`
      : `       Ap: ${formatPoint(p.Ap)}    Bp: ${formatPoint(p.Bp)}    D: N/A`,
    "",
  ];

  const lines = [
    "ПРОТОКОЛ ОСМОТРА · ШКАЛА POP-Q",
    `Дата: ${formatExamDate(input.examinedAt)}`,
    "",
    "Осмотр на гинекологическом кресле. Оценка пролапса органов малого таза по международной шкале POP-Q.",
    "",
    `Контекст: ${contextLabel(input.uterusPresent)}.`,
    "",
    ...gridBlock,
    "Передняя стенка: Aa, Ba. Задняя стенка: Ap, Bp. Апикальный отдел: C" +
      (input.uterusPresent ? ", D." : "."),
    `GH — промежуток уретры–гимен; PB — гимен–середина ануса; TVL — глубина влагалища.`,
    "",
    `Максимальная точка пролапса: ${maxText}`,
    `Стадия POP-Q: ${stageLabel(input.stageKey)}`,
    input.leading
      ? `Ведущий компартмент: ${compartmentLabel(input.leading.key)} (${input.leading.value} см)`
      : "Ведущий компартмент: не определён",
    "",
    "ЗАКЛЮЧЕНИЕ:",
    input.protocolLine,
    "",
    "Данные носят вспомогательный характер и не заменяют клиническое заключение врача.",
    "Интерпретация, тактика ведения и показания к оперативному лечению определяются специалистом.",
  ];
  return lines.join("\n");
}
