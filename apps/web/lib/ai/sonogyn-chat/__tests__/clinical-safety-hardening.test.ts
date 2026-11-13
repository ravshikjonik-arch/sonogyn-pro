import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { calculateAdnex, calculateLr2, calculateSimpleRulesRisk } from "@repo/iota-models";
import { calculateORADS, type OradsInput } from "@repo/orads-us/pro";

import { aiSdkFlagState } from "@/lib/ai/sdk/flags";
import {
  findTextCategoryClaims,
  NOT_CALCULATED_LABEL,
  reconcileStructuredCategory,
} from "@/lib/ai/sonogyn-chat/clinical-safety";
import { extractStructuredFromAssistantText, STRUCTURED_RESPONSE_JSON_HINT } from "@/lib/ai/sonogyn-chat/structured-response";
import { buildSonogynSystemPrompt } from "@/lib/ai/sonogyn-chat/system-prompt";
import { buildToolCompletionNotice } from "@/lib/ai/sonogyn-chat/tool-results";
import { createChatToolSession, toChatToolOutput } from "@/lib/ai/sonogyn-chat/tools/chat-tool-session";
import { confirmClinicalToolInputs, ConfirmToolRequestSchema } from "@/lib/ai/sonogyn-chat/tools/confirm";
import { executeClinicalTool } from "@/lib/ai/sonogyn-chat/tools/execute";
import type { ToolExecutionResult } from "@/lib/ai/sonogyn-chat/tools/schemas";

/** Synthetic descriptors only — no patient data. */
const json = (v: unknown) => JSON.parse(JSON.stringify(v)) as Record<string, unknown>;

const ORADS_3: OradsInput = {
  menopause: "pre",
  lesionKind: "nonphysiological",
  structure: "unilocular",
  solidComponent: false,
  solidType: "smooth",
  acousticShadows: false,
  ascites: false,
  peritonealNodules: false,
  lengthMm: 110,
  widthMm: 85,
  heightMm: 70,
};
const ORADS_FIELDS = Object.keys(ORADS_3);

const ADNEX = {
  ageYears: 50,
  oncologyCenter: false,
  maxDiameterMm: 60,
  maxSolidDiameterMm: 20,
  moreThan10Locules: false,
  papillaryCount: 1 as const,
  acousticShadows: false,
  ascites: false,
};

const TIRADS = {
  composition: "solid",
  echogenicity: "hypoechoic",
  shape: "wider_than_tall",
  margin: "smooth",
  echogenicFoci: ["none_or_comet_tail"],
  largestDiameterMm: 18,
  lymphNodes: "benign",
};

describe("D3 — O-RADS refusal never carries a placeholder risk", () => {
  it("generic insufficient-data branch: no 'Риск ЗНО' band in the refusal", () => {
    const out = executeClinicalTool("calculate_orads", {
      menopause: "pre",
      lesionKind: "physiological",
      physiologicalType: "follicle",
      structure: "unilocular",
      lengthMm: 45,
      widthMm: 38,
      heightMm: 35,
    });
    assert.equal(calculateORADS({ menopause: "pre", lesionKind: "physiological", physiologicalType: "follicle", lengthMm: 45, widthMm: 38, heightMm: 35 }).riskText, "Риск ЗНО 1–10%");
    assert.equal(out.ok, false);
    assert.doesNotMatch(out.error ?? "", /Риск ЗНО|%/);
    assert.match(out.error ?? "", /не определена/);
  });

  it("grid 'needs data' branch: no fictitious risk either", () => {
    const out = executeClinicalTool("calculate_orads", {
      menopause: "pre",
      lesionKind: "nonphysiological",
      structure: "multilocular",
      solidComponent: true,
      lengthMm: 80,
      widthMm: 70,
      heightMm: 60,
    });
    assert.equal(out.ok, false);
    assert.doesNotMatch(out.error ?? "", /Риск ЗНО|%|Нужны данные для расчёта/);
  });
});

