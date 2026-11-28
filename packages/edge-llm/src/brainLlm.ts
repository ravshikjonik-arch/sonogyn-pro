/**
 * brainLlm.ts — LLM-слой поверх детерминированного ClinicalBrain.
 *
 * Поток (AI_LOCAL_ARCHITECTURE.md, этап 1):
 *   1) LLM-классификатор: интент + слоты (guardrails: не считает, tool только из whitelist).
 *   2) calculate + валидный tool → runTool (движок!) → buildContract → ответ.
 *      не хватило слотов → переспрос, pendingTool в сессии (мультиход сохранён).
 *   3) lookup_kr / explain_term → детерминированный путь мозга (шина знаний).
 *   4) unknown / мусор / ошибка провайдера → fallback brain.handle (всегда работает).
 * Числа в ответе — ТОЛЬКО из результата движка; LLM формулирует.
 */
import { CLASSIFY_SYSTEM_PROMPT, parseClassification } from "./provider.js";
import type { Classification, LlmProvider, ToolSummary } from "./provider.js";

/* ---------- структурные типы (совместимы с medical-calculations/knowledge-bus) ---------- */

export interface CitationLike {
  organization: string;
  document: string;
  year: number;
  status: string;
  url?: string;
}

export interface CalcContractLike {
  intent: string;
  tool?: string;
  slots?: Record<string, unknown>;
  result?: Record<string, unknown>;
  chain?: string[];
  citations: CitationLike[];
  disclaimer: string;
  missingSlots?: string[];
  notes?: string[];
}

export interface SessionLike {
  pendingTool?: string;
  slots: Record<string, unknown>;
  history: Array<{ role: string; text: string }>;
}

export interface BrainTurnLike {
  reply: string;
  intent: string;
  contract: CalcContractLike;
  session: SessionLike;
  pubmedHits?: unknown[];
}

/** Всё, что LlmClinicalBrain требует от мозга (ClinicalBrain + registry + bus в UI). */
export interface BrainLike {
  handle(text: string, session?: SessionLike): Promise<BrainTurnLike>;
  runTool(
    id: string,
    slots: Record<string, unknown>,
  ): { ok: boolean; result?: Record<string, unknown>; chain?: string[]; citations?: CitationLike[]; disclaimer?: string; redFlags?: string[]; error?: string; message?: string; missingSlots?: string[] };
  buildContract(
    outcome: unknown,
    opts?: { tool?: string; slots?: Record<string, unknown>; intent?: string; notes?: string[] },
  ): CalcContractLike;
  listTools(): ToolSummary[];
  searchKnowledge(
    query: string,
    opts?: { topK?: number },
  ): Array<{ chunk: { topic: string; text: string; citation: CitationLike; tool?: string; flags?: string[] }; score: number }>;
  /** Дисклеймер платформы (STANDARD_DISCLAIMER) — injected, не хардкод. */
  disclaimer: string;
}

export interface LlmBrainOptions {
  classifyTimeoutMs?: number;
}

/* ---------- LLM-мозг ---------- */

export class LlmClinicalBrain {
  constructor(
    private readonly brain: BrainLike,
    private readonly llm?: LlmProvider,
    private readonly opts: LlmBrainOptions = {},
  ) {}

  async handle(text: string, session?: SessionLike): Promise<BrainTurnLike> {
    if (!this.llm) return this.brain.handle(text, session);
    let classification: Classification | undefined;
    try {
      const catalog = this.brain.listTools();
      const reply = await this.llm.chat({
        messages: [
          { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({ вопрос: text, инструменты: catalogJson(catalog) }),
          },
        ],
        json: true,
        timeoutMs: this.opts.classifyTimeoutMs ?? 30000,
      });
      classification = parseClassification(reply.content);
    } catch {
      classification = undefined;
    }

    const knownIds = new Set(this.brain.listTools().map((t) => t.id));

    if (classification && classification.intent === "calculate" && classification.tool && knownIds.has(classification.tool)) {
      return this.runCalculate(classification.tool, classification.slots ?? {}, session);
    }
    // lookup/explain/unknown/мусор → детерминированный мозг (шина знаний и роутер)
    return this.brain.handle(text, session);
  }

