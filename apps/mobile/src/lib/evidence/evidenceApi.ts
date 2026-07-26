import { getWebApiBase } from "../../api/chatBackend";
import { supabaseMobile } from "../supabase/mobileClient";

export type MobileEvidenceRecord = {
  id: string;
  provider: string;
  title: string;
  url: string;
  year?: number;
  abstract?: string;
  evidenceLevel?: string;
};

export type MobileAssistantAnswer = {
  query: string;
  summary: string;
  evidenceStrength: "high" | "moderate" | "low" | "insufficient";
  gradeLabel: string;
  recommendations: string[];
  contraindications: string[];
  citations: MobileEvidenceRecord[];
  guidelines: { title: string; url: string; org: string }[];
  disclaimers: string[];
  synthesisMode: "llm" | "rules";
};

export type MobileSearchResult = {
  query: string;
  records: MobileEvidenceRecord[];
  totalBeforeDedup: number;
};

export type MobileEvidenceBookmark = {
  id: string;
  record_id: string;
  provider: string;
  title: string;
  url: string;
  created_at?: string;
};

export type MobileEvidenceHistoryRow = {
  id: string;
  query: string;
  sources: string[];
  result_count: number;
  synthesis_mode: string;
  evidence_strength: string | null;
  created_at: string;
};

const PROVIDER_LABEL: Record<string, string> = {
  pubmed: "PubMed",
  europe_pmc: "Europe PMC",
  cochrane: "Cochrane",
  semantic_scholar: "Semantic Scholar",
  clinical_trials: "ClinicalTrials.gov",
  kr_mz_rf: "КР МЗ РФ",
  static_corpus: "SonoEvidence",
  openfda: "OpenFDA",
  dailymed: "DailyMed",
  who: "WHO",
  nice: "NICE",
  ema: "EMA",
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABEL[provider] ?? provider;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-sonogyn-client": "mobile",
  };
  if (supabaseMobile) {
    const { data } = await supabaseMobile.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function apiBase(): string {
  const base = getWebApiBase();
  if (!base) throw new Error("API не настроен (EXPO_PUBLIC_API_BASE_URL).");
  return base;
}

export async function askEvidenceAssistant(query: string): Promise<MobileAssistantAnswer> {
  const res = await fetch(`${apiBase()}/api/evidence/assistant/ask`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ query, useLlm: true }),
  });
  const data = (await res.json().catch(() => null)) as MobileAssistantAnswer & { error?: string };
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data;
}

export async function searchEvidence(query: string): Promise<MobileSearchResult> {
  const params = new URLSearchParams({ q: query, limit: "20" });
  const res = await fetch(`${apiBase()}/api/evidence/search?${params.toString()}`, {
    headers: await authHeaders(),
  });
  const data = (await res.json().catch(() => null)) as MobileSearchResult & { error?: string };
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data;
}

export async function listEvidenceBookmarks(): Promise<MobileEvidenceBookmark[]> {
  const res = await fetch(`${apiBase()}/api/evidence/bookmarks`, {
    headers: await authHeaders(),
  });
  const data = (await res.json().catch(() => null)) as {
    bookmarks?: MobileEvidenceBookmark[];
    error?: string;
  };
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data.bookmarks ?? [];
}

export async function addEvidenceBookmark(record: MobileEvidenceRecord): Promise<MobileEvidenceBookmark> {
  const res = await fetch(`${apiBase()}/api/evidence/bookmarks`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      recordId: record.id,
      provider: record.provider,
      title: record.title,
      url: record.url,
      payload: { year: record.year, abstract: record.abstract, evidenceLevel: record.evidenceLevel },
    }),
  });
  const data = (await res.json().catch(() => null)) as {
    bookmark?: MobileEvidenceBookmark;
    error?: string;
  };
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  if (!data.bookmark) throw new Error("Bookmark not returned");
  return data.bookmark;
}

export async function removeEvidenceBookmark(recordId: string): Promise<void> {
  const params = new URLSearchParams({ recordId });
  const res = await fetch(`${apiBase()}/api/evidence/bookmarks?${params.toString()}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  const data = (await res.json().catch(() => null)) as { error?: string };
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
}

export async function listEvidenceHistory(limit = 15): Promise<{
  history: MobileEvidenceHistoryRow[];
  rateLimitHint: string | null;
}> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`${apiBase()}/api/evidence/history?${params.toString()}`, {
    headers: await authHeaders(),
  });
  const data = (await res.json().catch(() => null)) as {
    history?: MobileEvidenceHistoryRow[];
    rateLimitHint?: { assistantLimit: number; assistantWindowSec: number };
    error?: string;
  };
  if (res.status === 401) return { history: [], rateLimitHint: null };
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  const hint = data.rateLimitHint
    ? `Лимит: до ${data.rateLimitHint.assistantLimit} / ${data.rateLimitHint.assistantWindowSec} с`
    : null;
  return { history: data.history ?? [], rateLimitHint: hint };
}