describe("D2 — input provenance and physician review gate", () => {
  it("every input is listed with its source; nothing is confirmed by default", () => {
    const out = executeClinicalTool("calculate_orads", ORADS_3);
    assert.deepEqual(out.inputReview?.unconfirmed.sort(), [...ORADS_FIELDS].sort());
    assert.deepEqual(out.inputReview?.confirmed, []);
    assert.ok(out.inputReview?.fields.every((f) => f.source === "model" && f.state === "model_supplied"));
    assert.deepEqual(out.review, { required: true, state: "pending" });
  });

  it("chat boundary withholds O-RADS and IOTA results until confirmation", () => {
    for (const [tool, input] of [
      ["calculate_orads", ORADS_3],
      ["calculate_adnex", ADNEX],
      ["calculate_lr2", { ageYears: 45, ascites: false, bloodFlowInSolidPapillary: true, maxSolidDiameterMm: 15, irregularInternalWalls: true, acousticShadows: false }],
      ["calculate_srrisk", { oncologyCenter: false, benignFeatures: ["B4"], malignantFeatures: [] }],
    ] as const) {
      const out = toChatToolOutput(executeClinicalTool(tool, input));
      assert.equal(out.result, undefined, tool);
      assert.equal(out.review?.state, "pending", tool);
    }
    const tirads = toChatToolOutput(executeClinicalTool("calculate_tirads", TIRADS));
    assert.ok(tirads.result, "non-gated tools are not withheld");
  });

  it("model-assumed fields never enter the calculation", () => {
    const out = executeClinicalTool("calculate_orads", { ...ORADS_3, assumedFields: ["ascites", "peritonealNodules"] });
    assert.deepEqual(out.inputReview?.assumed.sort(), ["ascites", "peritonealNodules"]);
    assert.equal(out.inputReview?.fields.find((f) => f.field === "ascites")?.usedInCalculation, false);
    assert.equal(out.status, "provisional", "assumed modifiers are unknown → possible upgrade to 5");
    assert.ok(out.completeness?.category.possibleOutcomes?.includes("O-RADS 5"));
  });

  it("assumed required IOTA predictor → enumerated as unknown, no risk produced", () => {
    const out = executeClinicalTool("calculate_adnex", { ...ADNEX, assumedFields: ["ascites"] });
    assert.equal(out.ok, false);
    assert.equal(out.result, undefined);
    assert.deepEqual(out.completeness?.category.notAssessed, ["ascites"]);
  });

  it("assumed required measurement → incomplete (cannot be enumerated)", () => {
    const out = executeClinicalTool("calculate_adnex", { ...ADNEX, assumedFields: ["maxSolidDiameterMm"] });
    assert.equal(out.ok, false);
    assert.match(out.error ?? "", /предположены моделью/);
  });

  it("assumedFields may only name fields present in the call", () => {
    const out = executeClinicalTool("calculate_orads", { ...ORADS_3, assumedFields: ["cycleDay"] });
    assert.equal(out.rejected, true);
    assert.equal(out.validationIssues?.[0]?.path, "assumedFields");
  });

  it("physician confirmation of all fields → result identical to the engine, state confirmed", () => {
    const out = confirmClinicalToolInputs({ tool: "calculate_orads", input: ORADS_3, confirmedFields: ORADS_FIELDS });
    assert.equal(out.review?.state, "confirmed");
    assert.deepEqual(out.inputReview?.confirmed.sort(), [...ORADS_FIELDS].sort());
    assert.deepEqual(out.result, json(calculateORADS(ORADS_3)));
    assert.ok(toChatToolOutput(out).result, "confirmed result is shown");
  });

  it("unticked fields are dropped, not kept as model values", () => {
    const confirmed = ORADS_FIELDS.filter((f) => f !== "ascites" && f !== "peritonealNodules");
    const out = confirmClinicalToolInputs({ tool: "calculate_orads", input: ORADS_3, confirmedFields: confirmed });
    assert.equal("ascites" in out.inputEcho, false);
    assert.equal(out.review?.state, "confirmed");
    assert.equal(out.status, "provisional");
    assert.ok(out.completeness?.category.possibleOutcomes?.includes("O-RADS 5"));
  });

  it("IOTA confirmation reproduces the engine; a dropped required predictor is rejected", () => {
    const fields = Object.keys(ADNEX);
    const ok = confirmClinicalToolInputs({ tool: "calculate_adnex", input: ADNEX, confirmedFields: fields });
    const direct = calculateAdnex(ADNEX);
    assert.ok(!("errors" in direct));
    assert.equal(ok.result?.malignancyRisk, direct.malignancyRisk);
    const dropped = confirmClinicalToolInputs({ tool: "calculate_adnex", input: ADNEX, confirmedFields: fields.filter((f) => f !== "ascites") });
    assert.equal(dropped.ok, false);
    assert.equal(dropped.rejected, true);
  });

  it("confirm request schema: gated tools only, strict body", () => {
    assert.equal(ConfirmToolRequestSchema.safeParse({ tool: "calculate_tirads", input: {}, confirmedFields: [] }).success, false);
    assert.equal(ConfirmToolRequestSchema.safeParse({ tool: "calculate_orads", input: {}, confirmedFields: [], extra: 1 }).success, false);
    assert.equal(ConfirmToolRequestSchema.safeParse({ tool: "calculate_orads", input: ORADS_3, confirmedFields: ["menopause"] }).success, true);
  });
});

