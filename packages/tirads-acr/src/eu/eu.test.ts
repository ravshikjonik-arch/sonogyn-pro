import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { evaluateEuTirads } from "./classify";
import type { EuPolicyProfile, EuTiradsInput, EuTiradsResult } from "./types";

const iso: EuTiradsInput = {
  composition: "solid",
  echogenicity: "isoechoic",
  shape: "oval",
  margins: "smooth",
  microcalcifications: "absent",
};
const mildHypo: EuTiradsInput = { ...iso, echogenicity: "mildly_hypoechoic" };

function okResult(r: EuTiradsResult) {
  assert.equal(r.status, "ok", JSON.stringify(r));
  if (r.status !== "ok") throw new Error("not ok");
  return r;
}

const PROFILES: EuPolicyProfile[] = ["RU_KR_2024", "ETA_2023"];

test("EU-TIRADS 1: no nodule", () => {
  const r = okResult(evaluateEuTirads({ composition: "no_nodule" }, "RU_KR_2024"));
  assert.equal(r.category, 1);
  assert.equal(r.management.fna, "not_indicated");
});

test("EU-TIRADS 2: pure cyst and entirely spongiform, any size, no FNA", () => {
  for (const composition of ["pure_cyst", "entirely_spongiform"] as const) {
    for (const profile of PROFILES) {
      const r = okResult(evaluateEuTirads({ composition, maxDiameterMm: 45 }, profile));
      assert.equal(r.category, 2);
      assert.equal(r.malignancyRiskRu, "≈0%");
      assert.equal(r.management.fna, "not_indicated");
    }
  }
});

test("EU-TIRADS 3: iso/hyperechoic without high-suspicion features", () => {
  assert.equal(okResult(evaluateEuTirads(iso, "ETA_2023")).category, 3);
  assert.equal(okResult(evaluateEuTirads({ ...iso, echogenicity: "hyperechoic" }, "ETA_2023")).category, 3);
  assert.equal(okResult(evaluateEuTirads({ ...iso, composition: "mixed" }, "ETA_2023")).category, 3);
  assert.equal(okResult(evaluateEuTirads({ ...iso, margins: "ill_defined" }, "ETA_2023")).category, 3);
});

test("EU-TIRADS 4: mildly hypoechoic without high-suspicion features", () => {
  const r = okResult(evaluateEuTirads(mildHypo, "RU_KR_2024"));
  assert.equal(r.category, 4);
  assert.equal(r.malignancyRiskRu, "6–17%");
});

test("EU-TIRADS 5: each single high-suspicion feature is enough; count does not matter", () => {
  const variants: EuTiradsInput[] = [
    { ...iso, shape: "non_oval" },
    { ...iso, margins: "irregular" },
    { ...iso, microcalcifications: "present" },
    { ...iso, echogenicity: "markedly_hypoechoic" },
    { ...mildHypo, shape: "non_oval", margins: "irregular", microcalcifications: "present" },
  ];
  for (const v of variants) {
    const r = okResult(evaluateEuTirads(v, "ETA_2023"));
    assert.equal(r.category, 5);
    assert.equal(r.malignancyRiskRu, "26–87%");
  }
});

test("EU-TIRADS 5 is set from one known feature even if others are missing (reported as not assessed)", () => {
  const r = okResult(evaluateEuTirads({ composition: "solid", microcalcifications: "present" }, "ETA_2023"));
  assert.equal(r.category, 5);
  assert.deepEqual(r.notAssessed, ["echogenicity", "shape", "margins"]);
  assert.ok(r.warnings.some((w) => w.code === "features_not_assessed"));
});

test("missing data is never treated as benign", () => {
  assert.equal(evaluateEuTirads({}, "ETA_2023").status, "incomplete");
  const r = evaluateEuTirads({ composition: "solid", echogenicity: "isoechoic" }, "ETA_2023");
  assert.equal(r.status, "incomplete");
  if (r.status === "incomplete") assert.deepEqual(r.missing, ["shape", "margins", "microcalcifications"]);
});

test("invalid input produces validation errors", () => {
  const bad = evaluateEuTirads({ ...iso, echogenicity: "dark" as never }, "ETA_2023");
  assert.equal(bad.status, "invalid");
  assert.equal(evaluateEuTirads({ ...iso, maxDiameterMm: -3 }, "ETA_2023").status, "invalid");
  assert.equal(evaluateEuTirads({ ...iso, maxDiameterMm: Number.NaN }, "ETA_2023").status, "invalid");
  assert.equal(evaluateEuTirads({ ...iso, maxDiameterMm: 450 }, "ETA_2023").status, "invalid");
  const contradiction = evaluateEuTirads({ composition: "pure_cyst", microcalcifications: "present" }, "ETA_2023");
  assert.equal(contradiction.status, "invalid");
});

test("FNA thresholds are strict (>) in both profiles: 3 >20, 4 >15, 5 >10 mm", () => {
  const cases: [EuTiradsInput, number][] = [
    [iso, 20],
    [mildHypo, 15],
    [{ ...iso, microcalcifications: "present" }, 10],
  ];
  for (const profile of PROFILES) {
    for (const [nodule, threshold] of cases) {
      const at = okResult(evaluateEuTirads({ ...nodule, maxDiameterMm: threshold }, profile));
      const above = okResult(evaluateEuTirads({ ...nodule, maxDiameterMm: threshold + 0.1 }, profile));
      assert.notEqual(at.management.fna, "indicated", `${profile} ${threshold} mm must not be indicated`);
      assert.equal(above.management.fna, "indicated", `${profile} ${threshold + 0.1} mm must be indicated`);
    }
  }
});

