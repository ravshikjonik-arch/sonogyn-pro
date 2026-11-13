import assert from "node:assert/strict";
import test from "node:test";

import { assessBiradsUsLesion } from "./assess";
import { BIRADS_CATEGORY_INFO } from "./lexicon";
import type { BiradsUsLesionInput, BiradsUsLesionResult } from "./types";

function ok(r: BiradsUsLesionResult) {
  assert.equal(r.status, "ok", JSON.stringify(r));
  if (r.status !== "ok") throw new Error("not ok");
  return r;
}

const probablyBenign: BiradsUsLesionInput = {
  kind: "mass",
  shape: "oval",
  orientation: "parallel",
  margin: "circumscribed",
  echoPattern: "hypoechoic",
  posterior: "none",
  calcifications: "none",
  associated: ["none"],
};

test("ACR category 3 pathway: solid oval, circumscribed, parallel, no suspicious features", () => {
  const r = ok(assessBiradsUsLesion(probablyBenign));
  assert.deepEqual(r.pathway, { kind: "determined", category: "3", reasonRu: r.pathway.kind === "determined" ? r.pathway.reasonRu : "" });
  assert.equal(r.final?.category, "3");
  assert.equal(r.final?.likelihoodRu, "> 0% и ≤ 2%");
  assert.match(r.final?.managementRu ?? "", /6 месяцев/);
  assert.equal(r.finalSource, "engine");
});

test("special cases: benign → 2; isolated complicated cyst and clustered microcysts → 3", () => {
  for (const specialCase of ["simple_cyst", "intramammary_lymph_node", "postsurgical_fluid", "implant_or_foreign_body"] as const) {
    assert.equal(ok(assessBiradsUsLesion({ kind: "special_case", specialCase })).final?.category, "2", specialCase);
  }
  for (const specialCase of ["isolated_complicated_cyst", "clustered_microcysts"] as const) {
    assert.equal(ok(assessBiradsUsLesion({ kind: "special_case", specialCase })).final?.category, "3", specialCase);
  }
});

test("each suspicious feature → ≥ BI-RADS 4, doctor chooses 4A/4B/4C/5, no engine category", () => {
  const variants: BiradsUsLesionInput[] = [
    { ...probablyBenign, shape: "irregular" },
    { ...probablyBenign, orientation: "non_parallel" },
    { ...probablyBenign, margin: "indistinct" },
    { ...probablyBenign, margin: "angular" },
    { ...probablyBenign, margin: "spiculated" },
    { ...probablyBenign, echoPattern: "mixed_solid_cystic" },
    { ...probablyBenign, calcifications: "micro" },
    { ...probablyBenign, associated: ["architectural_distortion"] },
    { ...probablyBenign, associated: ["duct_changes"] },
    { ...probablyBenign, associated: ["skin_retraction"] },
  ];
  for (const v of variants) {
    const r = ok(assessBiradsUsLesion(v));
    assert.equal(r.pathway.kind, "needs_doctor", JSON.stringify(v));
    if (r.pathway.kind === "needs_doctor") assert.deepEqual(r.pathway.options, ["4A", "4B", "4C", "5"]);
    assert.equal(r.final, null, "engine never picks a 4 subcategory or 5");
    assert.ok(r.suspiciousFeatures.length >= 1);
  }
});

test("one suspicious feature is enough even if other descriptors are missing", () => {
  const r = ok(assessBiradsUsLesion({ kind: "mass", margin: "spiculated" }));
  assert.equal(r.pathway.kind, "needs_doctor");
  assert.ok(r.notesRu.some((n) => /Не описаны: форма/.test(n)));
});

test("lobulated circumscribed parallel solid mass → doctor chooses 3 or 4A", () => {
  const r = ok(assessBiradsUsLesion({ ...probablyBenign, shape: "lobulated" }));
  assert.equal(r.pathway.kind, "needs_doctor");
  if (r.pathway.kind === "needs_doctor") assert.deepEqual(r.pathway.options, ["3", "4A"]);
  assert.equal(r.final, null);
});

