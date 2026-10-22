import assert from "node:assert/strict";
import test from "node:test";

import { diffReportParagraphs } from "./paragraph-diff";

test("diffReportParagraphs highlights changed blocks", () => {
  const before = "ПРОТОКОЛ:\n\nУзел 45 мм.\n\nЗАКЛЮЧЕНИЕ:\n\nO-RADS 4.";
  const after = "ПРОТОКОЛ:\n\nОбразование 45 мм.\n\nЗАКЛЮЧЕНИЕ:\n\nO-RADS 4.";
  const diff = diffReportParagraphs(before, after);
  assert.ok(diff.some((r) => r.status === "changed"));
});
