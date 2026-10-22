import { formatLifecycleLabel } from "@/lib/cases/lifecycle-labels";
import { searchEducationModules, searchModules, type ModuleSearchHit } from "./search-modules";
import { searchClassifications, type ClassificationHit } from "./search-classifications";
import { searchAiRoutes, type AiRouteHit } from "./search-ai-routes";
import { searchGuidelinesLocal, type GuidelineLocalHit } from "./search-guidelines-local";
import { searchNosologyLocal, type NosologyLocalHit } from "./search-nosology-local";
import { searchQuizLocal, type QuizSearchHit } from "./search-quiz-local";
import { searchCalculatorSeo } from "./search-calculator-seo";

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
  guidelines: GuidelineLocalHit[];
  nosologies: NosologyLocalHit[];
  education: ModuleSearchHit[];
  quizzes: QuizSearchHit[];
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

function mergeModuleAndCalculatorTools(query: string, limit = 10) {
  const modules = searchModules(query, limit);
  const calculators = searchCalculatorSeo(query, limit);
  const byHref = new Map<string, (typeof modules)[number]>();

  for (const hit of modules) {
    byHref.set(hit.href, hit);
  }
  for (const calc of calculators) {
    const prev = byHref.get(calc.href);
    if (prev && prev.score >= calc.score) continue;
    byHref.set(calc.href, {
      id: prev?.id ?? ("calculator.hub" as (typeof modules)[number]["id"]),
      title: calc.title,
      description: calc.description,
      href: calc.href,
      domain: prev?.domain ?? "education",
      score: Math.max(prev?.score ?? 0, calc.score),
    });
  }

  return Array.from(byHref.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function searchGlobalLocal(query: string): Omit<GlobalSearchResult, "cases"> {
  return {
    tools: mergeModuleAndCalculatorTools(query, 10),
    ai: searchAiRoutes(query, 6),
    classifications: searchClassifications(query, 6),
    guidelines: searchGuidelinesLocal(query, 6),
    nosologies: searchNosologyLocal(query, 6),
    education: searchEducationModules(query, 5),
    quizzes: searchQuizLocal(query, 5),
  };
}
