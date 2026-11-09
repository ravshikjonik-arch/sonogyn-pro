import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAcrTiradsStrict, type AcrStrictInput, type AcrStrictResult } from "./acr-strict";
import { evaluateEuTirads } from "./eu";

function okResult(r: AcrStrictResult) {
  assert.equal(r.status, "ok", JSON.stringify(r));
  if (r.status !== "ok") throw new Error("not ok");
  return r;
}

const tr3: AcrStrictInput = {
  composition: "solid", // 2
  echogenicity: "hyperechoic_or_isoechoic", // 1
  shape: "wider_than_tall",
  margin: "smooth",
  echogenicFoci: ["none_or_comet_tail"],
};
const tr4: AcrStrictInput = { ...tr3, echogenicity: "hypoechoic" }; // 4
const tr5: AcrStrictInput = { ...tr4, shape: "taller_than_wide" }; // 7

test("every individual ACR point value", () => {
  const base: AcrStrictInput = { ...tr3, composition: "mixed", echogenicity: "anechoic" }; // 1 point
  const pts = (i: AcrStrictInput) => okResult(evaluateAcrTiradsStrict(i)).result.totalPoints;
  assert.equal(pts(base), 1);
  assert.equal(pts({ ...base, composition: "solid" }), 2);
  assert.equal(pts({ ...base, echogenicity: "hyperechoic_or_isoechoic" }), 2);
  assert.equal(pts({ ...base, echogenicity: "hypoechoic" }), 3);
  assert.equal(pts({ ...base, echogenicity: "very_hypoechoic" }), 4);
  assert.equal(pts({ ...base, shape: "taller_than_wide" }), 4);
  assert.equal(pts({ ...base, margin: "ill_defined" }), 1);
  assert.equal(pts({ ...base, margin: "lobulated_or_irregular" }), 3);
  assert.equal(pts({ ...base, margin: "extrathyroidal_extension" }), 4);
  assert.equal(pts({ ...base, echogenicFoci: ["macrocalcifications"] }), 2);
  assert.equal(pts({ ...base, echogenicFoci: ["peripheral_rim"] }), 3);
  assert.equal(pts({ ...base, echogenicFoci: ["punctate"] }), 4);
});

test("all echogenic foci combinations are summed", () => {
  const base: AcrStrictInput = { ...tr3, composition: "mixed", echogenicity: "anechoic" };
  const foci = ["macrocalcifications", "peripheral_rim", "punctate"] as const;
  const value = { macrocalcifications: 1, peripheral_rim: 2, punctate: 3 };
  for (let mask = 1; mask < 8; mask++) {
    const chosen = foci.filter((_, i) => mask & (1 << i));
    const r = okResult(evaluateAcrTiradsStrict({ ...base, echogenicFoci: [...chosen] })).result;
    assert.equal(r.scoreBreakdown.echogenicFoci, chosen.reduce((s, f) => s + value[f], 0));
  }
});

test("TR1–TR5 boundaries", () => {
  const cat = (i: AcrStrictInput) => okResult(evaluateAcrTiradsStrict(i)).result.category;
  assert.equal(cat({ composition: "spongiform" }), "TR1");
  assert.equal(cat({ composition: "no_nodule" }), "TR1");
  assert.equal(cat({ ...tr3, composition: "cystic", echogenicity: "anechoic" }), "TR1");
  assert.equal(cat({ ...tr3, composition: "mixed", echogenicity: "hyperechoic_or_isoechoic" }), "TR2");
  assert.equal(cat(tr3), "TR3");
  assert.equal(cat(tr4), "TR4");
  assert.equal(cat({ ...tr4, margin: "lobulated_or_irregular" }), "TR4"); // 6
  assert.equal(cat(tr5), "TR5");
});

