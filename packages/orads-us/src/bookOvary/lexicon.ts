import { ORADS_BOOK_LEXICON } from "./data";
import type { OradsBookLexiconGroup, OradsBookLexiconItem } from "./types";

export function listOradsBookLexiconGroups(): OradsBookLexiconGroup[] {
  return ORADS_BOOK_LEXICON.terms;
}

export function getOradsBookColorScoreScale(): Record<string, string> {
  return ORADS_BOOK_LEXICON.color_score_scale;
}

export function listOradsBookLexiconTerms(): Array<OradsBookLexiconItem & { group: string }> {
  const out: Array<OradsBookLexiconItem & { group: string }> = [];
  for (const g of ORADS_BOOK_LEXICON.terms) {
    for (const item of g.items) {
      out.push({ ...item, group: g.group });
    }
  }
  return out;
}

export function searchOradsBookLexicon(query: string): Array<OradsBookLexiconItem & { group: string }> {
  const q = query.trim().toLowerCase();
  if (!q) return listOradsBookLexiconTerms();
  return listOradsBookLexiconTerms().filter((t) => {
    const blob = `${t.term} ${t.definition} ${t.comment ?? ""} ${t.group}`.toLowerCase();
    return blob.includes(q);
  });
}