test("size missing → FNA undetermined, category still shown", () => {
  for (const profile of PROFILES) {
    const r = okResult(evaluateEuTirads(mildHypo, profile));
    assert.equal(r.category, 4);
    assert.equal(r.management.fna, "undetermined");
  }
});

test("RU_KR_2024: EU-TIRADS 5 ≤10 mm → FNA or active surveillance", () => {
  const r = okResult(evaluateEuTirads({ ...iso, shape: "non_oval", maxDiameterMm: 8 }, "RU_KR_2024"));
  assert.equal(r.management.fna, "consider");
  assert.equal(r.management.source.id, "RU_KR_2024");
});

test("ETA_2023 follow-up for nodules not undergoing FNA", () => {
  const eu2small = okResult(evaluateEuTirads({ composition: "pure_cyst", maxDiameterMm: 8 }, "ETA_2023"));
  assert.match(eu2small.management.followUpRu ?? "", /не требуется/);
  const eu2big = okResult(evaluateEuTirads({ composition: "pure_cyst", maxDiameterMm: 25 }, "ETA_2023"));
  assert.match(eu2big.management.followUpRu ?? "", /3–5 лет/);
  const eu3mid = okResult(evaluateEuTirads({ ...iso, maxDiameterMm: 15 }, "ETA_2023"));
  assert.match(eu3mid.management.followUpRu ?? "", /3–5 лет/);
  const eu3small = okResult(evaluateEuTirads({ ...iso, maxDiameterMm: 9 }, "ETA_2023"));
  assert.match(eu3small.management.followUpRu ?? "", /не требуется/);
  const eu4 = okResult(evaluateEuTirads({ ...mildHypo, maxDiameterMm: 12 }, "ETA_2023"));
  assert.match(eu4.management.followUpRu ?? "", /1 год/);
  const eu5 = okResult(evaluateEuTirads({ ...iso, margins: "irregular", maxDiameterMm: 7 }, "ETA_2023"));
  assert.match(eu5.management.followUpRu ?? "", /6–12 месяцев/);
});

test("ETA_2023: suspicious lymph nodes or ETE → FNA irrespective of category (5–10 mm EU-5: consider)", () => {
  const ln = okResult(evaluateEuTirads({ ...iso, maxDiameterMm: 12, lymphNodes: "suspicious" }, "ETA_2023"));
  assert.equal(ln.category, 3, "lymph nodes never change the nodule category");
  assert.equal(ln.management.fna, "indicated");
  const ete = okResult(evaluateEuTirads({ ...mildHypo, maxDiameterMm: 9, extrathyroidalExtension: "suspected" }, "ETA_2023"));
  assert.equal(ete.management.fna, "indicated");
  const smallEu5 = okResult(
    evaluateEuTirads({ ...iso, microcalcifications: "present", maxDiameterMm: 7, lymphNodes: "suspicious" }, "ETA_2023"),
  );
  assert.equal(smallEu5.management.fna, "consider");
});

test("RU_KR_2024: lymph nodes / ETE give warnings, not an invented FNA rule", () => {
  const r = okResult(
    evaluateEuTirads({ ...iso, maxDiameterMm: 12, lymphNodes: "suspicious", extrathyroidalExtension: "definite" }, "RU_KR_2024"),
  );
  assert.equal(r.category, 3);
  assert.equal(r.management.fna, "not_indicated");
  assert.ok(r.warnings.some((w) => w.code === "suspicious_lymph_nodes"));
  assert.ok(r.warnings.some((w) => w.code === "definite_ete"));
});

test("definite ETE always produces an explicit warning and keeps the category", () => {
  for (const profile of PROFILES) {
    const r = okResult(evaluateEuTirads({ ...mildHypo, maxDiameterMm: 12, extrathyroidalExtension: "definite" }, profile));
    assert.equal(r.category, 4);
    assert.ok(r.warnings.some((w) => w.code === "definite_ete"));
  }
});

test("pediatric: no adult thresholds; RU uses the >1 cm pediatric rule, ETA leaves it to the doctor", () => {
  const ru = okResult(evaluateEuTirads({ ...iso, maxDiameterMm: 12, isPediatric: true }, "RU_KR_2024"));
  assert.equal(ru.management.fna, "indicated");
  assert.ok(ru.warnings.some((w) => w.code === "pediatric"));
  const ruSmall = okResult(evaluateEuTirads({ ...iso, maxDiameterMm: 9, isPediatric: true }, "RU_KR_2024"));
  assert.equal(ruSmall.management.fna, "undetermined");
  const eta = okResult(evaluateEuTirads({ ...iso, maxDiameterMm: 30, isPediatric: true }, "ETA_2023"));
  assert.equal(eta.management.fna, "undetermined");
});

test("uncertain high-risk features: suggestion only, category not rewritten", () => {
  const r = okResult(evaluateEuTirads({ ...iso, highRiskFeaturesUncertain: true }, "ETA_2023"));
  assert.equal(r.category, 3);
  assert.ok(r.warnings.some((w) => w.code === "high_risk_uncertain"));
});

test("every recommendation carries a source and version", () => {
  for (const profile of PROFILES) {
    const r = okResult(evaluateEuTirads({ ...mildHypo, maxDiameterMm: 18 }, profile));
    assert.ok(r.management.source.citation.length > 20);
    assert.ok(r.management.source.version);
    assert.equal(r.classificationSource.id, "EU_TIRADS_2017");
    assert.ok(r.engineVersion);
  }
});

test("EU-TIRADS engine does not import ACR TI-RADS code", () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
    const src = readFileSync(join(dir, file), "utf8");
    const imports = [...src.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
    for (const spec of imports) {
      const external = spec.startsWith("../") || spec.startsWith("@repo/");
      assert.ok(!external || spec.startsWith("node:"), `${file} imports ${spec}`);
    }
  }
});
