import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { searchClinicalTools } from "./search";

describe("searchClinicalTools", () => {
  it("finds TI-RADS by щитовидка", () => {
    const r = searchClinicalTools("щитовидка узел");
    assert.ok(r.some((x) => x.id === "tirads"));
  });

  it("finds endometrium by кровотечение менопауза", () => {
    const r = searchClinicalTools("кровотечение менопауза");
    assert.ok(r.some((x) => x.id === "endometrium"));
  });

  it("prioritizes role ultrasound for orads", () => {
    const r = searchClinicalTools("яичник", { role: "ultrasound" });
    assert.equal(r[0]?.id, "orads");
  });

  it("finds pregnancy dating calculator by oblcalc alias", () => {
    const r = searchClinicalTools("oblcalc");
    assert.ok(r.some((x) => x.id === "ob-calc"));
    assert.equal(r[0]?.webHref, "/calculators/ob");
  });

  it("finds ga-lmp by пдр", () => {
    const r = searchClinicalTools("пдр");
    assert.ok(r.some((x) => x.id === "ob-calc" || x.id === "ga-lmp"));
  });
});
