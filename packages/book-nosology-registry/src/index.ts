import registry from "../data/registry.generated.json";
import bridge from "../data/seed-nosology-bridge.json";

import type { BookNosologyEntry, BookNosologyRegistry, BookNosologyZone } from "./types";

export * from "./types";

const REG = registry as BookNosologyRegistry;
const SEED_BRIDGE = bridge as Record<string, string[]>;

export function getBookNosologyRegistry(): BookNosologyRegistry {
  return REG;
}

export function listBookNosologyEntries(opts?: {
  zone?: BookNosologyZone | "all";
  bookId?: string;
  clinicalOnly?: boolean;
}): BookNosologyEntry[] {
  let list = REG.entries;
  if (opts?.clinicalOnly) list = list.filter((e) => e.kind === "clinical");
  if (opts?.bookId) list = list.filter((e) => e.bookId === opts.bookId);
  if (opts?.zone && opts.zone !== "all") list = list.filter((e) => e.zone === opts.zone);
  return list;
}

export function getBookNosologyEntry(id: string): BookNosologyEntry | undefined {
  return REG.entries.find((e) => e.id === id);
}

export function searchBookNosologyEntries(query: string, limit = 40): BookNosologyEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { e: BookNosologyEntry; s: number }[] = [];
  for (const e of REG.entries) {
    const hay = [e.titleRu, e.domainLabel, e.summaryRu, ...e.keyFactsRu, e.chapterSlug].join(" ").toLowerCase();
    if (!hay.includes(q)) continue;
    let s = 0;
    if (e.titleRu.toLowerCase().includes(q)) s += 3;
    if (e.kind === "clinical") s += 1;
    scored.push({ e, s });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.e);
}

export function listBookEntriesForSeedNosology(seedNosologyId: string): BookNosologyEntry[] {
  const ids = SEED_BRIDGE[seedNosologyId] ?? [];
  return ids.map((id) => getBookNosologyEntry(id)).filter((e): e is BookNosologyEntry => Boolean(e));
}

export function listSeedNosologyIdsWithBookLinks(): string[] {
  return Object.keys(SEED_BRIDGE);
}

export function bookAtlasKnowledgeLinksForSeed(seedNosologyId: string): {
  kind: "atlas" | "education";
  title: string;
  href: string;
  description?: string;
}[] {
  const entries = listBookEntriesForSeedNosology(seedNosologyId);
  const byBook = new Map<string, BookNosologyEntry[]>();
  for (const e of entries) {
    if (!byBook.has(e.bookId)) byBook.set(e.bookId, []);
    byBook.get(e.bookId)?.push(e);
  }
  const links: { kind: "atlas" | "education"; title: string; href: string; description?: string }[] = [];
  for (const [bookId, list] of byBook) {
    const first = list[0];
    if (!first) continue;
    const route = first.atlasHref.split("?")[0];
    links.push({
      kind: "atlas",
      title: first.domainLabel,
      href: route,
      description: `${list.length} тем из книги`,
    });
  }
  for (const e of entries.slice(0, 4)) {
    links.push({
      kind: "education",
      title: e.titleRu.slice(0, 72),
      href: `/tools/refs/book-nosology/${encodeURIComponent(e.id)}`,
    });
  }
  return links;
}
