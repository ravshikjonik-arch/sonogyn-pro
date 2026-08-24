import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assessPatientPhiPayload } from "../patient-phi-guard";

describe("assessPatientPhiPayload", () => {
  it("allows anonymized case label", () => {
    assert.equal(assessPatientPhiPayload({ display_label: "O-RADS 4 слева" }).ok, true);
  });

  it("rejects SNILS in meta", () => {
    const result = assessPatientPhiPayload({
      display_label: "Кейс #1",
      meta: { snils: "12345678901" },
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.reasons.some((r) => r.includes("snils")));
  });

  it("rejects external card ref", () => {
    const result = assessPatientPhiPayload({
      display_label: "Кейс #2",
      external_ref: "KART-2026-001",
    });
    assert.equal(result.ok, false);
  });

  it("rejects triple-name FIO in label", () => {
    const result = assessPatientPhiPayload({
      display_label: "Иванова Мария Петровна",
    });
    assert.equal(result.ok, false);
  });
});
