import type { MedicalVaultSearchHit } from "./types.js";

/** Standard RRF constant (Cormack et al., 2009). */
export const VAULT_RRF_K = 60;

/**
 * Merge semantic (cosine) and FTS (ts_rank_cd) vault hits by Reciprocal Rank Fusion.
 * Raw scores are on incompatible scales, so order uses ranks only.
 * Payload and score prefer the semantic hit; page locators are filled from either list.
 */
export function mergeVaultHitsRrf(
  semantic: MedicalVaultSearchHit[],
  fts: MedicalVaultSearchHit[],
  limit: number,
  k: number = VAULT_RRF_K,
): MedicalVaultSearchHit[] {
  const fused = new Map<string, { hit: MedicalVaultSearchHit; rrf: number; order: number }>();

  const addList = (list: MedicalVaultSearchHit[], channel: 0 | 1) => {
    const seen = new Set<string>();
    list.forEach((hit, index) => {
      if (seen.has(hit.chunkId)) return;
      seen.add(hit.chunkId);
      const contribution = 1 / (k + index + 1);
      const prev = fused.get(hit.chunkId);
      if (!prev) {
        fused.set(hit.chunkId, { hit, rrf: contribution, order: index * 2 + channel });
        return;
      }
      prev.hit = {
        ...prev.hit,
        pageStart: prev.hit.pageStart ?? hit.pageStart,
        pageEnd: prev.hit.pageEnd ?? hit.pageEnd,
      };
      prev.rrf += contribution;
    });
  };

  addList(semantic, 0);
  addList(fts, 1);

  // Ties: same rank position → semantic before FTS (never compare raw scores across channels).
  return Array.from(fused.values())
    .sort((x, y) => y.rrf - x.rrf || x.order - y.order)
    .slice(0, Math.max(0, limit))
    .map((entry) => entry.hit);
}

/**
 * Soft title re-rank after RRF: prefer sources whose title overlaps distinctive query terms.
 * Does not invent medicine — only reorders already retrieved hits.
 */
export function rerankVaultHitsByQueryOverlap(
  hits: MedicalVaultSearchHit[],
  query: string,
  limit: number,
): MedicalVaultSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q || hits.length <= 1) return hits.slice(0, Math.max(0, limit));

  const tokens = q
    .split(/[^\p{L}\p{N}]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4);

  const scored = hits.map((hit, index) => {
    const title = (hit.title || "").toLowerCase();
    let bonus = 0;
    for (const t of tokens) {
      if (title.includes(t)) bonus += 1;
    }
    if (/кесарев/i.test(q) && /кесарев/i.test(title)) bonus += 4;
    if (/гестационн|гсд|пгтт|глюкоза\s*5/i.test(q) && /гестационн|гсд/i.test(title)) bonus += 4;
    if (/гестационн|гсд|пгтт/i.test(q) && /сахарный диабет 2|сд2|диабет 2 типа/i.test(title)) bonus -= 2;
    if (/цервикометр|преждевременн/i.test(q) && /преждевременн/i.test(title)) bonus += 3;
    if (/цервикометр|преждевременн/i.test(q) && /истмико|ицн/i.test(title) && !/преждевременн/i.test(title)) {
      bonus -= 2;
    }
    if (/категори\w+\s+неотложности/i.test(q) && /отслойк/i.test(title)) bonus -= 2;
    if (/аномал\w*\s+родов|слабость\s+(схваток|родовой)|окситоцин/i.test(q) && /аномал\w*\s+родов|родовой деятельност/i.test(title)) {
      bonus += 4;
    }
    if (/аномал\w*\s+родов|слабость\s+(схваток|родовой)|окситоцин/i.test(q) && /остеопороз/i.test(title)) {
      bonus -= 3;
    }
    if (/ректоцеле|дефекограф|кольпоперинеорраф/i.test(q) && /ректоцеле/i.test(title)) bonus += 4;
    if (/ректоцеле|дефекограф|кольпоперинеорраф/i.test(q) && /кушинг|иценко/i.test(title)) bonus -= 3;
    // Avoid JS `\b` — it does not treat Cyrillic letters as word chars.
    if (/(?<![\p{L}\p{N}])скв(?![\p{L}\p{N}])|волчанк|гидроксихлорохин|(?<![\p{L}\p{N}])афс(?![\p{L}\p{N}])/iu.test(q) &&
      /волчанк|(?<![\p{L}\p{N}])скв(?![\p{L}\p{N}])|системн\w*\s+красн/iu.test(title)) {
      bonus += 4;
    }
    if (/(?<![\p{L}\p{N}])скв(?![\p{L}\p{N}])|волчанк|гидроксихлорохин|(?<![\p{L}\p{N}])афс(?![\p{L}\p{N}])/iu.test(q) &&
      /нормальн\w*\s+беременност/i.test(title)) {
      bonus -= 3;
    }
    return { hit, index, bonus };
  });

  return scored
    .sort((a, b) => b.bonus - a.bonus || a.index - b.index)
    .slice(0, Math.max(0, limit))
    .map((s) => s.hit);
}

/** Human-readable page locator for citations: «стр. 13» / «стр. 13–14». */
export function formatVaultPages(hit: Pick<MedicalVaultSearchHit, "pageStart" | "pageEnd">): string | undefined {
  const start = hit.pageStart;
  if (typeof start !== "number" || start < 1) return undefined;
  const end = hit.pageEnd;
  if (typeof end === "number" && end > start) return `стр. ${start}–${end}`;
  return `стр. ${start}`;
}
