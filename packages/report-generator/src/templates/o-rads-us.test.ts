import assert from "node:assert/strict";
import test from "node:test";

import { generateCalculatorReport } from "../generate";

/** Солидное ~45 мм, неровный наружный контур, color score 3 → O-RADS 5 по v2022 (сверено врачом 10.11.2026). */
test("O-RADS 5 solid irregular 45mm color score 3 protocol draft", () => {
  const report = generateCalculatorReport({
    toolId: "o-rads-us",
    inputs: {
      localization: "ovarian",
      menopause: "post",
      lesionKind: "nonphysiological",
      structure: "solid",
      solidComponent: true,
      solidType: "irregular",
      lengthMm: 45,
      widthMm: 40,
      heightMm: 38,
      iotaColorScore: "3",
      bloodFlow: "moderate",
      ascites: false,
    },
    outputs: {},
    timestamp: new Date(0).toISOString(),
  });

  assert.match(report.plainText, /O-RADS US:\s*5/i);
  assert.match(report.plainText, /45\s*мм/);
  assert.match(report.plainText, /color score 3/i);
  assert.match(report.plainText, /солидн/i);
  assert.ok(!/диагноз/i.test(report.plainText));
  assert.ok(report.plainText.includes("SonoGyn Pro"));
});

test("O-RADS protocol includes ovary side when provided", () => {
  const report = generateCalculatorReport({
    toolId: "o-rads-us",
    inputs: {
      localization: "ovarian",
      ovarySide: "left",
      menopause: "post",
      lesionKind: "nonphysiological",
      structure: "unilocular",
      solidComponent: false,
      lengthMm: 32,
    },
    outputs: {},
    timestamp: new Date(0).toISOString(),
  });
  assert.match(report.plainText, /левый яичник/i);
});
