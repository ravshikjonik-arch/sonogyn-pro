/**
 * brain-server.ts — серверная сборка «клинического мозга» для API-маршрута
 * (изменение №8 этап 3: LLM-слой). Клинический мозг и движки живут на сервере
 * вместе с Ollama — PHI не покидает машину врача (server ↔ localhost Ollama).
 * Ollama настраивается env: OLLAMA_URL (по умолчанию http://127.0.0.1:11434),
 * OLLAMA_MODEL (по умолчанию qwen3:4b). Нет Ollama → детерминированный мозг.
 */
import {
  buildContract,
  ClinicalBrain,
  listTools,
  runTool,
  STANDARD_DISCLAIMER,
} from "@repo/medical-calculations";
import { createDefaultBus, fmfLikeToPack, visionChecklist } from "@repo/knowledge-bus";
import { FMF_KNOWLEDGE_CHUNKS } from "@repo/evidence-retrieval";
import { LlmClinicalBrain, OllamaProvider } from "@repo/edge-llm";
import type { BrainLike } from "@repo/edge-llm";

type Bundle = {
  brain: ClinicalBrain;
  llmBrain: LlmClinicalBrain;
  provider: OllamaProvider;
};

const globalForBrain = globalThis as unknown as { __sonogynBrainBundle?: Bundle };

function build(): Bundle {
  const bus = createDefaultBus();
  bus.registerPack(fmfLikeToPack("fmf-pack", FMF_KNOWLEDGE_CHUNKS as never));

  const brain = new ClinicalBrain(bus);
  brain.setVisionResolver((nosology) => {
    const cl = visionChecklist(nosology);
    return cl
      ? {
          nosology: cl.nosology,
          title: cl.title,
          instruction: cl.instruction,
          note: cl.note,
          citation: cl.citation,
          items: cl.items.map((i) => ({ id: i.id, label: i.label })),
        }
      : undefined;
  });

  const provider = new OllamaProvider();
  const brainLike: BrainLike = {
    disclaimer: STANDARD_DISCLAIMER,
    handle: (text, session) => brain.handle(text, session as never),
    runTool: (id, slots) => runTool(id, slots),
    buildContract: (outcome, opts) => buildContract(outcome as never, opts as never),
    listTools: () => listTools(),
    searchKnowledge: (query, opts) => bus.search(query, opts),
  };
  const llmBrain = new LlmClinicalBrain(brainLike, provider, { classifyTimeoutMs: 30000 });

  return { brain, llmBrain, provider };
}

export function getBrainBundle(): Bundle {
  if (!globalForBrain.__sonogynBrainBundle) {
    globalForBrain.__sonogynBrainBundle = build();
  }
  return globalForBrain.__sonogynBrainBundle;
}
