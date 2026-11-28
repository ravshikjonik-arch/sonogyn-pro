/**
 * ollama.ts — провайдер локальной LLM через Ollama (бесплатно, PHI на устройстве).
 * Работает через /api/chat; health — через /api/tags. fetch подменяемый (тесты).
 * Настройка: OLLAMA_URL (по умолчанию http://127.0.0.1:11434), OLLAMA_MODEL (qwen3:4b).
 */
import type { LlmChatRequest, LlmHealth, LlmMessage, LlmProvider, LlmReply } from "./provider.js";

export interface OllamaConfig {
  baseUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

function envOr(key: string): string | undefined {
  try {
    return typeof process !== "undefined" && process.env ? process.env[key] : undefined;
  } catch {
    return undefined;
  }
}

export class OllamaProvider implements LlmProvider {
  readonly model: string;
  private readonly baseUrl: string;
  private readonly f: typeof fetch;

  constructor(cfg: OllamaConfig = {}) {
    this.baseUrl = (cfg.baseUrl ?? envOr("OLLAMA_URL") ?? "http://127.0.0.1:11434").replace(/\/$/, "");
    this.model = cfg.model ?? envOr("OLLAMA_MODEL") ?? "qwen3:4b";
    this.f = cfg.fetchImpl ?? fetch;
  }

  async health(): Promise<LlmHealth> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    try {
      const res = await this.f(`${this.baseUrl}/api/tags`, { signal: ctrl.signal });
      if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
      const j = (await res.json()) as { models?: Array<{ name?: string }> };
      const models = Array.isArray(j.models)
        ? j.models.map((m) => String(m?.name ?? "")).filter((n) => n.length > 0)
        : undefined;
      return { ok: true, models };
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : "недоступен" };
    } finally {
      clearTimeout(timer);
    }
  }

  async chat(req: LlmChatRequest): Promise<LlmReply> {
    const messages: LlmMessage[] = req.messages;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), req.timeoutMs ?? 45000);
    try {
      const res = await this.f(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          ...(req.json ? { format: "json" } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const j = (await res.json()) as { message?: { content?: string }; model?: string };
      const content = j?.message?.content;
      if (typeof content !== "string") throw new Error("Ollama: пустой ответ");
      return { content, model: j.model ?? this.model };
    } finally {
      clearTimeout(timer);
    }
  }
}
