import {
  REGISTRY,
  registryClassificationByKey,
  type RegistryClassification,
} from "@repo/evidence-retrieval";

const ALIASES: Array<{ re: RegExp; key: string }> = [
  { re: /\bo-?rads\b|орадс|iadnex/i, key: "o-rads-us" },
  { re: /\bbi-?rads\b|бир|бирэдс/i, key: "bi-rads-us" },
  { re: /\bti-?rads\b|тирадс|щитовид/i, key: "ti-rads" },
  { re: /\biota\b|айота/i, key: "iota-adnex" },
  { re: /\bfigo\b|миом/i, key: "figo-leiomyoma" },
  { re: /\bfmf\b|твп|\bnt\b|скрининг/i, key: "fmf-screening" },
  { re: /\bisuog\b/i, key: "isuog-ob" },
];

function scoreClassification(cl: RegistryClassification, lower: string): number {
  let s = 0;
  if (lower.includes(cl.key.replace(/-/g, " "))) s += 3;
  if (lower.includes(cl.name.toLowerCase())) s += 2;
  for (const w of cl.name.toLowerCase().split(/[\s,.-]+/)) {
    if (w.length > 4 && lower.includes(w)) s += 1;
  }
  if (cl.domain && lower.includes(cl.domain.toLowerCase())) s += 1;
  return s;
}

/** Подсказки по реестру международных стандартов для запроса врача. */
export function registryHintsForQuery(query: string, limit = 3): string[] {
  const lower = query.toLowerCase();
  const keys = new Set<string>();
  for (const { re, key } of ALIASES) {
    if (re.test(lower)) keys.add(key);
  }
  const ranked = REGISTRY.classifications
    .map((cl) => ({ cl, score: scoreClassification(cl, lower) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const k of keys) {
    const cl = registryClassificationByKey(k);
    if (cl) ranked.unshift({ cl, score: 99 });
  }

  const seen = new Set<string>();
  const lines: string[] = [];
  for (const { cl } of ranked) {
    if (seen.has(cl.key)) continue;
    seen.add(cl.key);
    const href = cl.primary_href ? ` → ${cl.primary_href}` : "";
    lines.push(`• ${cl.name} (${cl.org}, ${cl.status})${href}`);
    if (lines.length >= limit) break;
  }
  return lines;
}