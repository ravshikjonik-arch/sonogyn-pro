import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cerebroplacentalRatio, datingFromCrl, ntReference } from "./fmfAssessment";

describe("fmfAssessment · datingFromCrl (Robinson & Fleming 1975 / LOINC 11914-9)", () => {
  it("CRL 30 → 9+5 (по опубликованной таблице 9.69 недель)", () => {
    const r = datingFromCrl(30);
    assert.equal(r.days, 68);
    assert.equal(r.display, "9+5");
    assert.ok(r.valid);
  });

  it("CRL 45 → 11+1, CRL 60 → 12+3, CRL 84 → 14+0 (граница окна)", () => {
    assert.equal(datingFromCrl(45).days, 78);
    assert.equal(datingFromCrl(60).days, 86);
    const r84 = datingFromCrl(84);
    assert.equal(r84.days, 98);
    assert.equal(r84.display, "14+0");
  });

  it("вне диапазона 5–84 мм — invalid с пояснением", () => {
    assert.equal(datingFromCrl(3).valid, false);
    assert.equal(datingFromCrl(90).valid, false);
    assert.match(datingFromCrl(90).note, /неприменим/);
  });
});

describe("fmfAssessment · ntReference (Wright 2008, калибровка)", () => {
  it("median NT на CRL 60 ≈ 1.65 мм (якорь Wright 2008: 1.6466)", () => {
    const r = ntReference(60);
    assert.ok(r.medianMm > 1.6 && r.medianMm < 1.75, `median=${r.medianMm}`);
    assert.equal(r.extrapolated, false);
  });

  it("центили воспроизводят опубликованные QC-диапазоны (5th ~1.0–1.2, 95th ~2.0–2.4 в середине окна)", () => {
    const r = ntReference(55);
    assert.ok(r.p5Mm > 0.95 && r.p5Mm < 1.3, `p5=${r.p5Mm}`);
    assert.ok(r.p95Mm > 1.85 && r.p95Mm < 2.45, `p95=${r.p95Mm}`);
    assert.ok(r.p99Mm > r.p95Mm);
  });

  it("MoM и z-score измеренной NT: 2.5 мм при CRL 60 ≈ 1.5 MoM (Wright: 1.518)", () => {
    const r = ntReference(60, 2.5);
    assert.ok(r.mom! > 1.4 && r.mom! < 1.6, `mom=${r.mom}`);
    // z в log10-пространстве: log10(MoM)/σ ≈ log10(1.48)/0.08412 ≈ 2.0
    assert.ok(r.zScore! > 1.9 && r.zScore! < 2.3, `z=${r.zScore}`);
  });

  it("CRL > 70 мм помечается как экстраполяция", () => {
    const r = ntReference(84);
    assert.equal(r.extrapolated, true);
    assert.match(r.note, /экстраполяция/);
  });

  it("NT 3.5 мм при CRL 60 — z-score заметно выше 99-го центиля эуплоидов", () => {
    const r = ntReference(60, 3.5);
    assert.ok(r.zScore! > 2.326, `z=${r.zScore}`);
    assert.ok(r.mom! > 2);
  });
});

describe("fmfAssessment · cerebroplacentalRatio", () => {
  it("CPR = MCA/UA PI: арифметика и бэнды", () => {
    assert.equal(cerebroplacentalRatio(1.0, 1.2).value, 1.2);
    assert.equal(cerebroplacentalRatio(1.0, 1.2).band, "normal");
    assert.equal(cerebroplacentalRatio(1.2, 1.0).band, "borderline");
    assert.equal(cerebroplacentalRatio(1.5, 1.0).band, "reduced");
    assert.equal(cerebroplacentalRatio(1.8, 1.0).band, "severely_reduced");
  });

  it("интерпретация содержит пороги", () => {
    assert.match(cerebroplacentalRatio(1.0, 0.9).interpretation, /пограничн/);
    assert.match(cerebroplacentalRatio(1.0, 0.5).interpretation, /brain-sparing/);
  });
});
