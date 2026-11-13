import type { EvidenceCorpusMode, EvidenceProviderId } from "./types.js";

/** UI / API labels for corpus modes. */
export const EVIDENCE_CORPUS_MODE_LABELS: Record<EvidenceCorpusMode, string> = {
  all: "Все источники",
  rf_kr: "КР МЗ РФ",
  rf_npa: "НПА / приказы",
  rf_all: "КР + НПА РФ",
  rcog: "RCOG Green-top",
};

export const EVIDENCE_CORPUS_MODES: EvidenceCorpusMode[] = [
  "all",
  "rf_kr",
  "rf_npa",
  "rf_all",
  "rcog",
];

/** Guideline shelves from @repo/clinical-guidelines for RF modes. */
export function shelvesForCorpusMode(mode?: EvidenceCorpusMode): string[] | undefined {
  switch (mode) {
    case "rf_kr":
      return ["kr_mz_rf"];
    case "rf_npa":
      return ["orders_dzm", "orders_mz_rf"];
    case "rf_all":
      return ["kr_mz_rf", "orders_dzm", "orders_mz_rf", "protocols_org"];
    case "rcog":
      return ["international"];
    default:
      return undefined;
  }
}

/** Restrict adapters when RF / RCOG corpus modes are active. */
export function providersForCorpusMode(mode?: EvidenceCorpusMode): EvidenceProviderId[] | undefined {
  switch (mode) {
    case "rf_kr":
    case "rf_npa":
    case "rf_all":
      return ["kr_mz_rf", "rf_regulation"];
    case "rcog":
      return ["rcog"];
    default:
      return undefined;
  }
}

export function isRfCorpusMode(mode?: EvidenceCorpusMode): boolean {
  return mode === "rf_kr" || mode === "rf_npa" || mode === "rf_all";
}

export function isRestrictedCorpusMode(mode?: EvidenceCorpusMode): boolean {
  return isRfCorpusMode(mode) || mode === "rcog";
}

export function emptyCorpusMessage(query: string, mode?: EvidenceCorpusMode): string {
  const label = mode ? EVIDENCE_CORPUS_MODE_LABELS[mode] : "корпусе";
  if (isRestrictedCorpusMode(mode)) {
    const hint =
      mode === "rcog"
        ? `RCOG — UK ориентир; для РФ сверьте КР Минздрава. Или откройте хаб /tools/refs/rcog-green-top.`
        : `Уточните формулировку или переключитесь на «Все источники».`;
    return (
      `В режиме «${label}» по запросу «${query}» релевантных документов не найдено. ` +
      `Ответ не сформирован — нет данных в выбранном корпусе. ` +
      hint
    );
  }
  return (
    `По запросу «${query}» live-источники не вернули результатов. ` +
    `Попробуйте переформулировать или уточнить клинический контекст.`
  );
}
