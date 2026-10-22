import assert from "node:assert/strict";
import test from "node:test";

import { generateCalculatorReport } from "../generate";

/** Тест-кейс из ТЗ: O-RADS 4, солидное ~45 мм, color score 3. */
test("O-RADS 4 solid 45mm color score 3 protocol draft", () => {
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

  assert.match(report.plainText, /O-RADS US:\s*4/i);
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
