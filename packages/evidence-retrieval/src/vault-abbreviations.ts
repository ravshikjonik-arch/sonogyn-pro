/**
 * Clinical abbreviation expansion for medical vault search (AD-4).
 * Only unambiguous OB/GYN / US imaging terms — ambiguous codes are listed but not expanded.
 */

export type VaultAbbreviation = {
  /** Canonical short form (uppercase for Latin / as written for Cyrillic). */
  abbr: string;
  /** Full phrase used in guidelines and textbooks. */
  full: string;
  /** Extra aliases that map to the same concept (optional). */
  aliases?: string[];
};

/** Unambiguous expansions used in query rewriting. */
export const VAULT_ABBREVIATIONS: readonly VaultAbbreviation[] = [
  { abbr: "ЩЖ", full: "щитовидная железа", aliases: ["щитовидной железы", "щитовидной железе"] },
  { abbr: "МЖ", full: "молочная железа", aliases: ["молочной железы", "молочных желез"] },
  { abbr: "ЛУ", full: "лимфатический узел", aliases: ["лимфатических узлов", "лимфоузел", "лимфоузлы"] },
  { abbr: "ТАБ", full: "тонкоигольная аспирационная биопсия", aliases: ["FNA", "fine-needle aspiration"] },
  { abbr: "УЗИ", full: "ультразвуковое исследование", aliases: ["УЗД", "ультразвуковой диагностики"] },
  { abbr: "УЗД", full: "ультразвуковая диагностика", aliases: ["УЗИ"] },
  { abbr: "ЗРП", full: "задержка роста плода" },
  { abbr: "ГСД", full: "гестационный сахарный диабет" },
  { abbr: "ПОНРП", full: "преждевременная отслойка нормально расположенной плаценты" },
  { abbr: "ИЦН", full: "истмико-цервикальная недостаточность" },
  { abbr: "СПКЯ", full: "синдром поликистозных яичников", aliases: ["PCOS"] },
  { abbr: "НМГ", full: "низкомолекулярный гепарин" },
  { abbr: "КТГ", full: "кардиотокография" },
  { abbr: "ЭКО", full: "экстракорпоральное оплодотворение", aliases: ["IVF"] },
  { abbr: "ВРТ", full: "вспомогательные репродуктивные технологии", aliases: ["ART"] },
  { abbr: "ВЗОМТ", full: "воспалительные заболевания органов малого таза", aliases: ["PID"] },
  { abbr: "ИМТ", full: "индекс массы тела", aliases: ["BMI"] },
  { abbr: "ХГЧ", full: "хорионический гонадотропин человека", aliases: ["hCG", "β-ХГЧ", "бета-ХГЧ"] },
  { abbr: "АМГ", full: "антимюллеров гормон", aliases: ["AMH"] },
  { abbr: "ТТГ", full: "тиреотропный гормон", aliases: ["TSH"] },
  { abbr: "свТ4", full: "свободный тироксин", aliases: ["свободный Т4", "FT4"] },
  { abbr: "BI-RADS", full: "Breast Imaging Reporting and Data System" },
  { abbr: "O-RADS", full: "Ovarian-Adnexal Reporting and Data System" },
  { abbr: "TI-RADS", full: "Thyroid Imaging Reporting and Data System", aliases: ["TIRADS", "EU-TIRADS"] },
  { abbr: "LN-RADS", full: "Lymph Node Reporting and Data System" },
  { abbr: "IOTA", full: "International Ovarian Tumor Analysis" },
  { abbr: "FIGO", full: "International Federation of Gynecology and Obstetrics" },
] as const;

/**
 * Ambiguous abbreviations — documented so they are NOT auto-expanded.
 * Expanding these without context would mix unrelated medical senses.
 */
export const VAULT_AMBIGUOUS_ABBREVIATIONS = [
  { abbr: "ПЭ", senses: ["преэклампсия", "пневмоэмболия", "паренхиматозный эпителий"] },
  { abbr: "ЭМ", senses: ["эндометрий", "электронная микроскопия"] },
  { abbr: "КС", senses: ["кесарево сечение", "коэффициент сопротивления"] },
  { abbr: "ПС", senses: ["плацентарная недостаточность (контекст)", "пульс"] },
  { abbr: "РА", senses: ["ревматоидный артрит", "регионарная анестезия"] },
  { abbr: "АГ", senses: ["артериальная гипертензия", "акушерство и гинекология"] },
] as const;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Pair = { from: string; to: string };

function buildPairs(): Pair[] {
  const pairs: Pair[] = [];
  for (const entry of VAULT_ABBREVIATIONS) {
    const forms = [entry.abbr, entry.full, ...(entry.aliases ?? [])];
    for (const from of forms) {
      for (const to of forms) {
        if (from !== to) pairs.push({ from, to });
      }
    }
  }
  // Longer phrases first so «щитовидной железы» wins over «железы».
  return pairs.sort((a, b) => b.from.length - a.from.length);
}

const PAIRS = buildPairs();

function replaceInsensitive(text: string, from: string, to: string): string | null {
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(from)}(?![\\p{L}\\p{N}])`, "iu");
  if (!re.test(text)) return null;
  return text.replace(re, to);
}

/**
 * Query variants for FTS: original + one rewrite per matched abbreviation pair.
 * Cap keeps RPC fan-out bounded.
 */
export function expandVaultQueryVariants(query: string, maxVariants = 4): string[] {
  const q = query.trim().slice(0, 200);
  if (q.length < 2) return [];

  const out: string[] = [q];
  const seen = new Set([q.toLowerCase()]);

  for (const { from, to } of PAIRS) {
    if (out.length >= maxVariants) break;
    const next = replaceInsensitive(q, from, to);
    if (!next) continue;
    const key = next.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
  }
  return out;
}

/** Single rewritten string for embedding: expand abbreviations toward full forms only. */
export function expandVaultQueryForEmbedding(query: string): string {
  let q = query.trim().slice(0, 200);
  for (const entry of VAULT_ABBREVIATIONS) {
    const forms = [entry.abbr, ...(entry.aliases ?? []).filter((a) => a.length <= entry.full.length)];
    for (const from of forms.sort((a, b) => b.length - a.length)) {
      const next = replaceInsensitive(q, from, entry.full);
      if (next) q = next;
    }
  }
  return q;
}
