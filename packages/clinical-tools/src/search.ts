import { CLINICAL_TOOLS } from "./catalog";
import type { ClinicalToolSearchResult, DoctorRole } from "./types";

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenScore(haystack: string, query: string): number {
  if (!query) return 0;
  if (haystack === query) return 100;
  if (haystack.startsWith(query)) return 80;
  if (haystack.includes(query)) return 50;
  const parts = query.split(" ").filter(Boolean);
  if (parts.length > 1 && parts.every((p) => haystack.includes(p))) return 45;
  return 0;
}

export type SearchClinicalToolsOptions = {
  role?: DoctorRole;
  limit?: number;
  category?: string;
};

export function searchClinicalTools(
  rawQuery: string,
  options: SearchClinicalToolsOptions = {},
): ClinicalToolSearchResult[] {
  const query = norm(rawQuery);
  const limit = options.limit ?? 12;
  const role = options.role;

  const scored = CLINICAL_TOOLS.map((tool) => {
    if (options.category && tool.category !== options.category) return null;

    const fields = [
      tool.title,
      tool.subtitle,
      ...tool.synonyms,
      ...tool.keywords,
    ].map(norm);

    const blob = fields.join(" ");
    let score = 0;
    for (const f of fields) {
      score = Math.max(score, tokenScore(f, query));
    }
    if (!score && query) {
      const parts = query.split(" ").filter(Boolean);
      if (parts.length > 1 && parts.every((p) => blob.includes(p))) score = 42;
    }
    if (!query) {
      score = role && tool.roles.includes(role) ? 10 : 1;
    }
    if (role && tool.roles.includes(role)) score += 5;

    return score > 0 ? { ...tool, score } : null;
  }).filter((x): x is ClinicalToolSearchResult => x !== null);

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function toolsForRole(role: DoctorRole, pinnedIds?: string[]) {
  const pins = pinnedIds?.length ? pinnedIds : [];
  const pinned = pins
    .map((id) => CLINICAL_TOOLS.find((t) => t.id === id))
    .filter((x): x is (typeof CLINICAL_TOOLS)[number] => !!x);
  const pinnedSet = new Set(pinned.map((t) => t.id));
  const rest = CLINICAL_TOOLS.filter((t) => t.roles.includes(role) && !pinnedSet.has(t.id));
  return { pinned, rest };
}
