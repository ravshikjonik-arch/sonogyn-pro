import type { Nosology, NosologyLiteratureItem } from "./types";

export const PUBMED_HOME_URL = "https://pubmed.ncbi.nlm.nih.gov/";

export type PubmedSearchOptions = {
  /** Годы публикации, напр. "2015:2026" */
  years?: string;
  /** review, guideline, clinicaltrial… */
  publicationTypes?: string[];
};

/** Карточка статьи в PubMed. */
export function pubmedArticleUrl(pmid: string | number): string {
  const id = String(pmid).replace(/\D/g, "");
  return `${PUBMED_HOME_URL}${id}/`;
}

/** Поиск в PubMed с фильтрами (открывается в новой вкладке). */
export function pubmedSearchUrl(query: string, options: PubmedSearchOptions = {}): string {
  const params = new URLSearchParams();
  params.set("term", query.trim());
  if (options.years) {
    params.append("filter", `years.${options.years}`);
  }
  for (const pubt of options.publicationTypes ?? ["review", "guideline"]) {
    params.append("filter", `pubt.${pubt}`);
  }
  return `${PUBMED_HOME_URL}?${params.toString()}`;
}

const ZONE_PUBMED_HINTS: Partial<Record<Nosology["zone"], string>> = {
  uterus: "uterine ultrasound",
  endometrium: "endometrium ultrasound",
  ovaries: "ovarian ultrasound adnexal",
  tubes: "fallopian tube ultrasound",
  cervix: "cervical ultrasound",
  obstetrics: "obstetric ultrasound",
  other: "gynecologic ultrasound",
};

/** Готовый запрос для PubMed по нозологии (если pubmedQuery не задан вручную). */
export function buildPubmedQueryFromNosology(nosology: Pick<Nosology, "title" | "keywords" | "zone" | "pubmedQuery">): string {
  if (nosology.pubmedQuery?.trim()) {
    return nosology.pubmedQuery.trim();
  }
  const zoneHint = ZONE_PUBMED_HINTS[nosology.zone] ?? "ultrasound";
  const keywordSlice = nosology.keywords.slice(0, 2).join(" ");
  return `${nosology.title} ${keywordSlice} ${zoneHint}`.replace(/\s+/g, " ").trim();
}

export function pubmedSearchUrlForNosology(nosology: Nosology): string {
  return pubmedSearchUrl(buildPubmedQueryFromNosology(nosology), {
    years: "2010:2026",
    publicationTypes: ["review", "guideline", "systematicreview"],
  });
}

/** Объединяет литературу из записи нозологии и курируемый сид. */
export function resolveNosologyLiterature(
  nosology: Pick<Nosology, "id" | "literature">,
  curated: Record<string, NosologyLiteratureItem[]>,
): NosologyLiteratureItem[] {
  const fromSeed = curated[nosology.id] ?? [];
  const fromRecord = nosology.literature ?? [];
  const seen = new Set<string>();
  const out: NosologyLiteratureItem[] = [];

  for (const item of [...fromRecord, ...fromSeed]) {
    const pmid = String(item.pmid).replace(/\D/g, "");
    if (!pmid || seen.has(pmid)) continue;
    seen.add(pmid);
    out.push({ ...item, pmid });
  }
  return out;
}
