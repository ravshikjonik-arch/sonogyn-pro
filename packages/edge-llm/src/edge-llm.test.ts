import assert from "node:assert/strict";
import { test } from "node:test";
import { LlmClinicalBrain } from "./brainLlm.js";
import { OllamaProvider } from "./ollama.js";
import { extractJsonBlock, parseClassification, safeParseJson, toolCatalogPrompt } from "./provider.js";
import type { BrainLike, BrainTurnLike, SessionLike } from "./brainLlm.js";
import type { LlmChatRequest, ToolSummary } from "./provider.js";

const TOOLS: ToolSummary[] = [
  {
    id: "obstetrics_cpr",
    nosology: "obstetrics",
    title: "CPR",
    slots: [
      { name: "uaPi", type: "number", required: true, description: "PI пупочной артерии" },
      { name: "mcaPi", type: "number", required: true, description: "PI средней мозговой артерии" },
    ],
  },
  {
    id: "uterus_myoma_figo",
    nosology: "uterus",
    title: "FIGO",
    slots: [
      {
        name: "primaryLocation",
        type: "enum",
        required: true,
        description: "локализация узла",
        options: ["submucosal", "intramural", "subserosal", "cervical_or_parasitic"],
      },
      { name: "contactsEndometrium", type: "boolean", required: false, description: "контакт с эндометрием?" },
    ],
  },
];

const DISCLAIMER = "Справочная поддержка для врачей. Не является диагнозом — решение за врачом.";

function stubBrain(handled: string[] = []): BrainLike {
  return {
    disclaimer: DISCLAIMER,
    handle: async (text: string, session?: SessionLike): Promise<BrainTurnLike> => {
      handled.push(text);
      return {
        reply: `детерминированный ответ на «${text}»`,
        intent: "lookup_kr",
        contract: {
          intent: "lookup_kr",
          citations: [{ organization: "FMF", document: "doc", year: 2026, status: "s" }],
          disclaimer: DISCLAIMER,
        },
        session: session ?? { slots: {}, history: [] },
      };
    },
    runTool: (id: string, slots: Record<string, unknown>) => {
      if (id === "obstetrics_cpr") {
        if (typeof slots.uaPi !== "number" || typeof slots.mcaPi !== "number") {
          return {
            ok: false,
            error: "missing_slots",
            message: "Не хватает обязательных слотов",
            missingSlots: [
              ...(typeof slots.uaPi !== "number" ? ["uaPi"] : []),
              ...(typeof slots.mcaPi !== "number" ? ["mcaPi"] : []),
            ],
          };
        }
        return {
          ok: true,
          result: { value: Number(slots.mcaPi) / Number(slots.uaPi), band: "reduced", interpretation: "снижен — признак перераспределения" },
          chain: ["CPR = MCA PI / UA PI"],
          citations: [{ organization: "ISUOG / FMF", document: "практика CPR", year: 2026, status: "учебный пересказ" }],
          disclaimer: DISCLAIMER,
        };
      }
      if (id === "uterus_myoma_figo") {
        if (slots.primaryLocation === "intramural" && typeof slots.contactsEndometrium !== "boolean") {
          return { ok: false, error: "insufficient_slots", message: "ветвной признак не задан", missingSlots: ["contactsEndometrium"] };
        }
        return {
          ok: true,
          result: { figoType: 3, label: "FIGO 3 — интрамуральный с контактом с эндометрием" },
          chain: ["Система FIGO 0–8"],
          citations: [{ organization: "FIGO", document: "Munro 2018", year: 2018, status: "учебный пересказ" }],
          disclaimer: DISCLAIMER,
        };
      }
      return { ok: false, error: "unknown_tool", message: `не найден: ${id}` };
    },
    buildContract: (outcome: unknown, opts?: { tool?: string; slots?: Record<string, unknown>; intent?: string }) => {
      const o = outcome as ReturnType<BrainLike["runTool"]>;
      if (o.ok) {
        return {
          intent: opts?.intent ?? "calculate",
          tool: opts?.tool,
          slots: opts?.slots,
          result: o.result,
          chain: o.chain,
          citations: o.citations ?? [],
          disclaimer: DISCLAIMER,
        };
      }
      return {
        intent: opts?.intent ?? "calculate",
        tool: opts?.tool,
        citations: [],
        disclaimer: DISCLAIMER,
        missingSlots: o.missingSlots,
        notes: [o.message ?? "ошибка"],
      };
    },
    listTools: () => TOOLS,
    searchKnowledge: () => [],
  };
}

