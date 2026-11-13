import assert from "node:assert/strict";
import test from "node:test";

import { assistFromFreeText } from "./nlp-assist";
import { mergeParsedBiradsInput, presetForPathology } from "./merge-input";

test("assistFromFreeText: fibroadenoma pattern → BI-RADS 3", () => {
  const text =
    "Овальное гипоэхогенное образование 12×8 мм, параллельное, чёткие контуры, усиление сзади";
  const result = assistFromFreeText(text);
  assert.match(result.report.engine.category, /BI-RADS 3/i);
  assert.equal(result.parsedInput.shape, "oval");
  assert.equal(result.parsedInput.echoPattern, "hypoechoic");
  assert.equal(result.parsedInput.margin, "circumscribed");
  assert.match(result.parsedInput.localizationText ?? "", /12,0×8,0 мм/);
});

test("AI assist never states a diagnosis", () => {
  for (const text of [
    "Овальное гипоэхогенное образование 12×8 мм, параллельное, чёткие контуры",
    "Фиброаденома 10 мм",
    "Простая киста, анэхогенная, чёткий контур",
    "Рак молочной железы, неправильная форма, спикулы",
  ]) {
    assert.doesNotMatch(assistFromFreeText(text).suggestedDiagnosis, /вероятн|фиброаденом|рак|карцином/i, text);
  }
});

test("the word 'киста' alone does not make a simple cyst (category 2)", () => {
  const r = assistFromFreeText("Осложнённая киста 8 мм с внутренними эхосигналами");
  assert.notEqual(r.parsedInput.specialCase, "simple_cyst");
  assert.ok(r.detectedKeywords.some((k) => /уточните тип/.test(k)));
  assert.equal(assistFromFreeText("Простая киста 6 мм").parsedInput.specialCase, "simple_cyst");
});

test("vascularity and posterior wording are not misread", () => {
  assert.equal(assistFromFreeText("Кровоток не определяется").parsedInput.vascularity, "none");
  const flow = assistFromFreeText("Усиленный кровоток по периферии");
  assert.equal(flow.parsedInput.vascularity, "marked");
  assert.notEqual(flow.parsedInput.posteriorFeatures, "enhancement");
  assert.equal(assistFromFreeText("Дорсальное усиление").parsedInput.posteriorFeatures, "enhancement");
});

test("descriptors not found in the text are reported", () => {
  const r = assistFromFreeText("Гипоэхогенное образование 9×7 мм");
  assert.deepEqual(r.missingFeatures, ["форма", "ориентация", "контур", "задние акустические признаки"]);
  assert.match(r.suggestedDiagnosis, /Не распознаны/);
});

test("presetForPathology: simple cyst", () => {
  const preset = presetForPathology("simple_cyst");
  assert.ok(preset);
  const merged = mergeParsedBiradsInput(preset!);
  assert.equal(merged.specialCase, "simple_cyst");
  assert.equal(merged.echoPattern, "anechoic");
});
