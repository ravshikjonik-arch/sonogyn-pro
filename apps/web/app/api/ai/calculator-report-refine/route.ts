import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAiSdkModel } from "@/lib/ai/sdk/provider";
import { resolveLlmProvider } from "@/lib/ai/llm-provider";
import { isDevSkipAuthEnabled, isFullOpenAccessEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rejectIfPhiInTextFields } from "@/lib/security/reject-phi-payload";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

const BodySchema = z.object({
  toolId: z.string().min(1).max(64),
  draftText: z.string().min(20).max(12_000),
  category: z.union([z.string(), z.number()]).optional(),
});

const REFINE_SYSTEM = `Ты редактор черновиков ультразвукового заключения (RU).
Задача: улучшить формулировки — клинически точно, лаконично, без канцелярита.
Жёстко запрещено: слово «диагноз», выдуманные находки, ПДн, изменение чисел, категорий O-RADS/BI-RADS/TI-RADS и процентов риска.
Сохрани структуру секций (ПРОТОКОЛ, ЗАКЛЮЧЕНИЕ, маркеры ---) и все измерения.
Верни только текст черновика, без пояснений.`;

/** POST /api/ai/calculator-report-refine — стилистическая правка черновика калькулятора. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok && !isDevSkipAuthEnabled() && !isFullOpenAccessEnabled()) {
    return auth.response;
  }

  const rl = await consumeRateLimit(
    `ai-calc-refine:${auth.ok ? auth.userId : "open-access"}`,
    RL.aiChat.limit,
    RL.aiChat.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const phiBlocked = rejectIfPhiInTextFields([parsed.data.draftText]);
  if (phiBlocked) return phiBlocked;

  const llm = resolveLlmProvider("text");
  if (!llm) {
    return NextResponse.json(
      { error: "AI недоступен: не настроен LLM (PERPLEXITY_API_KEY или OPENROUTER_API_KEY)." },
      { status: 503 },
    );
  }

  const userPrompt = [
    `Калькулятор: ${parsed.data.toolId}`,
    parsed.data.category != null ? `Категория/итог: ${parsed.data.category}` : null,
    "",
    parsed.data.draftText,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { text } = await generateText({
      model: createAiSdkModel(llm, llm.model),
      system: REFINE_SYSTEM,
      prompt: userPrompt,
      maxOutputTokens: 2048,
    });

    const refinedText = text.trim();
    if (!refinedText || refinedText.length < 20) {
      return NextResponse.json({ error: "Пустой ответ модели" }, { status: 502 });
    }
    if (/диагноз/i.test(refinedText)) {
      return NextResponse.json({ error: "Ответ модели содержит запрещённую формулировку" }, { status: 422 });
    }

    return NextResponse.json({
      refinedText,
      meta: { assistive: true, toolId: parsed.data.toolId },
    });
  } catch {
    return NextResponse.json({ error: "Ошибка генерации" }, { status: 502 });
  }
}
