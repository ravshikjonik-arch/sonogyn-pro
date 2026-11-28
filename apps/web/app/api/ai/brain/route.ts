import { NextResponse } from "next/server";

/**
 * /api/ai/brain — единая точка ассистента платформы.
 * GET  → { ollama: boolean, models?: string[], model: string }
 * POST { text, session?, mode?: "llm" | "local" } → { reply, intent, contract, session }
 * mode "llm": Ollama-классификатор слотов (guardrails: модель не считает; числа — движки).
 * Нет Ollama / ошибка → автоматический откат к детерминированному мозгу.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const { provider } = (await import("@/lib/edge/brain-server")).getBrainBundle();
  const health = await provider.health();
  return NextResponse.json({
    ollama: health.ok,
    models: health.models ?? [],
    model: provider.model,
  });
}

export async function POST(request: Request) {
  let body: { text?: unknown; session?: unknown; mode?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length === 0) {
    return NextResponse.json({ error: "empty_text" }, { status: 400 });
  }
  const mode = body.mode === "llm" ? "llm" : "local";
  const session = (body.session ?? undefined) as never;

  const { brain, llmBrain, provider } = (await import("@/lib/edge/brain-server")).getBrainBundle();

  try {
    let usedLlm = false;
    let turn;
    if (mode === "llm") {
      const health = await provider.health();
      if (health.ok) {
        turn = await llmBrain.handle(text, session);
        usedLlm = true;
      }
    }
    if (!turn) {
      turn = await brain.handle(text, session);
    }
    return NextResponse.json({
      reply: turn.reply,
      intent: turn.intent,
      contract: turn.contract,
      session: turn.session,
      pubmedHits: turn.pubmedHits ?? [],
      engine: usedLlm ? "llm+engines" : "engines",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "brain_failure", message: e instanceof Error ? e.message : "неизвестная ошибка" },
      { status: 500 },
    );
  }
}
