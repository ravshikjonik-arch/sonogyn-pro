import assert from "node:assert/strict";
import test from "node:test";

import { inferOrganFromText, isHemorrhagicCystText } from "./inferOrganFromText";

test("detects ovarian hemorrhagic cyst text as ovary", () => {
  assert.equal(inferOrganFromText("Геморрагическая киста правого яичника, O-RADS 2"), "ovary");
  assert.equal(isHemorrhagicCystText("Геморрагическая киста 32 мм"), true);
});

test("detects common organ-specific ultrasound descriptions", () => {
  assert.equal(inferOrganFromText("Фиброаденома молочной железы BI-RADS 3"), "breast");
  assert.equal(inferOrganFromText("Миома матки FIGO 5 по передней стенке"), "uterus");
  assert.equal(inferOrganFromText("Реактивный лимфоузел без подозрительных признаков"), "lymph");
});

test("does not guess when text is empty or conflicting", () => {
  assert.equal(inferOrganFromText(""), null);
  assert.equal(inferOrganFromText("молочная железа, матка"), null);
});
