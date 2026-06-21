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
