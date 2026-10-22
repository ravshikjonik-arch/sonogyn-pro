import assert from "node:assert/strict";
import test from "node:test";

import { generateCalculatorReport, REPORT_GENERATOR_DISCLAIMER_RU } from "./index";
const TS = new Date(0).toISOString();

const CANONICAL_TOOL_IDS = [
  "bishop",
  "vbac",
  "fetal-weight",
  "o-rads-us",
  "iota-adnex",
  "bi-rads-us",
  "ti-rads",
  "figo-myoma",
  "fmf-preeclampsia",
] as const;

const MIN_PAYLOADS: Record<string, { inputs: Record<string, unknown>; outputs?: Record<string, unknown> }> = {
  bishop: { inputs: { dilation: 2, effacement: 2, station: 1, consistency: 1, position: 1 } },
  vbac: { inputs: { mode: "pre", singleLtcs: true, nonRecurringIndication: true } },
  "fetal-weight": { inputs: { tab: "hadlock", bpd: "90", hc: "300", ac: "280", fl: "65" } },
  "o-rads-us": {
    inputs: {
      localization: "ovarian",
      ovarySide: "right",
      menopause: "post",
      lesionKind: "nonphysiological",
      structure: "solid",
      solidComponent: true,
      lengthMm: 45,
      iotaColorScore: "3",
    },
  },
  "iota-adnex": {
    inputs: {
      ageYears: 55,
      maxDiameterMm: 80,
      maxSolidMm: 20,
      benignFeatures: [],
      malignantFeatures: ["M1"],
    },
  },
  "bi-rads-us": {
    inputs: {
      gtcAmount: "heterogeneous",
      biradsCategoryManual: "4A",
      localizationText: "верхний наружный квадрант справа",
    },
  },
  "ti-rads": {
    inputs: {
      composition: "solid_or_almost_solid",
      echogenicity: "hypoechoic",
      shape: "taller_than_wide",
      margin: "lobulated",
      echogenicFoci: ["none_or_comet_tail"],
      largestDiameterMm: 12,
      lymphNodes: "not_assessed",
    },
  },
  "figo-myoma": { inputs: { figoType: 4, localizationRu: "передняя стенка", sizeLine: "40×35×30 mm" } },
  "fmf-preeclampsia": {
    inputs: { gaWeeks: 12, sbp: 120, dbp: 70 },
    outputs: { earlyPeRisk: "низкий (assistive)", termPeRisk: "низкий (assistive)" },
  },
};

test("every registered tool renders disclaimer and no VERIFY in plainText", () => {
  for (const toolId of CANONICAL_TOOL_IDS) {
    const sample = MIN_PAYLOADS[toolId];
    assert.ok(sample, `missing MIN_PAYLOADS for ${toolId}`);
    const report = generateCalculatorReport({
      toolId,
      inputs: sample.inputs,
      outputs: sample.outputs ?? {},
      timestamp: TS,
    });
    assert.ok(report.plainText.length > 40, `${toolId}: empty plainText`);
    assert.ok(report.plainText.includes(REPORT_GENERATOR_DISCLAIMER_RU), `${toolId}: disclaimer`);
    assert.ok(!/диагноз/i.test(report.plainText), `${toolId}: forbidden word`);
    assert.ok(!/VERIFY/i.test(report.plainText), `${toolId}: VERIFY leak in output`);
  }
});
