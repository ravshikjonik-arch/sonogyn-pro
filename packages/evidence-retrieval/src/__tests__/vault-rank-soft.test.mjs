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

  it("title re-rank prefers labor anomalies / rectocele / SLE", () => {
    const labor = rerankVaultHitsByQueryOverlap(
      [
        {
          chunkId: "osteo",
          sourceId: "s",
          title: "КР МЗ РФ: остеопороз (ID 87)",
          quote: "",
          url: "#",
          score: 0.9,
        },
        {
          chunkId: "labor",
          sourceId: "s",
          title: "КР МЗ РФ: аномалии родовой деятельности (ID 822)",
          quote: "",
          url: "#",
          score: 0.8,
        },
      ],
      "аномалии родовой деятельности слабость схваток окситоцин",
      2,
    );
    assert.equal(labor[0]?.chunkId, "labor");

    const rect = rerankVaultHitsByQueryOverlap(
      [
        {
          chunkId: "cush",
          sourceId: "s",
          title: "КР МЗ РФ / РАЭ: болезнь Иценко–Кушинга (ID 84)",
          quote: "",
          url: "#",
          score: 0.9,
        },
        {
          chunkId: "rect",
          sourceId: "s",
          title: "КР МЗ РФ: ректоцеле (ID 188)",
          quote: "",
          url: "#",
          score: 0.8,
        },
      ],
      "ректоцеле дефекография кольпоперинеоррафия",
      2,
    );
    assert.equal(rect[0]?.chunkId, "rect");

    const sle = rerankVaultHitsByQueryOverlap(
      [
        {
          chunkId: "nb",
          sourceId: "s",
          title: "КР МЗ РФ: нормальная беременность (ID 288)",
          quote: "",
          url: "#",
          score: 0.9,
        },
        {
          chunkId: "sle",
          sourceId: "s",
          title: "КР МЗ РФ: системная красная волчанка (ID 484)",
          quote: "",
          url: "#",
          score: 0.8,
        },
      ],
      "СКВ беременность гидроксихлорохин АФС",
      2,
    );
    assert.equal(sle[0]?.chunkId, "sle");
  });
});
