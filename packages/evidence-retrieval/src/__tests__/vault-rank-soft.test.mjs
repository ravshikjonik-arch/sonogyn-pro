/**
 * Pure ESM soft checks (no tsx) for phrase hints + title re-rank.
 * Run: node --experimental-strip-types --test packages/evidence-retrieval/src/__tests__/vault-rank-soft.test.mjs
 * Or via strip-types import from sibling .ts in a one-shot smoke.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const src = join(dirname(fileURLToPath(import.meta.url)), "..");
const { expandVaultQueryVariants } = await import(pathToFileURL(join(src, "vault-abbreviations.ts")).href);
const { rerankVaultHitsByQueryOverlap } = await import(pathToFileURL(join(src, "vault-merge.ts")).href);

describe("vault soft ranking (checklist #8/#9/#15/#29)", () => {
  it("expands GSD / cervical / cesarean phrases", () => {
    const gsd = expandVaultQueryVariants("гестационный диабет глюкоза 5.1");
    assert.ok(gsd.some((v) => /сахарный диабет|ГСД/i.test(v)));
    const cerv = expandVaultQueryVariants("цервикометрия преждевременные роды");
    assert.ok(cerv.some((v) => /длина шейки|преждевременные роды длина/i.test(v)));
    const cs = expandVaultQueryVariants("показания к кесареву сечению категории неотложности");
    assert.ok(cs.some((v) => /роды одноплодные кесарево|кесарево сечение показания/i.test(v)));
  });

  it("title re-rank prefers cesarean and GSD titles", () => {
    const cs = rerankVaultHitsByQueryOverlap(
      [
        {
          chunkId: "a",
          sourceId: "s",
          title: "КР МЗ РФ: преждевременная отслойка плаценты (ID 800)",
          quote: "",
          url: "#",
          score: 0.9,
        },
        {
          chunkId: "b",
          sourceId: "s",
          title: "КР МЗ РФ: роды одноплодные, кесарево сечение (ID 639)",
          quote: "",
          url: "#",
          score: 0.8,
        },
      ],
      "показания к кесареву сечению категории неотложности",
      2,
    );
    assert.equal(cs[0]?.chunkId, "b");

    const gsd = rerankVaultHitsByQueryOverlap(
      [
        {
          chunkId: "dm2",
          sourceId: "s",
          title: "КР РАЭ: сахарный диабет 2 типа у взрослых",
          quote: "",
          url: "#",
          score: 0.9,
        },
        {
          chunkId: "gsd",
          sourceId: "s",
          title: "КР МЗ РФ: гестационный сахарный диабет (ID 841)",
          quote: "",
          url: "#",
          score: 0.8,
        },
      ],
      "гестационный сахарный диабет глюкоза 5.1 ПГТТ",
      2,
    );
    assert.equal(gsd[0]?.chunkId, "gsd");
  });
});