test("features outside category 3 criteria (round, shadowing, rind, skin thickening, edema) → doctor decides", () => {
  for (const v of [
    { ...probablyBenign, shape: "round" as const },
    { ...probablyBenign, posterior: "shadowing" as const },
    { ...probablyBenign, associated: ["echogenic_rind" as const] },
    { ...probablyBenign, associated: ["skin_thickening" as const] },
    { ...probablyBenign, associated: ["edema" as const] },
  ]) {
    const r = ok(assessBiradsUsLesion(v));
    assert.equal(r.pathway.kind, "needs_doctor", JSON.stringify(v));
    assert.equal(r.final, null);
  }
});

test("non-mass lesion → doctor decides", () => {
  const r = ok(
    assessBiradsUsLesion({
      kind: "non_mass",
      nmlDistribution: "segmental",
      nmlEcho: "hypoechoic",
      nmlPosterior: "none",
      calcifications: "none",
      associated: ["none"],
    }),
  );
  assert.equal(r.pathway.kind, "needs_doctor");
  assert.equal(r.final, null);
});

test("missing descriptors never fall back to a category (no fake BI-RADS 0)", () => {
  const r = assessBiradsUsLesion({ kind: "mass", shape: "oval", orientation: "parallel" });
  assert.equal(r.status, "incomplete");
  if (r.status === "incomplete") assert.deepEqual(r.missing, ["margin", "echoPattern", "posterior", "calcifications", "associated"]);
  assert.equal(assessBiradsUsLesion({}).status, "incomplete");
  assert.equal(assessBiradsUsLesion({ kind: "special_case" }).status, "incomplete");
});

test("invalid input produces validation errors", () => {
  assert.equal(assessBiradsUsLesion({ ...probablyBenign, margin: "microlobulated" as never }).status, "invalid");
  assert.equal(assessBiradsUsLesion({ ...probablyBenign, associated: ["none", "edema"] }).status, "invalid");
  assert.equal(assessBiradsUsLesion({ ...probablyBenign, doctorCategory: "7" as never }).status, "invalid");
});

test("doctor's category is final and never rewritten; a mismatch is noted", () => {
  const chosen = ok(assessBiradsUsLesion({ ...probablyBenign, margin: "spiculated", doctorCategory: "4C" }));
  assert.equal(chosen.final?.category, "4C");
  assert.equal(chosen.finalSource, "doctor");
  assert.equal(chosen.notesRu.some((n) => /отличается/.test(n)), false);

  const mismatch = ok(assessBiradsUsLesion({ ...probablyBenign, margin: "spiculated", doctorCategory: "3" }));
  assert.equal(mismatch.final?.category, "3");
  assert.ok(mismatch.notesRu.some((n) => /отличается от расчётного пути/.test(n)));
  assert.equal(mismatch.pathway.kind, "needs_doctor", "the computed pathway is kept for the report");
});

test("stable on priors: suggestion for category 2 only as a note", () => {
  const r = ok(assessBiradsUsLesion({ ...probablyBenign, stableOnPriors: true }));
  assert.equal(r.final?.category, "3");
  assert.ok(r.notesRu.some((n) => /категории 2/.test(n)));
});

test("ACR likelihood ranges and management per category", () => {
  assert.equal(BIRADS_CATEGORY_INFO["4A"].likelihoodRu, "> 2% и ≤ 10%");
  assert.equal(BIRADS_CATEGORY_INFO["4B"].likelihoodRu, "> 10% и ≤ 50%");
  assert.equal(BIRADS_CATEGORY_INFO["4C"].likelihoodRu, "> 50% и < 95%");
  assert.equal(BIRADS_CATEGORY_INFO["5"].likelihoodRu, "≥ 95%");
  for (const c of ["4A", "4B", "4C", "5"] as const) assert.match(BIRADS_CATEGORY_INFO[c].managementRu, /биопсия/i);
  assert.match(BIRADS_CATEGORY_INFO["0"].managementRu, /Дополнительное обследование/);
});
