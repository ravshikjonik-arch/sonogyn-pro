import { formatLifecycleLabel } from "@/lib/cases/lifecycle-labels";
import { searchClassifications, type ClassificationHit } from "./search-classifications";
import { searchAiRoutes, type AiRouteHit } from "./search-ai-routes";
import { searchModules, type ModuleSearchHit } from "./search-modules";

export type CaseSearchHit = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  lifecycle?: string | null;
};

export type GlobalSearchResult = {
  tools: ModuleSearchHit[];
  ai: AiRouteHit[];
  cases: CaseSearchHit[];
  classifications: ClassificationHit[];
};

export async function fetchCaseSearchHits(query: string, limit = 6): Promise<CaseSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  return fetchCasesFromApi({ q, limit });
}

/** P0.5 — подтверждённые кейсы для default state Search. */
export async function fetchConfirmedCaseHits(limit = 4): Promise<CaseSearchHit[]> {
  return fetchCasesFromApi({ lifecycle: "confirmed", limit });
}

async function fetchCasesFromApi(opts: {
  q?: string;
  lifecycle?: string;
  limit: number;
}): Promise<CaseSearchHit[]> {
  const params = new URLSearchParams({ limit: String(opts.limit) });
  if (opts.q) params.set("q", opts.q);
  if (opts.lifecycle) params.set("lifecycle", opts.lifecycle);

  const res = await fetch(`/api/cases?${params.toString()}`, { credentials: "same-origin" });
  if (!res.ok) return [];

  const payload = (await res.json().catch(() => null)) as {
    cases?: Array<{
      id: string;
      title: string;
      description: string | null;
      lifecycle_status?: string | null;
    }>;
  } | null;

  return (payload?.cases ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.description?.slice(0, 120) ?? "Кейс для обсуждения",
    href: `/cases/${c.id}`,
    lifecycle: formatLifecycleLabel(c.lifecycle_status) ?? undefined,
  }));
}

export function searchGlobalLocal(query: string): Omit<GlobalSearchResult, "cases"> {
  return {
    tools: searchModules(query, 8),
    ai: searchAiRoutes(query, 6),
    classifications: searchClassifications(query, 6),
  };
}
