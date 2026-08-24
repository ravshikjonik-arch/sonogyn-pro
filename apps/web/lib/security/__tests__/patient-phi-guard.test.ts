import { describe, expect, it } from "vitest";

import { assessPatientPhiPayload } from "../patient-phi-guard";

describe("assessPatientPhiPayload", () => {
  it("allows anonymized case label", () => {
    expect(assessPatientPhiPayload({ display_label: "O-RADS 4 слева" }).ok).toBe(true);
  });

  it("rejects SNILS in meta", () => {
    const result = assessPatientPhiPayload({
      display_label: "Кейс #1",
      meta: { snils: "12345678901" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.some((r) => r.includes("snils"))).toBe(true);
  });

  it("rejects external card ref", () => {
    const result = assessPatientPhiPayload({
      display_label: "Кейс #2",
      external_ref: "KART-2026-001",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects triple-name FIO in label", () => {
    const result = assessPatientPhiPayload({
      display_label: "Иванова Мария Петровна",
    });
    expect(result.ok).toBe(false);
  });
});
