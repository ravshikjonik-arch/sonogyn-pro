import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ENGINE_ROUTES } from "../routing";

describe("O-RADS route abstention (TASK 05.4 D3)", () => {
  it("abstention reason never relays the placeholder risk band", () => {
    for (const input of [
      { menopause: "pre", lesionKind: "physiological", physiologicalType: "follicle", lengthMm: 45, widthMm: 38, heightMm: 35 },
      { menopause: "pre", lesionKind: "nonphysiological", structure: "multilocular", solidComponent: true, lengthMm: 80, widthMm: 70, heightMm: 60 },
    ]) {
      const execution = ENGINE_ROUTES.orads_us_pro.execute(input);
      assert.equal(execution.ok, false);
      if (!execution.ok) {
        assert.equal(execution.abstained, true);
        assert.doesNotMatch(execution.reason, /Риск ЗНО|%|Нужны данные для расчёта/);
        assert.match(execution.reason, /could not assess/);
      }
    }
  });
});
