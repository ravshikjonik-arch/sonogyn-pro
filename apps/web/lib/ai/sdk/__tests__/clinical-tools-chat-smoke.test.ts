import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MockLanguageModelV3 } from "ai/test";

import type { ResolvedLlm } from "@/lib/ai/llm-provider";
import { persistedAssistantMessage } from "@/lib/ai/sdk/persisted-answer";
import {
  aiSdkTextStreamResponse,
  CLINICAL_TOOL_STEP_LIMIT,
  runAiSdkStreamText,
  type StreamedAnswer,
} from "@/lib/ai/sdk/stream-chat";
import { findTextCategoryClaims } from "@/lib/ai/sonogyn-chat/clinical-safety";
import { EMPTY_ANSWER_NOTICE } from "@/lib/ai/sonogyn-chat/tool-results";
import { REVIEW_GATED_TOOLS } from "@/lib/ai/sonogyn-chat/tools/input-review";

/**
 * Smoke tests of the real AI SDK tool loop (tool execution, structured rejections fed back to the model,
 * step limit, trailer, persistence) with a scripted model — no provider, network or patient data.
 */

type Part = Record<string, unknown>;
const USAGE = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

let callSeq = 0;
function toolStep(...calls: Array<{ name: string; input: unknown; raw?: string }>): Part[] {
  return [
    { type: "stream-start", warnings: [] },
    ...calls.map((c) => ({
      type: "tool-call",
      toolCallId: `call-${++callSeq}`,
      toolName: c.name,
      input: c.raw ?? JSON.stringify(c.input),
    })),
    { type: "finish", finishReason: { unified: "tool-calls", raw: "tool_calls" }, usage: USAGE },
  ];
}

function textStep(text: string, ...calls: Array<{ name: string; input: unknown }>): Part[] {
  return [
    { type: "stream-start", warnings: [] },
    { type: "text-start", id: `t${callSeq}` },
    { type: "text-delta", id: `t${callSeq}`, delta: text },
    { type: "text-end", id: `t${callSeq}` },
    ...calls.map((c) => ({ type: "tool-call", toolCallId: `call-${++callSeq}`, toolName: c.name, input: JSON.stringify(c.input) })),
    {
      type: "finish",
      finishReason: calls.length ? { unified: "tool-calls", raw: "tool_calls" } : { unified: "stop", raw: "stop" },
      usage: USAGE,
    },
  ];
}

function scriptedModel(steps: Part[][]): MockLanguageModelV3 {
  let i = 0;
  return new MockLanguageModelV3({
    doStream: async () => {
      const parts = steps[Math.min(i++, steps.length - 1)]!;
      return {
        stream: new ReadableStream({
          start(controller) {
            for (const p of parts) controller.enqueue(p as never);
            controller.close();
          },
        }),
      };
    },
  });
}

const LLM: ResolvedLlm = { provider: "openrouter", apiKey: "test", url: "http://localhost.invalid", model: "mock" } as ResolvedLlm;

async function chat(model: MockLanguageModelV3) {
  const { result, collectedTools } = runAiSdkStreamText({
    llm: LLM,
    modelId: "mock",
    systemPrompt: "test",
    history: [{ role: "user", content: "синтетический вопрос" }],
    enableTools: true,
    model,
  });
  let persisted: StreamedAnswer | null = null;
  const body = await aiSdkTextStreamResponse(result, collectedTools, {}, (a) => {
    persisted = a;
  }).text();
  return {
    body,
    collectedTools,
    persisted: persisted as StreamedAnswer | null,
    promptAt: (n: number) => JSON.stringify(model.doStreamCalls[n]?.prompt ?? []),
  };
}

const ORADS_OK = {
  menopause: "pre",
  lesionKind: "nonphysiological",
  structure: "unilocular",
  unilocularSubtype: "simple_cyst",
  solidComponent: false,
  solidType: "smooth",
  ascites: false,
  peritonealNodules: false,
  acousticShadows: false,
  lengthMm: 30,
  widthMm: 25,
  heightMm: 20,
};

const TIRADS_OK = {
  composition: "solid",
  echogenicity: "hypoechoic",
  shape: "wider_than_tall",
  margin: "smooth",
  echogenicFoci: ["none_or_comet_tail"],
  largestDiameterMm: 18,
  lymphNodes: "benign",
};

const BIRADS_OK = {
  findingType: "mass",
  shape: "oval",
  margin: "circumscribed",
  echoPattern: "anechoic",
  vascularity: "none",
  orientation: "parallel",
  posteriorFeatures: "none",
};

