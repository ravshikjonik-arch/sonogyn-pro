/**
 * pubmed.ts — внешний доказательный поиск внутри ассистента (AI_PLATFORM_WIDE_V2 §4):
 * PubMed E-utilities + Europe PMC (оба бесплатны). Оффлайн — graceful fail,
 * ассистент откатывается к локальной шине знаний.
 */

export interface PubMedHit {
  pmid?: string;
  title: string;
  year?: string;
  journal?: string;
  authors?: string;
  url: string;
  source: "pubmed" | "europepmc";
}

export interface PubMedSearchOutcome {
  ok: boolean;
  hits?: PubMedHit[];
  reason?: string;
}

const ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const ESUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
const EUROPE_PMC = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

export function pubmedSearchUrl(query: string, retmax = 5): string {
  return `${ESEARCH}?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=${retmax}`;
}

export function pubmedSummaryUrl(pmids: string[]): string {
  return `${ESUMMARY}?db=pubmed&id=${pmids.join(",")}&retmode=json`;
}

export function europePmcUrl(query: string, pageSize = 5): string {
  return `${EUROPE_PMC}?query=${encodeURIComponent(query)}&format=json&pageSize=${pageSize}`;
}

/** esearch → список PMID. */
export function parseEsearch(json: unknown): string[] {
  const j = json as { esearchresult?: { idlist?: string[] } };
  return Array.isArray(j?.esearchresult?.idlist) ? j.esearchresult.idlist.map(String) : [];
}

/** esummary → PubMedHit[]. */
export function parseEsummary(json: unknown): PubMedHit[] {
  const j = json as { result?: Record<string, unknown> };
  const result = j?.result;
  if (!result || typeof result !== "object") return [];
  const hits: PubMedHit[] = [];
  for (const [uid, v] of Object.entries(result)) {
    if (uid === "uids" || !v || typeof v !== "object") continue;
    const r = v as Record<string, unknown>;
    const title = typeof r.title === "string" ? r.title : "";
    if (!title) continue;
    const pubdate = typeof r.pubdate === "string" ? r.pubdate : "";
    hits.push({
      pmid: uid,
      title: title.replace(/\.$/, ""),
      year: pubdate.match(/\d{4}/)?.[0],
      journal: typeof r.fulljournalname === "string" && r.fulljournalname ? r.fulljournalname : (typeof r.source === "string" ? r.source : undefined),
      authors: typeof r.lastauthor === "string" ? r.lastauthor : undefined,
      url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
      source: "pubmed",
    });
  }
  return hits;
}

/** Europe PMC → PubMedHit[]. */
export function parseEuropePmc(json: unknown): PubMedHit[] {
  const j = json as { resultList?: { result?: Array<Record<string, unknown>> } };
  const rows = j?.resultList?.result ?? [];
  return rows
    .filter((r) => typeof r.title === "string" && r.title)
    .map((r) => {
      const pmid = typeof r.pmid === "string" ? r.pmid : undefined;
      const doi = typeof r.doi === "string" ? r.doi : undefined;
      return {
        pmid,
        title: String(r.title).replace(/\.$/, ""),
        year: typeof r.pubYear === "string" ? r.pubYear : undefined,
        journal: typeof r.journalTitle === "string" ? r.journalTitle : undefined,
        authors: typeof r.authorString === "string" ? r.authorString : undefined,
        url: pmid
          ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
          : doi
            ? `https://doi.org/${doi}`
            : "https://europepmc.org",
        source: "europepmc" as const,
      };
    });
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Поиск: сначала NCBI (esearch+esummary), при любой ошибке — Europe PMC,
 * при ошибке — {ok:false}. Никогда не бросает исключение.
 */
export async function searchPubMed(query: string, opts: { timeoutMs?: number; topK?: number } = {}): Promise<PubMedSearchOutcome> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  try {
    const es = parseEsearch(await fetchJson(pubmedSearchUrl(query, opts.topK ?? 5), timeoutMs));
    if (es.length === 0) throw new Error("empty esearch");
    const hits = parseEsummary(await fetchJson(pubmedSummaryUrl(es), timeoutMs));
    if (hits.length === 0) throw new Error("empty esummary");
    return { ok: true, hits };
  } catch (ncbiError) {
    try {
      const hits = parseEuropePmc(await fetchJson(europePmcUrl(query, opts.topK ?? 5), timeoutMs));
      if (hits.length === 0) throw new Error("empty europepmc");
      return { ok: true, hits };
    } catch {
      return {
        ok: false,
        reason: `Внешний поиск недоступен (NCBI: ${ncbiError instanceof Error ? ncbiError.message : "ошибка"}). Используйте локальную базу знаний.`,
      };
    }
  }
}

/** PubMedHit → Citation-совместимая форма (структурно = KnowledgeCitation). */
export function hitToCitation(hit: PubMedHit): { organization: string; document: string; year: number; status: string; url: string } {
  const year = hit.year ? Number(hit.year.match(/\d{4}/)?.[0] ?? 0) : 0;
  return {
    organization: hit.source === "pubmed" ? "PubMed" : "Europe PMC",
    document: hit.journal ? `${hit.title} · ${hit.journal}` : hit.title,
    year: Number.isFinite(year) && year > 1900 ? year : new Date().getFullYear(),
    status: "публикация (внешний поиск)",
    url: hit.url,
  };
}
