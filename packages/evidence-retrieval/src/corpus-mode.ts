import type { EvidenceCorpusMode, EvidenceProviderId } from "./types.js";

/** UI / API labels for corpus modes. */
export const EVIDENCE_CORPUS_MODE_LABELS: Record<EvidenceCorpusMode, string> = {
  all: "Все источники",
  rf_kr: "КР МЗ РФ",
  rf_npa: "НПА / приказы",
  rf_all: "КР + НПА РФ",
};

export const EVIDENCE_CORPUS_MODES: EvidenceCorpusMode[] = ["all", "rf_kr", "rf_npa", "rf_all"];

/** Guideline shelves from @repo/clinical-guidelines for RF modes. */
export function shelvesForCorpusMode(mode?: EvidenceCorpusMode): string[] | undefined {
  switch (mode) {
    case "rf_kr":
      return ["kr_mz_rf"];
    case "rf_npa":
      return ["orders_dzm", "orders_mz_rf"];
    case "rf_all":
      return ["kr_mz_rf", "orders_dzm", "orders_mz_rf", "protocols_org"];
    default:
      return undefined;
  }
}

/** Restrict adapters when RF corpus modes are active. */
export function providersForCorpusMode(mode?: EvidenceCorpusMode): EvidenceProviderId[] | undefined {
  switch (mode) {
    case "rf_kr":
    case "rf_npa":
    case "rf_all":
      return ["kr_mz_rf"];
    default:
      return undefined;
  }
}

export function isRfCorpusMode(mode?: EvidenceCorpusMode): boolean {
  return mode === "rf_kr" || mode === "rf_npa" || mode === "rf_all";
}

export function emptyCorpusMessage(query: string, mode?: EvidenceCorpusMode): string {
  const label = mode ? EVIDENCE_CORPUS_MODE_LABELS[mode] : "корпусе";
  if (isRfCorpusMode(mode)) {
    return (
      `В режиме «${label}» по запросу «${query}» релевантных документов не найдено. ` +
      `Ответ не сформирован — нет данных в выбранном корпусе. ` +
      `Уточните формулировку или переключитесь на «Все источники».`
    );
  }
  return (
    `По запросу «${query}» live-источники не вернули результатов. ` +
    `Попробуйте переформулировать или уточнить клинический контекст.`
  );
}
