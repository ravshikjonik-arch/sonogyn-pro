import { CLINICAL_TOOLS, type ClinicalTool, type ToolCategory } from "@repo/clinical-tools";

export type SpatialHubDeckId =
  | "rads"
  | "obstetrics"
  | "gynecology"
  | "community"
  | "assistant"
  | "reference";

export type SpatialHubDeck = {
  id: SpatialHubDeckId;
  title: string;
  description: string;
  /** Dedupe tools by webHref within deck */
  categories: ToolCategory[];
  toolIds?: string[];
};

export const SPATIAL_HUB_DECKS: SpatialHubDeck[] = [
  {
    id: "rads",
    title: "RADS и риск",
    description: "O-RADS, BI-RADS, TI-RADS, IOTA, LN-RADS — классификации без изменения формул.",
    categories: ["ovary", "breast", "thyroid", "lymph"],
  },
  {
    id: "obstetrics",
    title: "Акушерство",
    description: "Фетометрия, вес плода, шейка матки, VBAC и другие расчёты беременности.",
    categories: ["pregnancy"],
  },
  {
    id: "gynecology",
    title: "Гинекология",
    description: "Эндометрий, POP-Q, шейка матки, эластография и риски по КР.",
    categories: ["uterus", "pelvic"],
  },
  {
    id: "community",
    title: "Сообщество",
    description: "Чат врачей, кейсы, обсуждения и учебные подборки.",
    categories: ["community"],
  },
  {
    id: "assistant",
    title: "AI и рабочая зона",
    description: "Разбор снимков и описаний без персональных данных пациентки.",
    categories: ["assistant"],
  },
  {
    id: "reference",
    title: "Справочник и атласы",
    description: "КР, нозологии, нормы, курсы и атласы — только существующие разделы.",
    categories: ["reference"],
  },
];

function uniqueByHref(tools: ClinicalTool[]): ClinicalTool[] {
  const out: ClinicalTool[] = [];
  const seen = new Set<string>();
  for (const t of tools) {
    const href = t.webHref?.trim();
    if (!href || seen.has(href)) continue;
    seen.add(href);
    out.push(t);
  }
  return out;
}

export function getToolsForDeck(deckId: SpatialHubDeckId): ClinicalTool[] {
  const deck = SPATIAL_HUB_DECKS.find((d) => d.id === deckId);
  if (!deck) return [];

  let tools: ClinicalTool[] = [];

  if (deck.toolIds?.length) {
    const ids = new Set(deck.toolIds);
    tools = CLINICAL_TOOLS.filter((t) => ids.has(t.id));
  }

  if (deck.categories.length) {
    const cats = new Set(deck.categories);
    tools = [...tools, ...CLINICAL_TOOLS.filter((t) => cats.has(t.category))];
  }

  return uniqueByHref(tools).sort((a, b) => a.title.localeCompare(b.title, "ru"));
}

export function parseSpatialHubDeck(value: string | null | undefined): SpatialHubDeckId | null {
  if (!value) return null;
  return SPATIAL_HUB_DECKS.some((d) => d.id === value) ? (value as SpatialHubDeckId) : null;
}