function fakeLlm(content: string, capture?: { reqs: LlmChatRequest[] }) {
  return {
    model: "fake-7b",
    chat: async (req: LlmChatRequest) => {
      capture?.reqs.push(req);
      return { content, model: "fake-7b" };
    },
    health: async () => ({ ok: true, models: ["fake-7b"] }),
  };
}

test("без провайдера → делегат детерминированному мозгу", { timeout: 10000 }, async () => {
  const handled: string[] = [];
  const brain = new LlmClinicalBrain(stubBrain(handled));
  const turn = await brain.handle("КТР 63");
  assert.deepEqual(handled, ["КТР 63"]);
  assert.ok(turn.reply.includes("детерминированный"));
});

test("calculate: движок считает, числа из движка, цитаты и дисклеймер", { timeout: 10000 }, async () => {
  const brain = new LlmClinicalBrain(
    stubBrain(),
    fakeLlm('{"intent":"calculate","tool":"obstetrics_cpr","slots":{"uaPi":1.4,"mcaPi":0.95}}'),
  );
  const turn = await brain.handle("посчитай цпо");
  assert.equal(turn.intent, "calculate");
  assert.equal(turn.contract.tool, "obstetrics_cpr");
  assert.ok(Math.abs((turn.contract.result?.value as number) - 0.6785714285714286) < 1e-9);
  assert.ok(turn.reply.includes("снижен"));
  assert.ok(turn.reply.includes("ISUOG / FMF, 2026"));
  assert.ok(turn.reply.includes(DISCLAIMER));
  assert.equal(turn.session.pendingTool, undefined);
});

test("calculate: строковый слот → путь переспроса, посторонний ключ игнорируется", { timeout: 10000 }, async () => {
  const brain = new LlmClinicalBrain(
    stubBrain(),
    fakeLlm('{"intent":"calculate","tool":"obstetrics_cpr","slots":{"uaPi":1,"mcaPi":"1.1","garbage":"x"}}'),
  );
  const turn = await brain.handle("цпо");
  assert.equal(turn.intent, "calculate");
  assert.equal(turn.session.pendingTool, "obstetrics_cpr");
  assert.ok(turn.reply.includes("нужно уточнить"));
});

test("calculate: ветвной FIGO недобран → missingSlots в контракте", { timeout: 10000 }, async () => {
  const brain = new LlmClinicalBrain(
    stubBrain(),
    fakeLlm('{"intent":"calculate","tool":"uterus_myoma_figo","slots":{"primaryLocation":"intramural"}}'),
  );
  const turn = await brain.handle("миома интрамуральная");
  assert.equal(turn.session.pendingTool, "uterus_myoma_figo");
  assert.deepEqual(turn.contract.missingSlots, ["contactsEndometrium"]);
  assert.ok(turn.reply.includes("контакт с эндометрием"));
});

test("classify unknown → fallback на детерминированный мозг", { timeout: 10000 }, async () => {
  const handled: string[] = [];
  const brain = new LlmClinicalBrain(stubBrain(handled), fakeLlm('{"intent":"unknown"}'));
  await brain.handle("привет");
  assert.deepEqual(handled, ["привет"]);
});

test("мусор вместо JSON → fallback; неверный tool → fallback (whitelist)", { timeout: 10000 }, async () => {
  const handled: string[] = [];
  const brain = new LlmClinicalBrain(stubBrain(handled), fakeLlm("я не понял, но вот ответ"));
  await brain.handle("вопрос");
  assert.deepEqual(handled, ["вопрос"]);
  const handled2: string[] = [];
  const brain2 = new LlmClinicalBrain(stubBrain(handled2), fakeLlm('{"intent":"calculate","tool":"hacker_tool","slots":{}}'));
  await brain2.handle("вопрос 2");
  assert.deepEqual(handled2, ["вопрос 2"]);
});

test("провайдер бросил исключение → fallback без падения", { timeout: 10000 }, async () => {
  const handled: string[] = [];
  const brain = new LlmClinicalBrain(stubBrain(handled), {
    model: "x",
    chat: async () => {
      throw new Error("network down");
    },
    health: async () => ({ ok: false }),
  });
  const turn = await brain.handle("ктр 63");
  assert.deepEqual(handled, ["ктр 63"]);
  assert.ok(turn.reply.length > 0);
});