  private runCalculate(toolId: string, slots: Record<string, unknown>, session?: SessionLike): BrainTurnLike {
    const tool = this.brain.listTools().find((t) => t.id === toolId);
    const outcome = this.brain.runTool(toolId, slots);
    const contract = this.buildCalcContract(outcome, toolId, slots);
    const s: SessionLike = {
      pendingTool: outcome.ok ? undefined : toolId,
      slots: outcome.ok ? {} : slots,
      history: session ? [...session.history] : [],
    };

    if (!outcome.ok) {
      const need = outcome.missingSlots ?? [];
      const hints = (tool?.slots ?? [])
        .filter((sl) => need.includes(sl.name))
        .map((sl) => `• ${sl.description}`);
      const reply = `Для «${tool?.title ?? toolId}» нужно уточнить:\n${hints.join("\n") || outcome.message || "данных недостаточно"}`;
      s.history.push({ role: "brain", text: reply });
      return { reply, intent: "calculate", contract, session: s };
    }

    const resultLine = this.resultLine(contract.result ?? {});
    const flagLine =
      contract.notes && contract.notes.length > 0 ? `\n⚠ Флаги: ${[...new Set(contract.notes)].join(", ")}` : "";
    const cite = contract.citations.map((c) => `${c.organization}, ${c.year}`).join(" · ");
    const reply = `${tool?.title ?? toolId}\n${resultLine}${flagLine}\n\nИсточники: ${cite}\n${contract.disclaimer}`;
    s.history.push({ role: "brain", text: reply });
    return { reply, intent: "calculate", contract, session: s };
  }

  private buildCalcContract(
    outcome: ReturnType<BrainLike["runTool"]>,
    toolId: string,
    slots: Record<string, unknown>,
  ): CalcContractLike {
    if (outcome.ok) {
      const contract = this.brain.buildContract(outcome, { tool: toolId, slots, intent: "calculate" });
      return contract;
    }
    const contract = this.brain.buildContract(outcome, { tool: toolId, slots, intent: "calculate" });
    if (contract.missingSlots === undefined && outcome.missingSlots) {
      contract.missingSlots = outcome.missingSlots;
    }
    return contract;
  }

  /** Краткая строка результата из контракта (только числа движка, не LLM). */
  private resultLine(result: Record<string, unknown>): string {
    const s = (v: unknown) => (v === undefined || v === null ? undefined : String(v));
    if (s(result.display) && !Array.isArray(result.display)) return s(result.display)!;
    if (s(result.interpretation)) return s(result.interpretation)!;
    if (result.figoType !== undefined) return s(result.label) ?? `FIGO ${s(result.figoType)}`;
    if (result.band !== undefined)
      return `${s(result.value)} — ${s(result.band)}${s(result.interpretation) ? `: ${s(result.interpretation)}` : ""}`;
    if (result.grams !== undefined) return `${result.grams} г (формула ${s(result.formula)})`;
    if (result.days !== undefined) return s(result.display) ?? `${s(result.days)} дней`;
    if (result.total !== undefined) return `Сумма баллов: ${s(result.total)} — ${s(result.interpretation) ?? ""}`.trim();
    if (result.tolacEligible !== undefined)
      return `Категория: ${s(result.category)} · допуск TOLAC: ${result.tolacEligible ? "да" : "нет"}`;
    if (Array.isArray(result.risks) && result.risks.length > 0) {
      const risks = result.risks as Array<{ display?: string }>;
      return `Риски: ${risks.map((r) => r.display ?? "").filter(Boolean).join(" · ")}`;
    }
    return JSON.stringify(result).slice(0, 220);
  }
}

function catalogJson(tools: ToolSummary[]): string {
  return JSON.stringify(
    tools.map((t) => ({
      id: t.id,
      nosology: t.nosology,
      title: t.title,
      slots: t.slots.map((s) => ({
        name: s.name,
        type: s.type,
        required: s.required,
        description: s.description,
        ...(s.options ? { options: s.options } : {}),
      })),
    })),
  );
}
