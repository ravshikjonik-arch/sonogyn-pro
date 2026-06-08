export * from "./types";
export * from "./topics";
export * from "./fieldMap";

import { PROTOCOL_FIELD_TO_TOPIC } from "./fieldMap";
import { CLINICAL_REFERENCE } from "./topics";
import type { ClinicalReferenceIndex, ClinicalTopic, FieldHelpSnippet, ReferenceSearchHit } from "./types";

export function getClinicalReference(): ClinicalReferenceIndex {
  return CLINICAL_REFERENCE;
}

export function getTopic(index: ClinicalReferenceIndex, topicId: string): ClinicalTopic | undefined {
  return index.topics.find((t) => t.id === topicId);
}

export function getTopicsBySection(index: ClinicalReferenceIndex): Map<string, ClinicalTopic[]> {
  const map = new Map<string, ClinicalTopic[]>();
  for (const t of index.topics) {
    const list = map.get(t.section) ?? [];
    list.push(t);
    map.set(t.section, list);
  }
  return map;
}

export function searchReference(index: ClinicalReferenceIndex, query: string, limit = 30): ReferenceSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const hits: ReferenceSearchHit[] = [];

  for (const t of index.topics) {
    const hay = `${t.title} ${t.summary} ${t.methodology} ${t.tags.join(" ")}`.toLowerCase();
    if (!terms.every((term) => hay.includes(term))) continue;
    const pos = hay.indexOf(terms[0]);
    const start = Math.max(0, pos - 40);
    const snippet =
      (pos >= 0 ? "…" : "") + t.summary.slice(start, start + 160) + (t.summary.length > start + 160 ? "…" : "");
    hits.push({ topicId: t.id, title: t.title, section: t.section, snippet: snippet || t.title, score: terms.length });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function getFieldHelp(fieldName: string): FieldHelpSnippet | null {
  const topicId = PROTOCOL_FIELD_TO_TOPIC[fieldName];
  if (!topicId) return null;
  const t = getTopic(CLINICAL_REFERENCE, topicId);
  if (!t) return null;
  return { topicId: t.id, title: t.title, content: `${t.summary}\n\n${t.methodology}` };
}

export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}
