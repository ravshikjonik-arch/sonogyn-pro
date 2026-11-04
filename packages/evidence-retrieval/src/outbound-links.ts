/**
 * Outbound deep-links to paid/partner databases by DOI or title.
 * We do not scrape or store their full texts (copyright).
 */

export type OutboundSourceId =
  | "cochrane"
  | "trip"
  | "elibrary"
  | "scopus"
  | "web_of_science"
  | "pubmed"
  | "europe_pmc"
  | "openalex"
  | "doi_resolver";

export type OutboundSourceLink = {
  id: OutboundSourceId;
  label: string;
  url: string;
  note?: string;
};

function enc(value: string): string {
  return encodeURIComponent(value.trim());
}

export function buildOutboundSourceLinks(input: {
  doi?: string | null;
  title?: string | null;
  pmid?: string | null;
}): OutboundSourceLink[] {
  const doi = input.doi?.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") || "";
  const title = input.title?.trim() || "";
  const pmid = input.pmid?.trim() || "";
  const q = doi || title;
  if (!q && !pmid) return [];

  const links: OutboundSourceLink[] = [];

  if (doi) {
    links.push({
      id: "doi_resolver",
      label: "DOI.org",
      url: `https://doi.org/${doi}`,
      note: "Оригинал по DOI",
    });
  }

  if (pmid) {
    links.push({
      id: "pubmed",
      label: "PubMed",
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    });
  } else if (q) {
    links.push({
      id: "pubmed",
      label: "PubMed",
      url: `https://pubmed.ncbi.nlm.nih.gov/?term=${enc(q)}`,
    });
  }

  if (q) {
    links.push({
      id: "europe_pmc",
      label: "Europe PMC",
      url: `https://europepmc.org/search?query=${enc(q)}`,
    });
    links.push({
      id: "openalex",
      label: "OpenAlex",
      url: doi
        ? `https://openalex.org/works?filter=doi:${enc(doi)}`
        : `https://openalex.org/works?search=${enc(title)}`,
    });
    links.push({
      id: "cochrane",
      label: "Cochrane Library",
      url: `https://www.cochranelibrary.com/search?q=${enc(q)}`,
      note: "Полный текст — по подписке",
    });
    links.push({
      id: "trip",
      label: "Trip Database",
      url: `https://www.tripdatabase.com/search?criteria=${enc(q)}`,
      note: "Партнёрский доступ уточнять",
    });
    links.push({
      id: "elibrary",
      label: "eLIBRARY.RU",
      url: `https://elibrary.ru/query_results.asp?where_query=${enc(q)}`,
      note: "Партнёрство / регистрация",
    });
    links.push({
      id: "scopus",
      label: "Scopus",
      url: doi
        ? `https://www.scopus.com/results/results.uri?src=s&st1=${enc(doi)}`
        : `https://www.scopus.com/results/results.uri?src=s&st1=${enc(title)}`,
      note: "Платная лицензия — только ссылка",
    });
    links.push({
      id: "web_of_science",
      label: "Web of Science",
      url: `https://www.webofscience.com/wos/woscc/basic-search`,
      note: "Платная лицензия — откройте поиск вручную",
    });
  }

  return links;
}
