/** Серверный клиент NCBI E-utilities (PubMed). Кэш в памяти на время процесса. */

export type PubmedArticleMeta = {
  pmid: string;
  title: string;
  journal?: string;
  year?: number;
  authors?: string;
};

type CacheEntry = { at: number; data: PubmedArticleMeta };

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function ncbiBase(): string {
  return process.env.NCBI_EUTILS_BASE?.trim() || "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
}

function ncbiApiKey(): string | undefined {
  return process.env.NCBI_API_KEY?.trim() || undefined;
}

function parseYear(pubdate?: string): number | undefined {
  if (!pubdate) return undefined;
  const m = pubdate.match(/\b(19|20)\d{2}\b/);
  return m ? Number.parseInt(m[0], 10) : undefined;
}

export async function fetchPubmedArticles(pmids: string[]): Promise<PubmedArticleMeta[]> {
  const ids = [...new Set(pmids.map((p) => p.replace(/\D/g, "")).filter(Boolean))];
  if (ids.length === 0) return [];

  const now = Date.now();
  const missing: string[] = [];
  const hit: PubmedArticleMeta[] = [];

  for (const id of ids) {
    const cached = cache.get(id);
    if (cached && now - cached.at < CACHE_TTL_MS) {
      hit.push(cached.data);
    } else {
      missing.push(id);
    }
  }

  if (missing.length === 0) return hit;

  const params = new URLSearchParams({
    db: "pubmed",
    id: missing.join(","),
    retmode: "json",
  });
  const key = ncbiApiKey();
  if (key) params.set("api_key", key);

  const url = `${ncbiBase()}/esummary.fcgi?${params.toString()}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SonoGynPro/1.0 (clinical evidence; contact: support@sonogyn.pro)" },
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!res.ok) {
    throw new Error(`NCBI esummary HTTP ${res.status}`);
  }

  const json = (await res.json()) as {
    result?: {
      uids?: string[];
      [pmid: string]: unknown;
    };
  };

  const fetched: PubmedArticleMeta[] = [];
  for (const pmid of missing) {
    const row = json.result?.[pmid] as
      | {
          uid?: string;
          title?: string;
          fulljournalname?: string;
          source?: string;
          pubdate?: string;
          authors?: { name: string }[];
        }
      | undefined;

    if (!row?.title) continue;

    const meta: PubmedArticleMeta = {
      pmid,
      title: row.title.replace(/\.$/, ""),
      journal: row.fulljournalname || row.source,
      year: parseYear(row.pubdate),
      authors: row.authors?.slice(0, 3).map((a) => a.name).join(", "),
    };
    cache.set(pmid, { at: now, data: meta });
    fetched.push(meta);
  }

  return [...hit, ...fetched];
}