describe("D9 — one meaning of not_assessed across tools", () => {
  it("O-RADS: not_assessed equals not provided (enumerated, never 'no')", () => {
    const na = executeClinicalTool("calculate_orads", { ...ORADS_3, ascites: "not_assessed", peritonealNodules: "not_assessed" });
    assert.equal(na.status, "provisional");
    assert.deepEqual(na.inputReview?.notAssessed.sort(), ["ascites", "peritonealNodules"]);
    assert.ok(na.completeness?.category.possibleOutcomes?.includes("O-RADS 5"));
    assert.equal(executeClinicalTool("calculate_orads", { ...ORADS_3, ovarySide: "not_assessed" }).status, "complete");
  });

  it("ADNEX / LR2: not-assessed predictors → incomplete with the engine's risk range", () => {
    const adnex = executeClinicalTool("calculate_adnex", { ...ADNEX, ascites: "not_assessed", acousticShadows: "not_assessed" });
    assert.equal(adnex.ok, false);
    const risks = [false, true].flatMap((a) =>
      [false, true].map((s) => {
        const r = calculateAdnex({ ...ADNEX, ascites: a, acousticShadows: s });
        return "errors" in r ? NaN : r.malignancyRisk;
      }),
    );
    const range = `${(Math.min(...risks) * 100).toFixed(1)}%–${(Math.max(...risks) * 100).toFixed(1)}%`;
    assert.deepEqual(adnex.completeness?.category.possibleOutcomes, [range]);

    const lr2Input = { ageYears: 45, ascites: false, bloodFlowInSolidPapillary: "not_assessed", maxSolidDiameterMm: 15, irregularInternalWalls: true, acousticShadows: false };
    const lr2 = executeClinicalTool("calculate_lr2", lr2Input);
    assert.equal(lr2.ok, false);
    const lo = calculateLr2({ ...lr2Input, bloodFlowInSolidPapillary: false });
    assert.ok(!("errors" in lo));
    assert.ok(lr2.completeness?.category.possibleOutcomes?.[0]?.startsWith(`${(lo.malignancyRisk * 100).toFixed(1)}%`));
  });

  it("Simple Rules Risk: unknown centre type → range over both, not a default", () => {
    const out = executeClinicalTool("calculate_srrisk", { oncologyCenter: "not_assessed", benignFeatures: ["B4"], malignantFeatures: [] });
    assert.equal(out.ok, false);
    const a = calculateSimpleRulesRisk({ oncologyCenter: false, benignFeatures: ["B4"], malignantFeatures: [] });
    const b = calculateSimpleRulesRisk({ oncologyCenter: true, benignFeatures: ["B4"], malignantFeatures: [] });
    assert.ok(!("errors" in a) && !("errors" in b));
    assert.ok(out.completeness?.category.notAssessed?.includes("oncologyCenter"));
    assert.deepEqual(out.completeness?.category.possibleOutcomes, [
      `${(Math.min(a.malignancyRisk, b.malignancyRisk) * 100).toFixed(1)}%–${(Math.max(a.malignancyRisk, b.malignancyRisk) * 100).toFixed(1)}%`,
    ]);
  });

  it("FMF: not_assessed categorical marker is not evaluated and not echoed to the engine", () => {
    const out = executeClinicalTool("assess_fmf_screening", { crlMm: 60, ntMm: 2, nasalBone: "not_assessed" });
    assert.equal(out.ok, true);
    assert.deepEqual(out.inputReview?.notAssessed, ["nasalBone"]);
    assert.equal((out.result?.categorical as unknown[]).length, 0);
  });
});

