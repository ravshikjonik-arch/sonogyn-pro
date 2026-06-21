import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateTiradsRu } from "./classify";

describe("evaluateTiradsRu", () => {
  it("returns TR2 for spongiform nodule", () => {
    const r = evaluateTiradsRu({
      composition: "spongiform",
      echogenicity: "iso_hyper",
      shape: "wider",
      margin: "smooth",
      calcification: "none",
    });
    assert.equal(r.category, "2");
  });

  it("returns TR5 for microcalc + taller + marked hypoechoic", () => {
    const r = evaluateTiradsRu({
      composition: "solid",
      echogenicity: "markedly_hypoechoic",
      shape: "taller",
      margin: "irregular",
      calcification: "micro",
      largestDiameterMm: 11,
    });
    assert.equal(r.category, "5");
    assert.equal(r.fnaRecommended, true);
  });
});
