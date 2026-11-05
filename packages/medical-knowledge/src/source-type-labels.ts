import type { z } from "zod";

import { SourceTypeSchema } from "./types";

export type SourceType = z.infer<typeof SourceTypeSchema>;

/** Clinician-facing RU labels for citation / Source Studio (P2-2). */
export const SOURCE_TYPE_LABELS_RU: Record<SourceType, string> = {
  book: "Книга / монография",
  guideline: "Клинические рекомендации (КР)",
  consensus: "Консенсус / position statement",
  article: "Статья / обзор",
  manual: "Методичка / внутренний протокол",
  protocol: "Клинический протокол",
  lecture: "Лекция / учебный материал",
  other: "Другой источник",
};

export const SOURCE_TYPE_LABELS_EN: Record<SourceType, string> = {
  book: "Book / monograph",
  guideline: "Clinical guideline",
  consensus: "Consensus / position statement",
  article: "Article / review",
  manual: "Manual / internal protocol",
  protocol: "Clinical protocol",
  lecture: "Lecture / education",
  other: "Other source",
};

export function sourceTypeLabel(
  sourceType: string,
  locale: "ru" | "en" = "ru",
): string {
  const parsed = SourceTypeSchema.safeParse(sourceType);
  if (!parsed.success) {
    return locale === "ru" ? "Источник" : "Source";
  }
  return locale === "en"
    ? SOURCE_TYPE_LABELS_EN[parsed.data]
    : SOURCE_TYPE_LABELS_RU[parsed.data];
}
