import type { TextFragment } from "./types";

/** Lowercase, ё→е, collapse whitespace, unify quotes/dashes — for matching only. */
export function normalizeForMatch(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»„“”"]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Locates `fragment` in `text` (whitespace/case-insensitive). Returns offsets in the
 * original text, or null when the model quoted something that is not in the input.
 */
export function locateFragment(text: string, fragment: string): TextFragment | null {
  const needle = normalizeForMatch(fragment);
  if (!needle) return null;

  const map: number[] = [];
  let norm = "";
  let prevSpace = true;
  const src = text.normalize("NFC");
  for (let i = 0; i < src.length; i++) {
    let ch = src[i]!.toLowerCase();
    if (ch === "ё") ch = "е";
    if ("«»„“”\"".includes(ch)) ch = '"';
    if (ch === "–" || ch === "—") ch = "-";
    if (/\s/.test(ch)) {
      if (prevSpace) continue;
      ch = " ";
      prevSpace = true;
    } else {
      prevSpace = false;
    }
    norm += ch;
    map.push(i);
  }

  const at = norm.indexOf(needle);
  if (at < 0) return null;
  const start = map[at]!;
  const end = map[at + needle.length - 1]! + 1;
  return { text: src.slice(start, end), start, end };
}

const WORD = "[^а-яёa-z0-9]";

/**
 * "The feature was not evaluated" — must never be read as a negative finding.
 * («не оценивался», «оценить невозможно», «не исследовался», «оценка затруднена», …)
 */
const NOT_ASSESSED = new RegExp(
  [
    "не\\s+оцени[а-яё]*",
    "не\\s+оценен[а-яё]*",
    "не\\s+удал[а-яё]*\\s+оценить",
    "оценить\\s+не\\s+удал[а-яё]*",
    "(?:оценить|оценка|оценки|визуализаци[яи])\\s+(?:невозможн[а-яё]*|затруднен[а-яё]*|затруднительн[а-яё]*)",
    "(?:невозможно|затруднительно)\\s+оценить",
    "не\\s+исследова[а-яё]*",
    "не\\s+(?:проводил|выполнял)[а-яё]*",
    "not\\s+(?:assessed|evaluated|examined)",
    "could\\s+not\\s+be\\s+(?:assessed|evaluated)",
    "(?:assessment|evaluation)\\s+(?:not\\s+possible|limited|difficult)",
  ].join("|"),
  "gi",
);

const NEGATION = new RegExp(
  `(^|${WORD})(не|нет|без|отсутств[а-яё]*|no|not|without|absent|negative)(${WORD}|$)`,
  "i",
);

const SUSPECTED = new RegExp(
  `(^|${WORD})(подозрени[а-яё]*|подозрительн[а-яё]*|подозревается|suspicious|suspected)(${WORD}|$)`,
  "i",
);

const UNCERTAIN = new RegExp(
  [
    `(^|${WORD})(возможно|вероятно|предположительно|сомнительн[а-яё]*|possibly|probabl[a-z]*|questionabl[a-z]*)(${WORD}|$)`,
    "не\\s+исключ",
    "нельзя\\s+исключить",
    "под\\s+вопросом",
    "cannot\\s+be\\s+excluded",
    "\\?",
  ].join("|"),
  "i",
);

export function hasNotAssessedCue(fragment: string): boolean {
  NOT_ASSESSED.lastIndex = 0;
  return NOT_ASSESSED.test(normalizeForMatch(fragment));
}

/** Negation words outside not-assessed phrases and outside «не исключ…» hedges. */
export function hasNegationCue(fragment: string): boolean {
  const t = normalizeForMatch(fragment)
    .replace(NOT_ASSESSED, " ")
    .replace(/не\s+исключ[а-яё]*/g, " ")
    .replace(/нельзя\s+исключить/g, " ");
  return NEGATION.test(t);
}

/** Statement certainty cue: `suspected` wins over `uncertain` when both are present. */
export function hedgeCue(fragment: string): "suspected" | "uncertain" | null {
  const t = normalizeForMatch(fragment);
  if (SUSPECTED.test(t)) return "suspected";
  if (UNCERTAIN.test(t)) return "uncertain";
  return null;
}

/** @deprecated use `hedgeCue` — kept for Phase B callers. */
export function hasHedgeCue(fragment: string): boolean {
  return hedgeCue(fragment) !== null;
}

export type LateralityCue = "left" | "right" | "bilateral";

const ADJ_ENDINGS = "(?:ый|ого|ому|ом|ая|ой|ую|ое|ые|ых|ым|ыми)?";
const LEFT = new RegExp(`(^|[^а-яё])(?:лев${ADJ_ENDINGS}|слева|левосторонн[а-яё]*)(?=[^а-яё]|$)`);
const RIGHT = new RegExp(`(^|[^а-яё])(?:прав${ADJ_ENDINGS}|справа|правосторонн[а-яё]*)(?=[^а-яё]|$)`);

/** Side words only — «правильной формы» is not "right". */
export function lateralityCues(fragment: string): Set<LateralityCue> {
  const t = normalizeForMatch(fragment);
  const out = new Set<LateralityCue>();
  if (/(обоих|обеих|двусторонн|билатерал|bilateral|both)/.test(t)) out.add("bilateral");
  if (LEFT.test(t) || /\bleft\b/.test(t)) out.add("left");
  if (RIGHT.test(t) || /\bright\b/.test(t)) out.add("right");
  return out;
}

/** Lexical concept cues: a feature may be mapped only if its own concept is named in the fragment. */
export const CONCEPT_CUES: Readonly<Record<string, { pattern: RegExp; concept: string }>> = {
  "adnexa.solid_component": { pattern: /солидн|\bsolid\b/i, concept: "solid component («солидный»)" },
  "adnexa.largest_solid_component_diameter": { pattern: /солидн|\bsolid\b/i, concept: "solid component («солидный»)" },
  "adnexa.papillary_projection_count": { pattern: /папилляр|papillar/i, concept: "papillary projection («папиллярный»)" },
  "adnexa.papillary_projection_surface": { pattern: /папилляр|papillar/i, concept: "papillary projection («папиллярный»)" },
};

/** FNV-1a 32-bit — non-cryptographic fingerprint (RN-safe, no crypto dependency). */
export function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
