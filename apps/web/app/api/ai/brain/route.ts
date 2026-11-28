import { NextResponse } from "next/server";
import { z } from "zod";

import { EVIDENCE_CORPUS_MODES, type EvidenceCorpusMode } from "@repo/evidence-retrieval";
import { getMedicalVaultStatus } from "@/lib/evidence/medical-vault-search";
import {
  enrichBrainTurnWithEvidence,
  enrichBrainTurnWithRegistryHints,
  shouldAttachRegistryHints,
  shouldEnrichWithEvidence,
  type CopilotBrainTurn,
} from "@/lib/ai/clinical-copilot/orchestrator";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { requireSupabaseUserOrOpenAccess } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

/**
 * /api/ai/brain — единая точка ассистента платформы.
 * GET  → { ollama: boolean, models?: string[], model: string, evidenceCapable: true }
 * POST { text, session?, mode?, evidence?, useLlmEvidence?, corpusMode? }
 * mode "llm": Ollama-классификатор слотов (guardrails: модель не считает; числа — движки).
 * evidence: true — после движка подмешать PubMed/КР/реестр (сеть, rate limit как Evidence Assistant).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

const CorpusModeSchema = z.enum(
  EVIDENCE_CORPUS_MODES as [EvidenceCorpusMode, ...EvidenceCorpusMode[]],
);

const PostBodySchema = z.object({
  text: z.string().min(1).max(2000),
  session: z.unknown().optional(),
  mode: z.enum(["llm", "local"]).optional().default("local"),
  evidence: z.boolean().optional().default(false),
  useLlmEvidence: z.boolean().optional().default(false),
  corpusMode: CorpusModeSchema.optional(),
});

export async function GET() {
  const { provider } = (await import("@/lib/edge/brain-server")).getBrainBundle();
  const health = await provider.health();
  const vault = getMedicalVaultStatus();
  return NextResponse.json({
    ollama: health.ok,
    models: health.models ?? [],
    model: provider.model,
    evidenceCapable: true,
    evidenceVault: { enabled: vault.enabled, flag: vault.flag },
    corpusModes: ["all", "rf_kr", "rf_npa", "rf_all", "rcog"],
  });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = PostBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { text, mode, evidence: evidenceOn, useLlmEvidence, corpusMode } = parsed.data;
  const session = (parsed.data.session ?? undefined) as never;

  if (evidenceOn) {
    const supabase = await createClient();
    const auth = await requireSupabaseUserOrOpenAccess(request, supabase);
    const rlKey = auth.ok
      ? `brain-evidence:${auth.userId}`
      : rateLimitKeyFromRequest(request, "brain-evidence");
    const rl = await consumeRateLimit(rlKey, RL.evidenceAssistant.limit, RL.evidenceAssistant.windowMs);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited", message: "Слишком много запросов с Evidence." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }
  }

  const { brain, llmBrain, provider } = (await import("@/lib/edge/brain-server")).getBrainBundle();

  try {
    let usedLlm = false;
    let turn: CopilotBrainTurn | undefined;
    if (mode === "llm") {
      const health = await provider.health();
      if (health.ok) {
        turn = (await llmBrain.handle(text, session)) as CopilotBrainTurn;
        usedLlm = true;
      }
    }
    if (!turn) {
      turn = await brain.handle(text, session);
    }

    let evidenceMeta;
    if (evidenceOn && shouldEnrichWithEvidence(turn, text, true)) {
      const enriched = await enrichBrainTurnWithEvidence(turn, text, {
        corpusMode,
        useLlm: useLlmEvidence,
      });
      turn = enriched.turn;
      evidenceMeta = enriched.evidence;
    } else if (evidenceOn && shouldAttachRegistryHints(turn, text, true)) {
      const hints = enrichBrainTurnWithRegistryHints(turn, text);
      turn = hints.turn;
      evidenceMeta = hints.evidence;
    }

    return NextResponse.json({
      reply: turn.reply,
      intent: turn.intent,
      contract: turn.contract,
      session: turn.session,
      pubmedHits: turn.pubmedHits ?? [],
      engine: usedLlm ? "llm+engines" : evidenceMeta ? "engines+evidence" : "engines",
      evidence: evidenceMeta ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "brain_failure", message: e instanceof Error ? e.message : "неизвестная ошибка" },
      { status: 500 },
    );
  }
}