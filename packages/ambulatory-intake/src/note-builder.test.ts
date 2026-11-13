import assert from "node:assert/strict";
import { test } from "node:test";

import { AMBULATORY_INTAKE_SECTIONS, listAllItems } from "./catalog";
import { CLINICAL_SCENARIOS } from "./scenarios";
import { listRegulatoryForRegion } from "./regulatory";
import { buildChartNoteDraft, countMarkedItems } from "./note-builder";
import { createDraftForReasons, createEmptyDraft } from "./schemas";

test("catalog has seven clinical sections with unique item ids", () => {
  assert.equal(AMBULATORY_INTAKE_SECTIONS.length, 7);
  const ids = listAllItems().map((row) => row.item.id);
  assert.ok(ids.length > 40);
  assert.equal(new Set(ids).size, ids.length);
});

test("18+ clinical scenarios exist with unique ids", () => {
  assert.ok(CLINICAL_SCENARIOS.length >= 18);
  const ids = CLINICAL_SCENARIOS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("federal 747н and 404н are VERIFIED; Moscow 797 stays REVIEW_REQUIRED", () => {
  const { federal, regional, regionalConfigured } = listRegulatoryForRegion("RU-MOW");
  assert.ok(federal.length >= 3);
  assert.equal(regionalConfigured, true);
  assert.ok(federal.some((d) => d.id === "rf-mz-747n" && d.status === "VERIFIED"));
  assert.ok(federal.some((d) => d.id === "rf-mz-404n" && d.status === "VERIFIED"));
  assert.ok(regional.some((d) => d.id === "mow-dzm-1830r" && d.status === "PARTIAL"));
  assert.ok(regional.some((d) => d.id === "mow-dzm-797-candidate" && d.status === "REVIEW_REQUIRED"));
});

test("note builder only includes marked items", () => {
  const empty = createEmptyDraft();
  const text = buildChartNoteDraft(empty);
  assert.match(text, /Запись в медицинскую карту/);

  const draft = createDraftForReasons(["bleeding", "primary"]);
  draft.itemStates["h.red_flags"] = { status: "done" };
  draft.labStates["lab.hcg"] = { status: "done" };
  draft.chartFields.complaints = "кровянистые выделения 2 дня";
  const filled = buildChartNoteDraft(draft);
  assert.match(filled, /Кровянистые выделения|Первичный/);
  assert.match(filled, /экстренной помощи/);
  assert.match(filled, /β-ХГЧ|ХГЧ/);
  assert.match(filled, /кровянистые выделения 2 дня/);
  assert.ok(countMarkedItems(draft).done >= 3);
});
