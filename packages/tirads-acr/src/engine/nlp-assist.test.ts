import assert from "node:assert/strict";
import test from "node:test";

import { assistFromTiradsText, assistFromTiradsTextSafe } from "./nlp-assist";

test("AI assist never states a diagnosis", () => {
  for (const text of [
    "Папиллярный рак щитовидной железы, узел 12 мм",
    "PTC, солидный гипоэхогенный узел",
    "Коллоидный узел, губчатый",
    "Солидный очень гипоэхогенный узел, taller-than-wide, микрокальцинаты, неровные контуры, 11 мм",
  ]) {
    const r = assistFromTiradsText(text);
    assert.doesNotMatch(r.suggestedDiagnosis, /вероятн|рак|карцином/i, text);
  }
  assert.doesNotMatch(assistFromTiradsTextSafe("").suggestedDiagnosis, /вероятн|рак/i);
});

test("a diagnosis word does not inject a feature preset", () => {
  const withWord = assistFromTiradsText("Узел с папиллярными структурами, солидный, изоэхогенный, 14 мм");
  const withoutWord = assistFromTiradsText("Узел, солидный, изоэхогенный, 14 мм");
  assert.deepEqual(withWord.parsedInput, withoutWord.parsedInput);
  assert.equal(withWord.parsedInput.patternId, undefined);
  assert.ok(withWord.detectedKeywords.some((k) => /на расчёт не влияет/.test(k)));
});

test("features not found in the text are reported for the doctor", () => {
  const r = assistFromTiradsText("Солидный узел 12 мм");
  assert.deepEqual(r.missingFeatures, ["эхогенность", "форма", "контуры", "эхогенные включения"]);
  assert.match(r.suggestedDiagnosis, /Не распознаны/);
  assert.deepEqual(assistFromTiradsText("Губчатый узел").missingFeatures, []);
});
