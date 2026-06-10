import type { AtlasDataset, AtlasPageRecord, AtlasPartId } from "./types";

import pagesData from "../data/pages.json";

const dataset = pagesData as AtlasDataset;

export function getAtlasDataset(): AtlasDataset {
  return dataset;
}

export function listAtlasPages(filters?: {
  part?: AtlasPartId | string;
  topic?: string;
  gaWeeks?: number;
}): AtlasPageRecord[] {
  let items = dataset.pages;
  if (filters?.part) {
    items = items.filter((p) => p.part === filters.part);
  }
  if (filters?.topic) {
    items = items.filter((p) => p.topics.includes(filters.topic!));
  }
  if (filters?.gaWeeks != null) {
    const w = filters.gaWeeks;
    items = items.filter((p) => {
      if (p.ga_weeks_min == null && p.ga_weeks_max == null) return true;
      const min = p.ga_weeks_min ?? 0;
      const max = p.ga_weeks_max ?? 42;
      return w >= min && w <= max;
    });
  }
  return items;
}

export function getAtlasPage(id: string): AtlasPageRecord | undefined {
  return dataset.pages.find((p) => p.id === id);
}

export function searchAtlasPages(query: string): AtlasPageRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return dataset.pages;
  return dataset.pages.filter((p) => {
    const hay = [
      p.title,
      p.section,
      p.ocr_text,
      p.teaching_hint,
      ...p.topics,
      String(p.book_page_label ?? ""),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
