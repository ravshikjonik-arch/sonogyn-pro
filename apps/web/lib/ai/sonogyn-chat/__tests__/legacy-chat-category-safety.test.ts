import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  describeTextClaim,
  findTextCategoryClaims,
  NOT_CALCULATED_LABEL,
  reconcileStructuredCategory,
} from "@/lib/ai/sonogyn-chat/clinical-safety";
import { extractStructuredFromAssistantText, STRUCTURED_RESPONSE_JSON_HINT } from "@/lib/ai/sonogyn-chat/structured-response";
import { buildSonogynSystemPrompt } from "@/lib/ai/sonogyn-chat/system-prompt";
import type { ToolExecutionResult } from "@/lib/ai/sonogyn-chat/tools/schemas";

/** Production chat path without tools (D1): a model category is never shown as calculated. Synthetic data only. */

function engineResult(tool: ToolExecutionResult["tool"], result: Record<string, unknown>): ToolExecutionResult {
  return { tool, ok: true, engineVersion: "test", sourceLabel: "test", inputEcho: {}, result };
}

describe("prompt without server tools", () => {
  it("gynecology: forbids categories and requires category null instead of promising tools", () => {
    const { prompt } = buildSonogynSystemPrompt({ domain: "ovary", userText: "O-RADS", hasImages: false });
    assert.match(prompt, /калькуляторы \(движки\) недоступны/);
    assert.match(prompt, /поле category — null/);
    assert.doesNotMatch(prompt, /вызывай только серверные инструменты/);
  });

  it("obstetric: FMF engine declared unavailable", () => {
    const { prompt } = buildSonogynSystemPrompt({ domain: "obstetric", userText: "FMF КТР", hasImages: false });
    assert.match(prompt, /движок FMF недоступен/);
    assert.doesNotMatch(prompt, /вызывай только инструмент assess_fmf_screening/);
  });

  it("with tools attached the existing tool rules are kept unchanged", () => {
    const { prompt } = buildSonogynSystemPrompt({ domain: "ovary", userText: "O-RADS", hasImages: false, toolsAvailable: true });
    assert.match(prompt, /вызывай только серверные инструменты calculate_orads, calculate_birads, calculate_tirads/);
    assert.doesNotMatch(prompt, /недоступны/);
  });

  it("JSON example carries no fixed category", () => {
    assert.doesNotMatch(STRUCTURED_RESPONSE_JSON_HINT, /O-RADS 4/);
    assert.match(STRUCTURED_RESPONSE_JSON_HINT, /"category": null/);
  });
});

describe("sonogyn-json card category", () => {
  it("no engine result → 'Не рассчитано клиническим движком'; model value kept only as a guess", () => {
    for (const [system, category] of [
      ["O-RADS US", "O-RADS 2"],
      ["BI-RADS", "BI-RADS 3"],
      ["TI-RADS", "TI-RADS 4"],
      ["ADNEX", "22%"],
    ] as const) {
      const view = reconcileStructuredCategory({ classification_system: system, category }, []);
      assert.equal(view?.kind, "not_calculated", system);
      if (view?.kind === "not_calculated") {
        assert.equal(view.reason, "no_engine_result");
        assert.equal(view.modelCategory, category);
      }
    }
    assert.equal(NOT_CALCULATED_LABEL, "Не рассчитано клиническим движком");
  });

  it("system inferred from the category text when the model omits it", () => {
    const view = reconcileStructuredCategory({ category: "O-RADS 3" }, []);
    assert.equal(view?.kind, "not_calculated");
    if (view?.kind === "not_calculated") assert.equal(view.system, "O-RADS US");
  });

  it("engine result present → engine label shown; differing model category flagged", () => {
    const tirads = engineResult("calculate_tirads", { category: "TR4" });
    const same = reconcileStructuredCategory({ classification_system: "TI-RADS", category: "TI-RADS 4" }, [tirads]);
    assert.equal(same?.kind === "engine" && same.label, "TR4");
    assert.equal(same?.kind === "engine" && same.mismatch, false);
    const diff = reconcileStructuredCategory({ classification_system: "TI-RADS", category: "TR3" }, [tirads]);
    assert.equal(diff?.kind === "engine" && diff.mismatch, true);
  });

  it("engine call without a result → not calculated", () => {
    const failed: ToolExecutionResult = { tool: "calculate_orads", ok: false, engineVersion: "x", sourceLabel: "x", inputEcho: {}, error: "x" };
    const view = reconcileStructuredCategory({ classification_system: "O-RADS US", category: "O-RADS 4" }, [failed]);
    assert.equal(view?.kind === "not_calculated" && view.reason, "engine_not_completed");
  });

  it("FMF: a model 'category' is never an engine value", () => {
    const view = reconcileStructuredCategory({ classification_system: "FMF", category: "normal" }, []);
    assert.equal(view?.kind, "not_calculated");
  });

  it("model spellings of the system are normalised; null category parses; block removed from text", () => {
    const text = 'Описание.\n```sonogyn-json\n{"classification_system":"BI-RADS US","category":null,"organ":"молочная железа"}\n```';
    const { structured, displayText } = extractStructuredFromAssistantText(text);
    assert.equal(displayText, "Описание.");
    assert.equal(structured?.classification_system, "BI-RADS");
    assert.equal(structured?.category, null);
    const view = reconcileStructuredCategory(structured!, []);
    assert.equal(view?.kind, "not_calculated", "the declared system is shown as not calculated, without a model value");
    assert.equal(view?.modelCategory, undefined);
    assert.equal(reconcileStructuredCategory({ organ: "яичник" }, []), null);
    assert.equal(
      extractStructuredFromAssistantText('```sonogyn-json\n{"classification_system":"ACR TI-RADS"}\n```').structured?.classification_system,
      "TI-RADS",
    );
  });
});

describe("categories written in the answer text", () => {
  it("flags categories with no engine result (legacy path)", () => {
    const claims = findTextCategoryClaims("Заключение: O-RADS 2, BI-RADS 3, TR4.", []);
    assert.deepEqual(
      claims.map((c) => [c.system, c.claim, c.kind]),
      [
        ["O-RADS US", "O-RADS 2", "not_calculated"],
        ["BI-RADS", "BI-RADS 3", "not_calculated"],
        ["TI-RADS", "TR4", "not_calculated"],
      ],
    );
    assert.match(describeTextClaim(claims[0]!), /не рассчитано клиническим движком/);
  });

  it("no warning when the text matches the engine; mismatch otherwise", () => {
    const birads = engineResult("calculate_birads", { category: "BI-RADS 2" });
    assert.deepEqual(findTextCategoryClaims("BI-RADS 2.", [birads]), []);
    assert.equal(findTextCategoryClaims("BI-RADS 4A.", [birads])[0]?.kind, "mismatch");
  });

  it("text without categories → nothing", () => {
    assert.deepEqual(findTextCategoryClaims("Нужны размеры и описание стенки.", []), []);
  });
});
