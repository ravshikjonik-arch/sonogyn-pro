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
});

describe("expandVaultQueryForEmbedding", () => {
  it("rewrites abbreviations to full forms for a single embedding string", () => {
    const out = expandVaultQueryForEmbedding("ТАБ узла ЩЖ");
    assert.match(out, /тонкоигольная/i);
    assert.match(out, /щитовидн/i);
  });
});
