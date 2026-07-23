import type { BiradsCategoryCode } from "./types";

const RANK: Record<BiradsCategoryCode, number> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4A": 4,
  "4B": 5,
  "4C": 6,
  "5": 7,
  "6": 8,
  "0": 0,
};

export type CombinedBiradsSuggestion = {
  /** Более «тяжёлая» из двух финальных (кроме 0). */
  suggestedCode: BiradsCategoryCode;
  reasonRu: string;
  needsCompletion: boolean;
};

function parseCode(raw?: string | null): BiradsCategoryCode | null {
  if (!raw) return null;
  const m = raw.replace(/^BI-RADS\s*/i, "").trim().toUpperCase();
  if (m in RANK) return m as BiradsCategoryCode;
  return null;
}

/**
 * Комбинированное заключение ММГ + УЗИ: берём более высокую категорию подозрения.
 * BI-RADS 0 на любой стороне → итоговая 0 (неполная оценка), если нет 6.
 */
export function combineBiradsCategories(params: {
  usCategory?: string | null;
  mmgCategory?: string | null;
}): CombinedBiradsSuggestion {
  const us = parseCode(params.usCategory);
  const mmg = parseCode(params.mmgCategory);

  if (!us && !mmg) {
    return {
      suggestedCode: "0",
      reasonRu: "Нет категорий с УЗИ и ММГ — заполните хотя бы один блок.",
      needsCompletion: true,
    };
  }

  if (us === "6" || mmg === "6") {
    return {
      suggestedCode: "6",
      reasonRu: "Есть морфологически подтверждённое ЗНО (BI-RADS 6) — комбинированная категория 6.",
      needsCompletion: false,
    };
  }

  if (us === "0" || mmg === "0") {
    return {
      suggestedCode: "0",
      reasonRu: "Одна из модальностей — BI-RADS 0 (неполная оценка). Дообследуйте до финальной категории.",
      needsCompletion: true,
    };
  }

  const a = us ?? "1";
  const b = mmg ?? "1";
  const suggestedCode = RANK[a] >= RANK[b] ? a : b;
  return {
    suggestedCode,
    reasonRu: `По правилу «худшая / более подозрительная категория»: УЗИ ${us ? `BI-RADS ${us}` : "—"}, ММГ ${mmg ? `BI-RADS ${mmg}` : "—"}. Врач подтверждает итог.`,
    needsCompletion: false,
  };
}
