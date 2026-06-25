import { buildProtocolChecklist, resolveProtocolWindow, type ProtocolChecklist } from "./protocolChecklists";
import { collectAllTokens } from "./findingSynonyms";
import type { BiometricData, DopplerData, GestationalAgeInput } from "./types";

export type ProtocolCompletionInput = {
  gestationalAge?: GestationalAgeInput;
  findings?: string[];
  biometricData?: BiometricData;
  dopplerData?: DopplerData | DopplerData[];
  /** Что уже выполнено в протоколе (текстовые метки) */
  completedVisualize?: string[];
  completedMeasure?: string[];
};

export type ProtocolGap = {
  category: "visualize" | "measure" | "mustNotMiss";
  item: string;
  priority: "required" | "recommended";
};

export type ProtocolCompletenessOutput = {
  window: ReturnType<typeof resolveProtocolWindow>;
  checklist: ProtocolChecklist;
  completenessScore: number;
  missing: ProtocolGap[];
  completed: { visualize: string[]; measure: string[] };
  summaryRu: string;
  nextActions: string[];
};

function normalizeItem(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function isItemDone(item: string, completed: string[]): boolean {
  const needle = normalizeItem(item);
  return completed.some((c) => {
    const hay = normalizeItem(c);
    return hay.includes(needle.slice(0, Math.min(needle.length, 20))) || needle.includes(hay.slice(0, 20));
  });
}

function inferCompletedFromData(
  input: ProtocolCompletionInput,
  checklist: ProtocolChecklist,
): { visualize: string[]; measure: string[] } {
  const visualize = [...(input.completedVisualize ?? [])];
  const measure = [...(input.completedMeasure ?? [])];
  const b = input.biometricData;

  if (b?.bpdMm) measure.push("BPD");
  if (b?.hcMm) measure.push("HC");
  if (b?.acMm) measure.push("AC");
  if (b?.flMm) measure.push("FL");
  if (b?.lateralVentricleMm != null) {
    measure.push("Lateral ventricle atrium");
    visualize.push("Brain transventricular");
  }

  const dopplers = input.dopplerData
    ? Array.isArray(input.dopplerData)
      ? input.dopplerData
      : [input.dopplerData]
    : [];
  for (const d of dopplers) {
    if (d.vessel === "UA" || d.uaPi != null) measure.push("UA-PI");
    if (d.vessel === "MCA" || d.mcaPi != null) measure.push("MCA-PI");
    if (d.vessel === "DV" || d.dvPi != null) measure.push("DV-PI");
  }

  return {
    visualize: [...new Set(visualize)],
    measure: [...new Set(measure)],
  };
}

/**
 * Этап 7 — оценка полноты протокола ISUOG по сроку и находкам.
 */
export function assessProtocolCompleteness(input: ProtocolCompletionInput): ProtocolCompletenessOutput {
  const weeks = input.gestationalAge?.weeks;
  const tokens = collectAllTokens(input.findings ?? [], input.biometricData, input.dopplerData);
  const checklist = buildProtocolChecklist(weeks, tokens);
  const completed = inferCompletedFromData(input, checklist);

  const missing: ProtocolGap[] = [];

  for (const item of checklist.visualize) {
    if (!isItemDone(item, completed.visualize)) {
      missing.push({ category: "visualize", item, priority: "recommended" });
    }
  }
  for (const item of checklist.measure) {
    if (!isItemDone(item, completed.measure)) {
      missing.push({ category: "measure", item, priority: "required" });
    }
  }
  for (const item of checklist.mustNotMiss) {
    missing.push({ category: "mustNotMiss", item, priority: "required" });
  }

  const total =
    checklist.visualize.length + checklist.measure.length + checklist.mustNotMiss.length;
  const doneCount = total - missing.filter((m) => m.category !== "mustNotMiss").length;
  const completenessScore = total > 0 ? Math.round((doneCount / total) * 100) : 100;

  const nextActions = missing
    .filter((m) => m.priority === "required")
    .slice(0, 6)
    .map((m) =>
      m.category === "mustNotMiss"
        ? `Не пропустить: ${m.item}`
        : m.category === "measure"
          ? `Доизмерить: ${m.item}`
          : `Досмотреть: ${m.item}`,
    );

  const summaryRu = [
    checklist.labelRu,
    `Полнота ~${completenessScore}%`,
    missing.length ? `Пробелы: ${missing.length}` : "Ключевые пункты закрыты",
  ].join(". ");

  return {
    window: resolveProtocolWindow(weeks),
    checklist,
    completenessScore,
    missing,
    completed,
    summaryRu,
    nextActions,
  };
}

export { buildProtocolChecklist, resolveProtocolWindow };