const VALID_CALLS: Record<string, unknown> = {
  calculate_orads: ORADS_OK,
  calculate_birads: BIRADS_OK,
  calculate_tirads: TIRADS_OK,
  calculate_adnex: {
    ageYears: 50,
    oncologyCenter: false,
    maxDiameterMm: 60,
    maxSolidDiameterMm: 20,
    moreThan10Locules: false,
    papillaryCount: 1,
    acousticShadows: false,
    ascites: false,
    ca125Uml: 35,
  },
  calculate_lr2: {
    ageYears: 50,
    ascites: false,
    bloodFlowInSolidPapillary: true,
    maxSolidDiameterMm: 20,
    irregularInternalWalls: true,
    acousticShadows: false,
  },
  calculate_srrisk: { oncologyCenter: false, benignFeatures: ["B4"], malignantFeatures: [] },
  assess_fmf_screening: { crlMm: 60, ntMm: 2, sbpMmHg: 120, dbpMmHg: 75 },
};

const GATED = REVIEW_GATED_TOOLS as readonly string[];

describe("AI chat smoke — seven tools through the AI SDK loop", () => {
  for (const [name, input] of Object.entries(VALID_CALLS)) {
    it(`valid call: ${name} → executed; gated tools withhold the result until physician review`, async () => {
      const { body, collectedTools, promptAt } = await chat(scriptedModel([toolStep({ name, input }), textStep("Готово.")]));
      assert.equal(collectedTools.length, 1);
      const out = collectedTools[0]!;
      assert.equal(out.tool, name);
      assert.equal(out.ok, true, out.error);
      assert.equal(out.status, "complete");
      assert.match(body, /```sonogyn-tools/);
      if (GATED.includes(name)) {
        assert.equal(out.review?.state, "pending");
        assert.equal(out.result, undefined, "gated result must not reach the model or the card");
        assert.ok(out.inputReview?.unconfirmed.length);
        assert.match(body, /не показан до подтверждения входных данных врачом/);
        assert.doesNotMatch(promptAt(1), /"result":|malignancyRisk|riskText/);
      } else {
        assert.equal(out.review?.state, "not_required");
        assert.ok(out.result);
        assert.doesNotMatch(body, /Внимание:/);
      }
    });
  }

  it("extra field → structured rejection reaches the model and the history; corrected call succeeds", async () => {
    const model = scriptedModel([
      toolStep({ name: "calculate_birads", input: { ...BIRADS_OK, patientName: "x" } }),
      toolStep({ name: "calculate_birads", input: BIRADS_OK }),
      textStep("BI-RADS 2."),
    ]);
    const { body, collectedTools, promptAt } = await chat(model);
    assert.equal(collectedTools.length, 2);
    assert.equal(collectedTools[0]!.rejected, true);
    assert.deepEqual(collectedTools[0]!.validationIssues, [{ path: "patientName", message: "неизвестное поле" }]);
    assert.equal(collectedTools[1]!.status, "complete");
    assert.match(promptAt(1), /validationIssues/);
    assert.match(promptAt(1), /неизвестное поле/);
    assert.doesNotMatch(body, /Внимание:/, "latest result is complete");
  });

  it("wrong type → structured issue naming the field", async () => {
    const { collectedTools, promptAt } = await chat(
      scriptedModel([toolStep({ name: "calculate_tirads", input: { ...TIRADS_OK, largestDiameterMm: "18" } }), textStep("Не удалось.")]),
    );
    assert.equal(collectedTools[0]!.rejected, true);
    assert.equal(collectedTools[0]!.validationIssues?.[0]?.path, "largestDiameterMm");
    assert.match(promptAt(1), /largestDiameterMm/);
  });

  it("unknown descriptor value → rejected, corrected call that changes only that field succeeds", async () => {
    const model = scriptedModel([
      toolStep({ name: "calculate_tirads", input: { ...TIRADS_OK, echogenicFoci: ["microcalcifications"] } }),
      toolStep({ name: "calculate_tirads", input: { ...TIRADS_OK, echogenicFoci: ["punctate"] } }),
      textStep("TR5."),
    ]);
    const { collectedTools } = await chat(model);
    assert.equal(collectedTools.length, 2);
    assert.equal(collectedTools[1]!.result?.category, "TR5");
  });

  it("retry that wipes valid user data after a rejection is rejected (D4 integrity)", async () => {
    const wiped = {
      composition: "not_assessed",
      echogenicity: "not_assessed",
      shape: "not_assessed",
      margin: "not_assessed",
      echogenicFoci: "not_assessed",
      largestDiameterMm: 8,
    };
    const model = scriptedModel([
      toolStep({ name: "calculate_tirads", input: { ...TIRADS_OK, largestDiameterMm: 8, echogenicFoci: "none_or_comet_tail" } }),
      toolStep({ name: "calculate_tirads", input: wiped }),
      toolStep({ name: "calculate_tirads", input: { ...TIRADS_OK, largestDiameterMm: 8 } }),
      textStep("TR4."),
    ]);
    const { collectedTools, promptAt } = await chat(model);
    assert.equal(collectedTools.length, 3);
    assert.equal(collectedTools[0]!.validationIssues?.[0]?.path, "echogenicFoci");
    assert.equal(collectedTools[1]!.rejected, true);
    assert.equal(collectedTools[1]!.sourceLabel, "retry-integrity");
    assert.deepEqual(
      collectedTools[1]!.validationIssues?.map((i) => i.path).sort(),
      ["composition", "echogenicity", "lymphNodes", "margin", "shape"],
    );
    assert.match(promptAt(2), /сохраните остальные данные пользователя/);
    assert.equal(collectedTools[2]!.ok, true);
    assert.equal(collectedTools[2]!.result?.category, "TR4");
  });

  it("findings first added on a retry (no new user message) are treated as model assumptions", async () => {
    const bare = { menopause: "pre", lesionKind: "nonphysiological", structure: "unilocular", lengthMm: 30, widthMm: 25, heightMm: 20 };
    const model = scriptedModel([
      toolStep({ name: "calculate_orads", input: bare }),
      toolStep({ name: "calculate_orads", input: { ...bare, solidComponent: false, solidType: "smooth" } }),
      textStep("Уточните данные."),
    ]);
    const { collectedTools } = await chat(model);
    const retry = collectedTools[1]!;
    assert.equal(retry.ok, false);
    assert.equal(retry.status, "incomplete");
    assert.deepEqual(retry.inputReview?.assumed.sort(), ["solidComponent", "solidType"]);
    assert.match(retry.limitations?.join(" ") ?? "", /предположением модели/);
  });

  it("unparsable arguments → SDK tool-error is still recorded as a rejected call", async () => {
    const model = scriptedModel([toolStep({ name: "calculate_birads", input: null, raw: "{not json" }), textStep("Ошибка.")]);
    const { collectedTools, body } = await chat(model);
    assert.equal(collectedTools.length, 1);
    assert.equal(collectedTools[0]!.rejected, true);
    assert.equal(collectedTools[0]!.sourceLabel, "ai-sdk");
    assert.match(body, /вызов BI-RADS отклонён/);
  });

  it("repeated identical call → identical deterministic results", async () => {
    const model = scriptedModel([
      toolStep({ name: "calculate_birads", input: BIRADS_OK }, { name: "calculate_birads", input: BIRADS_OK }),
      textStep("BI-RADS 2."),
    ]);
    const { collectedTools } = await chat(model);
    assert.equal(collectedTools.length, 2);
    assert.deepEqual(collectedTools[0]!.result, collectedTools[1]!.result);
  });

  it("model states a category although the tool was incomplete → structured notice and text-claim flag", async () => {
    const { solidComponent: _s, solidType: _t, ...bare } = ORADS_OK;
    void _s;
    void _t;
    const model = scriptedModel([toolStep({ name: "calculate_orads", input: bare }), textStep("Заключение: O-RADS 2.")]);
    const { body, collectedTools } = await chat(model);
    assert.match(body, /Заключение: O-RADS 2\./);
    assert.match(body, /Внимание: расчёт O-RADS не завершён/);
    const claims = findTextCategoryClaims("Заключение: O-RADS 2.", collectedTools);
    assert.deepEqual(claims.map((c) => [c.claim, c.kind]), [["O-RADS 2", "not_calculated"]]);
  });

  it("text of every step is streamed and persisted identically (D7)", async () => {
    const model = scriptedModel([
      textStep("Шаг 1: считаю. ", { name: "calculate_birads", input: BIRADS_OK }),
      textStep("Итог: см. карточку."),
    ]);
    const { body, persisted } = await chat(model);
    assert.ok(persisted);
    assert.equal(persisted!.text, "Шаг 1: считаю. Итог: см. карточку.");
    assert.ok(body.startsWith(persisted!.text));
    const row = persistedAssistantMessage(persisted!, { sessionId: "s", userId: "u", modelId: "m", promptVersion: "p" });
    assert.equal(row.content, `${persisted!.text.trim()}${persisted!.notice}`.trim());
    assert.equal(row.toolResults.length, 1);
  });

  it("step limit: a model that keeps calling tools stops after the limit with an explicit notice", async () => {
    const model = scriptedModel([toolStep({ name: "calculate_birads", input: BIRADS_OK })]);
    const { body, collectedTools, persisted } = await chat(model);
    assert.equal(model.doStreamCalls.length, CLINICAL_TOOL_STEP_LIMIT);
    assert.equal(collectedTools.length, CLINICAL_TOOL_STEP_LIMIT);
    assert.ok(body.startsWith(`\n\n${EMPTY_ANSWER_NOTICE}`));
    assert.ok(persisted!.notice.includes(EMPTY_ANSWER_NOTICE));
  });
});
