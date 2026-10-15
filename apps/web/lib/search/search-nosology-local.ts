import nosologySeed from "@repo/nosology/seed";
import { searchNosologies } from "@repo/nosology";
import type { Nosology } from "@repo/nosology";

const NOSOLOGIES = nosologySeed as Nosology[];

export type NosologyLocalHit = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
};

export function searchNosologyLocal(rawQuery: string, limit = 6): NosologyLocalHit[] {
  const hits = searchNosologies(NOSOLOGIES, rawQuery, limit);
  return hits.map((h) => ({
    id: h.id,
    title: h.title,
    subtitle: h.snippet,
    href: `/tools/refs/nosologies/${h.id}`,
    score: h.score,
  }));
}
