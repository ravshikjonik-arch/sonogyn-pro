import type { OrganType } from "./types";

const ORGAN_PATTERNS: Record<OrganType, RegExp[]> = {
  ovary: [
    /яичник|яичников|придат|аднекс|adnex|ovary|ovarian|o-?rads|orads/i,
    /кист|цистаден|эндометриом|дермоид|тератом|фолликул|желт[а-я\s-]*тел/i,
    /геморраг|hemorrhag|параовари/i,
  ],
  breast: [/молоч|breast|bi-?rads|birads|\bмж\b|фиброаден|сосок|проток/i],
  uterus: [/матк|uterus|миом|figo|эндометр|аденомиоз|полип|субмукоз|интрамурал|субсероз/i],
  lymph: [/лимф|ln-?rads|лимфоуз|node/i],
};

/** Эвристика органа по тексту описания (без PHI). */
export function inferOrganFromText(text: string): OrganType | null {
  const source = text.trim();
  if (!source) return null;

  const scores = (Object.keys(ORGAN_PATTERNS) as OrganType[]).map((organ) => ({
    organ,
    score: ORGAN_PATTERNS[organ].reduce((sum, pattern) => sum + (pattern.test(source) ? 1 : 0), 0),
  }));
  const sorted = scores.sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const second = sorted[1];

  if (!best || best.score === 0) return null;
  if (second && second.score === best.score) return null;
  return best.organ;
}

export function isHemorrhagicCystText(text: string): boolean {
  return /геморраг|hemorrhag/i.test(text) && /кист|cyst/i.test(text);
}
