import { listKrRubricatorWhatsNewItems } from "@repo/clinical-guidelines";

export type MobileWhatsNewItem = {
  id: string;
  category: string;
  title: string;
  summary: string;
  url: string;
  updatedAt: string;
};

const CURATED: MobileWhatsNewItem[] = [
  {
    id: "kr-rubricator-hub",
    category: "guideline",
    title: "Рубрикатор КР МЗ РФ",
    summary: "Официальный каталог клинических рекомендаций.",
    url: "https://cr.minzdrav.gov.ru/",
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: "pubmed-obgyn",
    category: "research",
    title: "PubMed · АГ / УЗИ",
    summary: "Свежие публикации (фильтр по дате).",
    url: "https://pubmed.ncbi.nlm.nih.gov/?term=obstetrics+OR+gynecology+OR+ultrasound&sort=date",
    updatedAt: new Date().toISOString().slice(0, 10),
  },
];

/** Bundled with app binary — new KR from last `pnpm sync:guidelines` at release time. */
export function getBundledWhatsNewFeed(): MobileWhatsNewItem[] {
  const krItems: MobileWhatsNewItem[] = listKrRubricatorWhatsNewItems(8).map((item) => ({
    id: item.id,
    category: "guideline",
    title: item.title,
    summary: item.summary,
    url: item.url,
    updatedAt: item.updatedAt,
  }));
  return [...krItems, ...CURATED];
}