describe("D5 — card category comes from the SSOT engine only", () => {
  const confirmedOrads = confirmClinicalToolInputs({ tool: "calculate_orads", input: ORADS_3, confirmedFields: ORADS_FIELDS });

  it("matching model category → engine label, no mismatch", () => {
    const view = reconcileStructuredCategory({ classification_system: "O-RADS US", category: "O-RADS 3" }, [confirmedOrads]);
    assert.deepEqual(view && { kind: view.kind, label: view.kind === "engine" ? view.label : "", mismatch: view.kind === "engine" && view.mismatch }, {
      kind: "engine",
      label: "O-RADS 3",
      mismatch: false,
    });
  });

  it("different model category → engine label kept, mismatch flagged", () => {
    const view = reconcileStructuredCategory({ classification_system: "O-RADS US", category: "O-RADS 2" }, [confirmedOrads]);
    assert.equal(view?.kind, "engine");
    if (view?.kind === "engine") {
      assert.equal(view.label, "O-RADS 3");
      assert.equal(view.mismatch, true);
      assert.equal(view.modelCategory, "O-RADS 2");
    }
  });

  it("no engine call (legacy path without tools) → not calculated, model value only as a non-calculated guess", () => {
    for (const [system, category] of [
      ["O-RADS US", "O-RADS 2"],
      ["BI-RADS", "BI-RADS 3"],
      ["TI-RADS", "TI-RADS 4"],
    ] as const) {
      const view = reconcileStructuredCategory({ classification_system: system, category }, []);
      assert.equal(view?.kind, "not_calculated", system);
      if (view?.kind === "not_calculated") {
        assert.equal(view.reason, "no_engine_result");
        assert.equal(view.modelCategory, category);
      }
    }
  });

  it("pending review, rejected or incomplete engine call → not calculated with the reason", () => {
    const pending = toChatToolOutput(executeClinicalTool("calculate_orads", ORADS_3));
    assert.equal(reconcileStructuredCategory({ classification_system: "O-RADS US", category: "O-RADS 3" }, [pending])?.kind, "not_calculated");
    const rejected = executeClinicalTool("calculate_birads", { findingType: "mass", shape: "Oval" });
    const v1 = reconcileStructuredCategory({ classification_system: "BI-RADS", category: "BI-RADS 2" }, [rejected]);
    assert.equal(v1?.kind === "not_calculated" && v1.reason, "rejected");
    const incomplete = executeClinicalTool("calculate_tirads", { ...TIRADS, echogenicFoci: "not_assessed" });
    const v2 = reconcileStructuredCategory({ classification_system: "TI-RADS", category: "TR4" }, [incomplete]);
    assert.equal(v2?.kind === "not_calculated" && v2.reason, "engine_not_completed");
  });

  it("model spellings of the system are normalised and category may be null", () => {
    const text = 'Текст.\n```sonogyn-json\n{"classification_system":"BI-RADS US","category":null}\n```';
    const { structured, displayText } = extractStructuredFromAssistantText(text);
    assert.equal(displayText, "Текст.");
    assert.equal(structured?.classification_system, "BI-RADS");
    assert.equal(structured?.category, null);
  });

  it("text claims are checked against engine results (auxiliary layer)", () => {
    const tirads = executeClinicalTool("calculate_tirads", TIRADS);
    assert.deepEqual(findTextCategoryClaims("Узел TR4.", [tirads]), []);
    const mismatch = findTextCategoryClaims("Узел TR3.", [tirads]);
    assert.equal(mismatch[0]?.kind, "mismatch");
    assert.equal(mismatch[0]?.engineLabel, "TR4");
    assert.equal(findTextCategoryClaims("O-RADS 2 по описанию.", [])[0]?.kind, "not_calculated");
    assert.equal(NOT_CALCULATED_LABEL, "Не рассчитано клиническим движком");
  });
});

describe("D6 — structured notice, independent of the model text", () => {
  it("notice lists rejected / pending / incomplete calls even when the text names no category", () => {
    const rejected = executeClinicalTool("calculate_birads", { findingType: "mass" });
    const pending = toChatToolOutput(executeClinicalTool("calculate_orads", ORADS_3));
    const notice = buildToolCompletionNotice("Ответ без категорий.", [rejected, pending]);
    assert.match(notice, /вызов BI-RADS отклонён/);
    assert.match(notice, /O-RADS — результат не показан до подтверждения/);
  });

  it("complete, non-gated result → no notice", () => {
    assert.equal(buildToolCompletionNotice("TR4", [executeClinicalTool("calculate_tirads", TIRADS)]), "");
  });
});

