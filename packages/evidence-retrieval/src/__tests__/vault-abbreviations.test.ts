import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  expandVaultQueryForEmbedding,
  expandVaultQueryVariants,
  VAULT_AMBIGUOUS_ABBREVIATIONS,
} from "../vault-abbreviations.js";

describe("expandVaultQueryVariants", () => {
  it("expands ЩЖ to the full thyroid phrase", () => {
    const variants = expandVaultQueryVariants("опухоль ЩЖ");
    assert.equal(variants[0], "опухоль ЩЖ");
    assert.ok(variants.some((v) => /щитовидн/i.test(v)));
  });

  it("also expands full phrase toward the abbreviation", () => {
    const variants = expandVaultQueryVariants("опухоль щитовидной железы");
    assert.ok(variants.some((v) => /\bЩЖ\b/.test(v) || v.includes("ЩЖ")));
  });

  it("does not invent expansions for ambiguous abbreviations", () => {
    const variants = expandVaultQueryVariants("лечение ПЭ");
    assert.deepEqual(variants, ["лечение ПЭ"]);
    assert.ok(VAULT_AMBIGUOUS_ABBREVIATIONS.some((a) => a.abbr === "ПЭ"));
  });

  it("caps fan-out", () => {
    assert.ok(expandVaultQueryVariants("УЗИ ЩЖ МЖ ТАБ ЛУ", 3).length <= 3);
  });

  it("returns empty for blank input", () => {
    assert.deepEqual(expandVaultQueryVariants(" "), []);
  });

  it("adds GSD / cervical length phrase hints for weak checklist queries", () => {
    const gsd = expandVaultQueryVariants("гестационный диабет глюкоза 5.1");
    assert.ok(gsd.some((v) => /сахарный диабет|ГСД/i.test(v)));
    const cerv = expandVaultQueryVariants("цервикометрия преждевременные роды");
    assert.ok(cerv.some((v) => /длина шейки|преждевременные роды длина/i.test(v)));
    const cs = expandVaultQueryVariants("показания к кесареву сечению категории неотложности");
    assert.ok(cs.some((v) => /роды одноплодные кесарево|кесарево сечение показания/i.test(v)));
  });
});

describe("expandVaultQueryForEmbedding", () => {
  it("rewrites abbreviations to full forms for a single embedding string", () => {
    const out = expandVaultQueryForEmbedding("ТАБ узла ЩЖ");
    assert.match(out, /тонкоигольная/i);
    assert.match(out, /щитовидн/i);
  });
});
