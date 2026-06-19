import type { AdnexDataset, AdnexPageRecord } from "./types";

import pagesData from "../data/pages.json";

const dataset = pagesData as AdnexDataset;

export function getAdnexDataset(): AdnexDataset {
  return dataset;
}

export function listAdnexPages(filters?: { chapter?: string; topic?: string }): AdnexPageRecord[] {
  let items = dataset.pages;
  if (filters?.chapter) items = items.filter((p) => p.chapter === filters.chapter);
  if (filters?.topic) items = items.filter((p) => p.topics.includes(filters.topic!));
  return items;
}

export function getAdnexPage(id: string): AdnexPageRecord | undefined {
  return dataset.pages.find((p) => p.id === id);
}

export function searchAdnexPages(query: string): AdnexPageRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return dataset.pages;
  return dataset.pages.filter((p) => {
    const hay = [p.title, p.ocr_text, p.teaching_hint, ...p.topics, ...p.figure_refs]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function findAdnexPageByTopic(topic: string): AdnexPageRecord | undefined {
  return dataset.pages.find((p) => p.topics.includes(topic) && p.teaching_hint);
}