test("FNA and follow-up thresholds TR3 25/15, TR4 15/10, TR5 10/5 mm", () => {
  const m = (i: AcrStrictInput, size: number) => okResult(evaluateAcrTiradsStrict({ ...i, largestDiameterMm: size })).management;
  assert.equal(m(tr3, 24).fna, "not_indicated");
  assert.equal(m(tr3, 25).fna, "indicated");
  assert.match(m(tr3, 15).followUpRu ?? "", /1, 3 и 5/);
  assert.doesNotMatch(m(tr3, 14).followUpRu ?? "", /1, 3 и 5/);

  assert.equal(m(tr4, 14).fna, "not_indicated");
  assert.equal(m(tr4, 15).fna, "indicated");
  assert.match(m(tr4, 10).followUpRu ?? "", /1, 2, 3 и 5/);
  assert.doesNotMatch(m(tr4, 9).followUpRu ?? "", /1, 2, 3 и 5/);

  assert.equal(m(tr5, 9).fna, "not_indicated");
  assert.equal(m(tr5, 10).fna, "indicated");
  assert.match(m(tr5, 5).followUpRu ?? "", /ежегодно/);
  assert.doesNotMatch(m(tr5, 4).followUpRu ?? "", /ежегодно/);
});

test("missing data never becomes 0 points", () => {
  const r = evaluateAcrTiradsStrict({ composition: "solid", echogenicity: "hypoechoic" });
  assert.equal(r.status, "incomplete");
  if (r.status === "incomplete") assert.deepEqual(r.missing, ["shape", "margin", "echogenicFoci"]);
  assert.equal(evaluateAcrTiradsStrict({}).status, "incomplete");
  assert.equal(evaluateAcrTiradsStrict({ ...tr3, echogenicFoci: [] }).status, "incomplete");
});

test("size missing → management undetermined for TR3–TR5, not 'no FNA'", () => {
  for (const i of [tr3, tr4, tr5]) {
    assert.equal(okResult(evaluateAcrTiradsStrict(i)).management.fna, "undetermined");
  }
  assert.equal(okResult(evaluateAcrTiradsStrict({ composition: "spongiform" })).management.fna, "not_indicated");
});

test("invalid values produce validation errors", () => {
  assert.equal(evaluateAcrTiradsStrict({ ...tr3, shape: "round" as never }).status, "invalid");
  assert.equal(evaluateAcrTiradsStrict({ ...tr3, echogenicFoci: ["glitter" as never] }).status, "invalid");
  assert.equal(evaluateAcrTiradsStrict({ ...tr3, largestDiameterMm: 0 }).status, "invalid");
});

test("ETE warning and pediatric guard", () => {
  const ete = okResult(evaluateAcrTiradsStrict({ ...tr4, margin: "extrathyroidal_extension", largestDiameterMm: 12 }));
  assert.ok(ete.warnings.some((w) => w.code === "extrathyroidal_extension"));
  const kid = okResult(evaluateAcrTiradsStrict({ ...tr5, largestDiameterMm: 20, isPediatric: true }));
  assert.equal(kid.management.fna, "undetermined");
  assert.ok(kid.warnings.some((w) => w.code === "pediatric"));
});

test("cross-engine: EU-TIRADS and ACR results are independent", () => {
  const acrBefore = okResult(evaluateAcrTiradsStrict({ ...tr4, largestDiameterMm: 16 }));
  const eu = evaluateEuTirads(
    { composition: "solid", echogenicity: "mildly_hypoechoic", shape: "oval", margins: "smooth", microcalcifications: "absent", maxDiameterMm: 16 },
    "RU_KR_2024",
  );
  assert.equal(eu.status, "ok");
  evaluateEuTirads({ composition: "solid", microcalcifications: "present", maxDiameterMm: 16 }, "ETA_2023");
  const acrAfter = okResult(evaluateAcrTiradsStrict({ ...tr4, largestDiameterMm: 16 }));
  assert.deepEqual(acrAfter.result, acrBefore.result);
  assert.deepEqual(acrAfter.management, acrBefore.management);
});
