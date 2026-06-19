import type { EvidenceEntry, EvidenceShelf } from "@repo/evidence-corpus";

export type EvidenceSearchHit = {
  entry: EvidenceEntry;
  score: number;
  matchedFields: string[];
};

export type EvidenceAskOptions = {
  shelf?: EvidenceShelf;
  limit?: number;
};

export type EvidenceCitation = {
  entryId: string;
  title: string;
  tier: EvidenceEntry["tier"];
  sourceLabel: string;
  organization?: string;
  year?: number;
  url?: string;
  pmid?: string;
  excerpt: string;
  summary: string;
  clinicalPearl: string;
  relatedLinks?: EvidenceEntry["relatedLinks"];
};

export type EvidenceAskResult = {
  query: string;
  shelf: EvidenceShelf | null;
  answerSummary: string;
  citations: EvidenceCitation[];
  disclaimer: string;
  corpusVersion: string;
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/ё/g, "е").trim();
}

function tokenize(query: string): string[] {
  return normalizeText(query)
    .split(/[\s,.;:!?/\\|()[\]{}"«»–—-]+/)
    .filter((t) => t.length >= 2);
}

function fieldScore(haystack: string, token: string): boolean {
  return normalizeText(haystack).includes(token);
}

function scoreEntry(entry: EvidenceEntry, tokens: string[]): { score: number; matchedFields: string[] } {
  if (tokens.length === 0) return { score: 0, matchedFields: [] };

  let score = 0;
  const matchedFields: string[] = [];

  for (const token of tokens) {
    if (fieldScore(entry.title, token)) {
      score += 8;
      matchedFields.push("title");
    }
    if (entry.tags.some((tag: string) => fieldScore(tag, token))) {
      score += 6;
      matchedFields.push("tags");
    }
    if (fieldScore(entry.summary, token)) {
      score += 4;
      matchedFields.push("summary");
    }
    if (fieldScore(entry.clinicalPearl, token)) {
      score += 3;
      matchedFields.push("clinicalPearl");
    }
    if (fieldScore(entry.excerpt, token)) {
      score += 2;
      matchedFields.push("excerpt");
    }
  }

  // Tier 1 (guidelines) slightly preferred when scores tie.
  score += (4 - entry.tier) * 0.5;

  return { score, matchedFields: [...new Set(matchedFields)] };
}

export function searchEvidence(
  entries: EvidenceEntry[],
  query: string,
  options: EvidenceAskOptions = {},
): EvidenceSearchHit[] {
  const limit = Math.min(Math.max(options.limit ?? 8, 1), 20);
  const tokens = tokenize(query);
  const pool = options.shelf ? entries.filter((e) => e.shelf === options.shelf) : entries;

  if (tokens.length === 0) {
    return pool.slice(0, limit).map((entry) => ({ entry, score: 0, matchedFields: [] }));
  }

  return pool
    .map((entry) => {
      const { score, matchedFields } = scoreEntry(entry, tokens);
      return { entry, score, matchedFields };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function toCitation(entry: EvidenceEntry): EvidenceCitation {
  return {
    entryId: entry.id,
    title: entry.title,
    tier: entry.tier,
    sourceLabel: entry.source.label,
    organization: entry.source.organization,
    year: entry.source.year,
    url: entry.source.url,
    pmid: entry.source.pmid,
    excerpt: entry.excerpt,
    summary: entry.summary,
    clinicalPearl: entry.clinicalPearl,
    relatedLinks: entry.relatedLinks,
  };
}

function buildAnswerSummary(query: string, hits: EvidenceSearchHit[], shelf?: EvidenceShelf): string {
  if (hits.length === 0) {
    const scope =
      shelf === "us-fmf"
        ? "УЗИ/FMF"
        : shelf === "obgyn"
          ? "акушерства и гинекологии"
          : shelf === "cervix"
            ? "шейки матки (скрининг, ВПЧ, CL)"
            : shelf === "mammo"
              ? "маммологии (BI-RADS US)"
              : shelf === "onco"
                ? "онкогинекологии (O-RADS, IOTA)"
                : shelf === "endocrine"
                  ? "эндокринологии (СПКЯ, AMH, щитовидная)"
                  : shelf === "surgery"
                    ? "тазовой хирургии (pre-op, lap, hysteroscopy)"
                    : "SonoEvidence";
    const hints =
      shelf === "us-fmf"
        ? "NT, PAPP-A, КТР, допплер"
        : shelf === "obgyn"
          ? "эндометриоз, FIGO, СПКЯ, преэклампsia, O-RADS"
          : shelf === "cervix"
            ? "ВПЧ, ASC-US, CIN, CL, кольпоскопия"
            : shelf === "mammo"
              ? "BI-RADS, fibroadenoma, киста, elastography"
              : shelf === "onco"
                ? "O-RADS, IOTA, papillary, ascites, эндометрий"
                : shelf === "endocrine"
                  ? "СПКЯ, AMH, TSH, TI-RADS, letrozole"
                  : shelf === "surgery"
                    ? "laparoscopy, hysteroscopy, myomectomy, cerclage"
                    : "NT, BI-RADS, O-RADS, СПКЯ, laparoscopy";
    return `По запросу «${query}» в базе ${scope} совпадений нет. Попробуйте синоним: ${hints}.`;
  }

  const top = hits[0].entry;
  const extra = hits.length > 1 ? ` Дополнительно найдено источников: ${hits.length - 1}.` : "";
  return `${top.summary}${extra}`;
}

export function askEvidence(
  entries: EvidenceEntry[],
  query: string,
  options: EvidenceAskOptions & { disclaimer: string; corpusVersion: string },
): EvidenceAskResult {
  const trimmed = query.trim();
  const hits = searchEvidence(entries, trimmed, options);

  return {
    query: trimmed,
    shelf: options.shelf ?? null,
    answerSummary: buildAnswerSummary(trimmed, hits, options.shelf),
    citations: hits.map((h) => toCitation(h.entry)),
    disclaimer: options.disclaimer,
    corpusVersion: options.corpusVersion,
  };
}
