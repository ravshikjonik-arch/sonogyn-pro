import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildDifferentialDiagnosis } from "./differentialDiagnosis";

describe("buildDifferentialDiagnosis — brain midline", () => {
  it("returns ACC, HPE, SOD for ventriculomegaly + absent CSP", () => {
    const result = buildDifferentialDiagnosis({
      gestationalAge: { weeks: 22 },
      findings: [
        "Вентрикуломегалия 13 мм",
        "Отсутствует cavum septi pellucidi",
      ],
      biometricData: { lateralVentricleMm: 13 },
    });

    assert.ok(result.length >= 3, "expected at least 3 diagnoses");

    const ids = result.map((r) => r.pathologyId);
    assert.ok(ids.includes("agenesis-dysgenesis-of-the-corpus-callosum"));
    assert.ok(ids.includes("lobar-holoprosencephaly"));
    assert.ok(ids.includes("septo-optic-dysplasia"));

    const acc = result.find((r) => r.pathologyId === "agenesis-dysgenesis-of-the-corpus-callosum");
    assert.ok(acc);
    assert.ok(acc!.confidence > 0.7);
    assert.equal(acc!.diagnosis, "Агенезия/дисгенез мозолистого тела");
    assert.ok(acc!.nextSteps.some((s) => /МРТ|кариотип/i.test(s)));
  });

  it("boosts ACC when agenesis CC explicitly stated", () => {
    const result = buildDifferentialDiagnosis({
      findings: ["Агенезия мозолистого тела", "Нет CSP"],
    });
    const acc = result[0];
    assert.equal(acc.pathologyId, "agenesis-dysgenesis-of-the-corpus-callosum");
    assert.ok(acc.confidence >= 0.85);
  });
});

describe("buildDifferentialDiagnosis — empty", () => {
  it("returns empty array for no findings", () => {
    const result = buildDifferentialDiagnosis({ findings: [] });
    assert.deepEqual(result, []);
  });
});
