import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fmfScreening } from "./fmfScreening";

const f = (p: number) => `1 : ${Math.round(1 / p).toLocaleString("ru-RU")}`;

describe("fmfScreening (учебный)", () => {
  it("низкий риск: 33 года, NT 1.8, NB+, DV норма, TR-, биохимия 1.0/1.0", () => {
    const r = fmfScreening({
      ageYears: 33,
      gestationalWeeks: 12,
      ntMm: 1.8,
      nasalBone: "present",
      ductusVenosusAWave: "normal",
      tricuspidRegurgitation: false,
      freeBetaHcgMom: 1.0,
      pappaMom: 1.0,
    });
    assert.equal(r.priorT21, "1 : 359");
    assert.equal(r.finalT21, "1 : 6000");    assert.equal(r.risks[0]!.category, "low");
    assert.equal(r.chain.length, 6);
    assert.equal(r.redFlags.length, 0);
  });

  it("высокий риск: 38 лет, NT 4.0 → NT_HIGH флаг", () => {
    const r = fmfScreening({ ageYears: 38, gestationalWeeks: 12, ntMm: 4.0 });
    assert.equal(r.priorT21, "1 : 175");
    assert.equal(r.finalT21, "1 : 10");
    assert.equal(r.risks[0]!.category, "high");
    assert.ok(r.redFlags.some((x) => x.code === "NT_HIGH"));
  });

  it("NT ≥5.5 мм даёт NT_SEVERE, не NT_HIGH", () => {
    const r = fmfScreening({ ageYears: 30, gestationalWeeks: 12, ntMm: 6.0 });
    assert.ok(r.redFlags.some((x) => x.code === "NT_SEVERE"));
    assert.ok(!r.redFlags.some((x) => x.code === "NT_HIGH"));
  });

  it("полный высоконадёжный набор ограничивается сверху (clamping)", () => {
    const r = fmfScreening({
      ageYears: 36,
      gestationalWeeks: 12,
      ntMm: 4.2,
      nasalBone: "absent",
      ductusVenosusAWave: "reversed",
      tricuspidRegurgitation: true,
      freeBetaHcgMom: 2.2,
      pappaMom: 0.4,
    });
    assert.ok(r.risks[0]!.probability <= 0.9);
    assert.equal(r.finalT21, ">1:2");
    assert.ok(r.redFlags.length >= 4);
  });

  it("низкий PAPP-A добавляет PAPPA_LOW", () => {
    const r = fmfScreening({ ageYears: 28, gestationalWeeks: 12, pappaMom: 0.35 });
    assert.ok(r.redFlags.some((x) => x.code === "PAPPA_LOW"));
  });

  it("априорный риск интерполируется между возрастами", () => {
    const r34 = fmfScreening({ ageYears: 34, gestationalWeeks: 12 });
    const r35 = fmfScreening({ ageYears: 35, gestationalWeeks: 12 });
    assert.equal(r34.priorT21, "1 : 318");
    assert.equal(r35.priorT21, "1 : 279");
  });

  it("T18/T13 помечены как учебный ориентир", () => {
    const r = fmfScreening({ ageYears: 30, gestationalWeeks: 12, ntMm: 2.0 });
    assert.equal(r.risks[1]!.trisomy, "T18");
    assert.equal(r.risks[1]!.approximate, true);
    assert.equal(r.risks[2]!.trisomy, "T13");
    assert.equal(r.risks[2]!.approximate, true);
  });

  it("дисклеймер присутствует всегда", () => {
    const r = fmfScreening({ ageYears: 25, gestationalWeeks: 11 });
    assert.match(r.disclaimer, /Учебный расчёт/);
    assert.match(r.disclaimer, /решение за врачом/);
  });
});
