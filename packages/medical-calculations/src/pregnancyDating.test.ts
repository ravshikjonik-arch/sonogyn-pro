import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  datingFromCrlAndUsDate,
  datingFromGaAtStudy,
  formatGaTodayLabel,
  lmpEstimateFromGaAtStudy,
} from "./pregnancyDating";

describe("pregnancyDating from study", () => {
  it("CRL 45.5 mm on 2020-06-26 → ПМП 2020-04-11, ПДР 2021-01-16", () => {
    const us = new Date(2020, 5, 26);
    const d = datingFromCrlAndUsDate(us, 45.5, us)!;
    assert.equal(d.lmpEstimate.toISOString().slice(0, 10), "2020-04-10"); // local TZ may be -1 day in ISO
    assert.equal(d.lmpEstimate.getFullYear(), 2020);
    assert.equal(d.lmpEstimate.getMonth(), 3);
    assert.equal(d.lmpEstimate.getDate(), 11);
    assert.equal(d.edd.getFullYear(), 2021);
    assert.equal(d.edd.getMonth(), 0);
    assert.equal(d.edd.getDate(), 16);
    assert.equal(d.gaAtStudyDays, 76);
  });

  it("does not show 300+ weeks when ПДР long passed", () => {
    const us = new Date(2020, 5, 26);
    const ref = new Date(2026, 5, 20);
    const d = datingFromCrlAndUsDate(us, 45.5, ref)!;
    assert.equal(d.status, "completed");
    const label = formatGaTodayLabel(d);
    assert.match(label.line, /ПДР прошла/);
    assert.ok(d.gaAtReferenceDays < 100);
  });

  it("ПМП = дата УЗИ − срок на исследование", () => {
    const us = new Date(2025, 3, 15);
    const lmp = lmpEstimateFromGaAtStudy(us, 84);
    assert.equal(lmp.getFullYear(), 2025);
    assert.equal(lmp.getMonth(), 0);
    assert.equal(lmp.getDate(), 21);
  });

  it("ongoing pregnancy extrapolates GA to today", () => {
    const us = new Date(2026, 5, 1);
    const ref = new Date(2026, 5, 20);
    const d = datingFromGaAtStudy(us, 70, ref);
    assert.equal(d.status, "ongoing");
    assert.equal(d.gaAtReferenceDays, 70 + 19);
  });
});