describe("D4 — chat tool session integrity (unit)", () => {
  it("a retry that keeps the user's data and fixes the invalid field is accepted", () => {
    const session = createChatToolSession();
    const first = session.call("calculate_tirads", { ...TIRADS, echogenicFoci: "none_or_comet_tail" });
    assert.equal(first.rejected, true);
    const second = session.call("calculate_tirads", TIRADS);
    assert.equal(second.ok, true);
    assert.equal(second.inputReview?.changedAfterRejection, undefined);
  });

  it("a second wiping retry is accepted but flagged and never complete", () => {
    const session = createChatToolSession();
    session.call("calculate_tirads", { ...TIRADS, echogenicFoci: "none_or_comet_tail" });
    const wipe = { ...TIRADS, composition: "not_assessed", echogenicFoci: ["none_or_comet_tail"] };
    assert.equal(session.call("calculate_tirads", wipe).rejected, true);
    const again = session.call("calculate_tirads", wipe);
    assert.deepEqual(again.inputReview?.changedAfterRejection, ["composition"]);
    assert.notEqual(again.status, "complete");
    assert.match(again.limitations?.join(" ") ?? "", /сверьте с исходными данными/);
  });
});

describe("D1 / D10 — prompts and the legacy path", () => {
  it("no fixed O-RADS category in the JSON example", () => {
    assert.doesNotMatch(STRUCTURED_RESPONSE_JSON_HINT, /O-RADS 4/);
    assert.match(STRUCTURED_RESPONSE_JSON_HINT, /"category": null/);
  });

  it("without tools the prompt forbids categories instead of promising tools", () => {
    const { prompt } = buildSonogynSystemPrompt({ domain: "ovary", userText: "O-RADS", hasImages: false });
    assert.match(prompt, /калькуляторы \(движки\) недоступны/);
    assert.doesNotMatch(prompt, /вызывай только серверные инструменты/);
    const obst = buildSonogynSystemPrompt({ domain: "obstetric", userText: "FMF КТР", hasImages: false }).prompt;
    assert.match(obst, /движок FMF недоступен/);
  });

  it("with tools the prompt asks for tool-first answers and no repeated questions", () => {
    const { prompt } = buildSonogynSystemPrompt({ domain: "ovary", userText: "O-RADS", hasImages: false, toolsAvailable: true });
    assert.match(prompt, /Сначала вызови инструмент/);
    assert.match(prompt, /Не переспрашивай данные/);
    assert.match(prompt, /review\.state=pending/);
  });
});

describe("D8 — AI SDK flag pairing", () => {
  const saved = { s: process.env.AI_SDK_ENABLED, c: process.env.NEXT_PUBLIC_AI_SDK_ENABLED };
  afterEach(() => {
    process.env.AI_SDK_ENABLED = saved.s;
    process.env.NEXT_PUBLIC_AI_SDK_ENABLED = saved.c;
    if (saved.s === undefined) delete process.env.AI_SDK_ENABLED;
    if (saved.c === undefined) delete process.env.NEXT_PUBLIC_AI_SDK_ENABLED;
  });

  it("reports a mismatch between server and client flags", () => {
    process.env.AI_SDK_ENABLED = "true";
    delete process.env.NEXT_PUBLIC_AI_SDK_ENABLED;
    assert.deepEqual(aiSdkFlagState(), { server: true, client: false, consistent: false });
    process.env.NEXT_PUBLIC_AI_SDK_ENABLED = "1";
    assert.equal(aiSdkFlagState().consistent, true);
  });
});

describe("result contract stays additive (web compatibility)", () => {
  it("legacy stored results without status / review still render as before", () => {
    const legacy = { tool: "calculate_tirads", ok: true, engineVersion: "x", sourceLabel: "y", inputEcho: {}, result: { category: "TR4" } } as ToolExecutionResult;
    assert.equal(reconcileStructuredCategory({ classification_system: "TI-RADS", category: "TR4" }, [legacy])?.kind, "engine");
    assert.equal(buildToolCompletionNotice("TR4", [legacy]), "");
  });
});
