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

/** Human-readable page locator for citations: «стр. 13» / «стр. 13–14». */
export function formatVaultPages(hit: Pick<MedicalVaultSearchHit, "pageStart" | "pageEnd">): string | undefined {
  const start = hit.pageStart;
  if (typeof start !== "number" || start < 1) return undefined;
  const end = hit.pageEnd;
  if (typeof end === "number" && end > start) return `стр. ${start}–${end}`;
  return `стр. ${start}`;
}
