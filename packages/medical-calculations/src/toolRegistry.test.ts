import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildContract,
  getTool,
  listToolIds,
  registerTool,
  runTool,
} from "./toolRegistry.js";
import { STANDARD_DISCLAIMER } from "./toolContract.js";
import type { ToolDefinition } from "./toolContract.js";

describe("toolRegistry: ядро клинического мозга", () => {
  it("в реестре ≥7 уникальных инструментов", () => {
    const ids = listToolIds();
    assert.ok(ids.length >= 7, `ожидали ≥7, получили ${ids.length}`);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("каждый инструмент: слоты, цитаты, дисклеймер", () => {
    for (const id of listToolIds()) {
      const t = getTool(id)!;
      assert.ok(t.slots.length > 0, id);
      const out = t.run({});
      // запуск с пустыми слотами может вернуть null (efw) — но не выбросить ошибку
      if (out) {
        assert.equal(out.ok, true, id);
        assert.ok(out.citations.length >= 1, id);
        for (const c of out.citations) {
          assert.ok(c.organization && c.document && c.year > 1900 && c.status, `${id}: citation поля`);
        }
        assert.ok(out.disclaimer.includes("решение за врачом"), id);
      }
    }
  });

  it("dating_crl: КТР 63 → валидный срок, цепочка и атрибуция LOINC/FMF", () => {
    const out = runTool("obstetrics_dating_crl", { crlMm: 63 });
    assert.equal(out.ok, true);
    if (out.ok) {
      assert.ok((out.result.days as number) > 0);
      assert.equal(out.result.valid, true);
      assert.ok(out.chain![0].includes("8.052"));
      assert.equal(out.citations[0].organization, "LOINC");
    }
  });

  it("nt_reference: CRL 60, NT 2.5 → MoM ≈ 1.518 (Wright 2008)", () => {
    const out = runTool("obstetrics_nt_reference", { crlMm: 60, ntMm: 2.5 });
    assert.equal(out.ok, true);
    if (out.ok) {
      const mom = out.result.mom as number;
      assert.ok(Math.abs(mom - 1.518) < 0.05, `MoM=${mom}, ожидали ≈1.518`);
    }
  });

  it("cpr: UA 1.4 / MCA 0.95 → 0.679, бэнд reduced", () => {
    const out = runTool("obstetrics_cpr", { uaPi: 1.4, mcaPi: 0.95 });
    assert.equal(out.ok, true);
    if (out.ok) {
      assert.ok(Math.abs((out.result.value as number) - 0.679) < 0.01);
      assert.equal(out.result.band, "reduced");
    }
  });

  it("fmf_screening: полный ввод → 3 риска, цепочка, redFlags массив", () => {
    const out = runTool("obstetrics_fmf_screening", {
      ageYears: 33,
      gestationalWeeks: 12.5,
      ntMm: 1.8,
      fetalHeartRateBpm: 152,
      nasalBone: "present",
      ductusVenosusAWave: "normal",
      tricuspidRegurgitation: false,
      freeBetaHcgMom: 1.4,
      pappaMom: 0.92,
    });
    assert.equal(out.ok, true);
    if (out.ok) {
      const risks = out.result.risks as Array<{ probability: number; display: string; category: string }>;
      assert.equal(risks.length, 3);
      assert.ok(risks.every((r) => r.probability > 0 && typeof r.display === "string"));
      assert.ok("finalT21" in out.result);
      assert.ok(Array.isArray(out.result.chain));
      assert.ok(Array.isArray(out.redFlags));
    }
  });

  it("fmf_screening: не хватает слотов → missingSlots, модель переспрашивает", () => {
    const out = runTool("obstetrics_fmf_screening", { ageYears: 33, ntMm: 1.8 });
    assert.equal(out.ok, false);
    if (!out.ok) {
      assert.equal(out.error, "missing_slots");
      assert.ok(out.missingSlots!.includes("pappaMom"));
    }
  });

  it("bishop: 5 баллов признаков → сумма и интерпретация", () => {
    const out = runTool("obstetrics_bishop_score", {
      dilation: 1, effacement: 1, station: 1, consistency: 1, position: 1,
    });
    assert.equal(out.ok, true);
    if (out.ok) {
      assert.equal(out.result.total, 5);
      assert.ok(typeof out.result.interpretation === "string");
    }
  });

  it("bishop: неверный enum → wrong_slot_type", () => {
    const out = runTool("obstetrics_bishop_score", {
      dilation: 9, effacement: 1, station: 1, consistency: 1, position: 1,
    });
    assert.equal(out.ok, false);
    if (!out.ok) assert.equal(out.error, "wrong_slot_type");
  });

  it("vbac_pre: все предикторы true → допуск TOLAC, score=max", () => {
    const input = Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [`k${i}`, true]),
    );
    const out = runTool("obstetrics_vbac_pre", {
      singleLtcs: true,
      nonRecurringIndication: true,
      priorVaginalBirth: true,
      interval18Months: true,
      noMacrosomiaSuspected: true,
      cephalicSingleton: true,
      noPlacentaPrevia: true,
      noClassicalScar: true,
      noUterineRuptureHistory: true,
      continuousMonitoringAvailable: true,
    });
    assert.equal(out.ok, true);
    if (out.ok) {
      assert.equal(out.result.tolacEligible, true);
      assert.equal(out.result.score, out.result.maxScore);
    }
    void input;
  });

  it("efw_hadlock: полная биометрия → граммовка; пустой ввод → insufficient_slots", () => {
    const ok = runTool("obstetrics_efw_hadlock", { bpdMm: 90, hcMm: 320, acMm: 300, flMm: 68 });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      const g = ok.result.grams as number;
      assert.ok(g > 1500 && g < 6000, `grams=${g}`);
    }
    const bad = runTool("obstetrics_efw_hadlock", {});
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.equal(bad.error, "insufficient_slots");
  });

  it("buildContract: единая форма ответа + дисклеймер всегда", () => {
    const c = buildContract(runTool("obstetrics_cpr", { uaPi: 1.0, mcaPi: 1.1 }), {
      tool: "obstetrics_cpr",
      slots: { uaPi: 1.0, mcaPi: 1.1 },
    });
    assert.equal(c.intent, "calculate");
    assert.equal(c.tool, "obstetrics_cpr");
    assert.ok(c.citations.length >= 1);
    assert.equal(c.disclaimer, STANDARD_DISCLAIMER);
    const fail = buildContract(runTool("obstetrics_cpr", {}));
    assert.ok(fail.missingSlots && fail.missingSlots.length >= 1);
    assert.equal(fail.notes, undefined);
    assert.equal(fail.disclaimer, STANDARD_DISCLAIMER);
  });

  it("registerTool: расширение новой нозологией без правки ядра", () => {
    const custom: ToolDefinition = {
      id: "test_custom_tool",
      nosology: "adnexa",
      title: "Тестовый инструмент придатков",
      keywords: ["тест"],
      slots: [{ name: "x", type: "number", required: true, description: "x" }],
      run: (s) => ({
        ok: true,
        result: { double: (s.x as number) * 2 },
        citations: [{ organization: "Demo", document: "demo doc", year: 2026, status: "test" }],
        disclaimer: STANDARD_DISCLAIMER,
      }),
    };
    registerTool(custom);
    const out = runTool("test_custom_tool", { x: 21 });
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.result.double, 42);
    assert.throws(() => registerTool(custom), /already registered/);
  });

  it("unknown tool → unknown_tool", () => {
    const out = runTool("no_such_tool", {});
    assert.equal(out.ok, false);
    if (!out.ok) assert.equal(out.error, "unknown_tool");
  });
});