test("каталог инструментов попал в промт-классификатор", { timeout: 10000 }, async () => {
  const capture = { reqs: [] as LlmChatRequest[] };
  const brain = new LlmClinicalBrain(stubBrain(), fakeLlm('{"intent":"unknown"}', capture));
  await brain.handle("вопрос");
  const prompt = capture.reqs[0].messages.map((m) => m.content).join("\n");
  assert.ok(prompt.includes("obstetrics_cpr"));
  assert.ok(prompt.includes("uterus_myoma_figo"));
  assert.ok(prompt.includes("PI пупочной артерии"));
  assert.ok(prompt.includes("НЕ вычисляешь"));
});

test("toolCatalogPrompt: enum options и обязательность видны модели", { timeout: 10000 }, () => {
  const p = toolCatalogPrompt(TOOLS);
  assert.ok(p.includes("submucosal|intramural"));
  assert.ok(p.includes(", необяз."));
  assert.ok(p.includes("primaryLocation"));
});

test("parseClassification: JSON с мусором вокруг → ок; битый → undefined", { timeout: 10000 }, () => {
  const c = parseClassification('Вот ответ: {"intent":"calculate","tool":"obstetrics_cpr","slots":{"uaPi":1}} ок');
  assert.equal(c?.intent, "calculate");
  assert.equal(c?.tool, "obstetrics_cpr");
  assert.deepEqual(c?.slots, { uaPi: 1 });
  assert.equal(parseClassification("совсем не json"), undefined);
  assert.equal(parseClassification('{"intent":"delete_all"}'), undefined);
  const c2 = parseClassification('{"intent":"lookup_kr","slots":{"weird":[1,2]}}');
  assert.equal(c2?.intent, "lookup_kr");
  assert.deepEqual(c2?.slots, {}, "массивы в слотах отброшены");
});

test("extractJsonBlock/safeParseJson: вложенные скобки и строки", { timeout: 10000 }, () => {
  const block = extractJsonBlock('преамбула {"a":{"b":"c{d}e"},"f":1} хвост');
  assert.equal(block, '{"a":{"b":"c{d}e"},"f":1}');
  assert.deepEqual(safeParseJson(block!), { ok: true, value: { a: { b: "c{d}e" }, f: 1 } });
  assert.equal(safeParseJson("нет").ok, false);
});

test("OllamaProvider: health и chat на подменённом fetch; json-флаг в теле", { timeout: 10000 }, async () => {
  const bodies: string[] = [];
  const urls: string[] = [];
  const fake = (async (url: string | URL, init?: RequestInit) => {
    urls.push(String(url));
    if (String(url).endsWith("/api/tags")) {
      return new Response(JSON.stringify({ models: [{ name: "qwen3:4b" }] }), { status: 200 });
    }
    bodies.push(String(init?.body));
    return new Response(JSON.stringify({ message: { content: '{"intent":"unknown"}' }, model: "qwen3:4b" }), { status: 200 });
  }) as typeof fetch;
  const p = new OllamaProvider({ baseUrl: "http://127.0.0.1:9999", model: "qwen3:4b", fetchImpl: fake });
  const h = await p.health();
  assert.equal(h.ok, true);
  assert.deepEqual(h.models, ["qwen3:4b"]);
  const r = await p.chat({
    messages: [
      { role: "system", content: "s" },
      { role: "user", content: "u" },
    ],
    json: true,
  });
  assert.equal(r.content, '{"intent":"unknown"}');
  assert.ok(urls[0].endsWith("/api/tags"));
  assert.ok(urls[1].endsWith("/api/chat"));
  assert.ok(bodies[0].includes('"format":"json"'));
  assert.ok(bodies[0].includes('"stream":false'));
  assert.ok(bodies[0].includes("qwen3:4b"));
});

test("OllamaProvider: HTTP 500 → chat бросает; health ok=false", { timeout: 10000 }, async () => {
  const fake = (async () => new Response("err", { status: 500 })) as typeof fetch;
  const p = new OllamaProvider({ fetchImpl: fake });
  const h = await p.health();
  assert.equal(h.ok, false);
  await assert.rejects(() => p.chat({ messages: [{ role: "user", content: "x" }] }));
});
