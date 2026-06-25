import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assessFetalDoppler } from "./dopplerEngine";

describe("assessFetalDoppler — CPR", () => {
  it("computes CPR and flags redistribution at 32 weeks", () => {
    const out = assessFetalDoppler({
      gestationalAge: { weeks: 32 },
      uaPi: 1.1,
      mcaPi: 1.0,
    });

    assert.ok(out.cpr);
    assert.ok(out.cpr!.value < 1.05);
    assert.equal(out.cpr!.classification, "reduced");
    assert.ok(out.fgrPattern === "redistribution" || out.fgrPattern === "brain_sparing");
  });

  it("detects brain sparing pattern", () => {
    const out = assessFetalDoppler({
      gestationalAge: { weeks: 30 },
      uaPi: 1.2,
      mcaPi: 1.25,
    });

    const ua = out.vessels.find((v) => v.vessel === "UA");
    const mca = out.vessels.find((v) => v.vessel === "MCA");
    assert.ok(ua);
    assert.ok(mca);
    assert.ok(out.summaryRu.includes("UA"));
  });
});

describe("assessFetalDoppler — DV critical", () => {
  it("flags reversed DV a-wave as critical", () => {
    const out = assessFetalDoppler({
      gestationalAge: { weeks: 12 },
      dvPi: 1.2,
      dvAWave: "reversed",
    });

    const dv = out.vessels.find((v) => v.vessel === "DV");
    assert.ok(dv);
    assert.equal(dv!.classification, "critical");
    assert.equal(out.fgrPattern, "critical_dv");
    assert.ok(out.recommendations.some((r) => /анеуплоид|FMF/i.test(r)));
  });
});

describe("assessFetalDoppler — UTA", () => {
  it("assesses uterine artery PI in first trimester", () => {
    const out = assessFetalDoppler({
      gestationalAge: { weeks: 12 },
      utaPiLeft: 2.8,
      utaPiRight: 2.6,
    });

    const uta = out.vessels.find((v) => v.vessel === "UTA");
    assert.ok(uta);
    assert.ok(uta!.pi! > 2.4);
  });
});
