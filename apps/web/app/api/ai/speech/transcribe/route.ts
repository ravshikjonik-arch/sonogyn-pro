import { NextResponse } from "next/server";
import { z } from "zod";

import { isServerSpeechTranscribeConfigured, transcribeWhisperFromBuffer } from "@/lib/ai/speech/transcribe-whisper";
import { validateSpeechAudioUpload } from "@/lib/ai/speech/validate-audio-upload";
import { SPEECH_TRANSCRIBE_MAX_BYTES } from "@/lib/ai/speech/constants";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rejectIfPhiInTextFields } from "@/lib/security/reject-phi-payload";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const LangSchema = z.string().min(2).max(16).optional();

/** Статус серверного STT (без загрузки аудио). */
export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  const configured = isServerSpeechTranscribeConfigured();
  return NextResponse.json({
    available: configured,
    maxBytes: SPEECH_TRANSCRIBE_MAX_BYTES,
    disclaimer:
      "Не диктуйте ФИО, телефон, полис и другие персональные данные. Расшифровка — вспомогательный инструмент, не медицинский документ.",
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok && !isDevSkipAuthEnabled()) {
    return auth.response;
  }

  if (!isServerSpeechTranscribeConfigured()) {
    return NextResponse.json({ error: "Server STT is not configured", code: "stt_unavailable" }, { status: 503 });
  }

  const userKey = auth.ok ? auth.userId : "dev";
  const rl = await consumeRateLimit(`ai-speech-stt:${userKey}`, RL.aiSpeechTranscribe.limit, RL.aiSpeechTranscribe.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio field" }, { status: 400 });
  }

  const langRaw = form.get("lang");
  const langParsed = LangSchema.safeParse(typeof langRaw === "string" ? langRaw : undefined);
  const lang = langParsed.success ? langParsed.data : "ru-RU";

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const validation = validateSpeechAudioUpload({
    bytes,
    declaredMime: file.type || null,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const result = await transcribeWhisperFromBuffer({
    buffer: Buffer.from(bytes),
    mime: validation.mime,
    lang,
  });

  if (!result.ok) {
    const status = result.code === "not_configured" ? 503 : result.status && result.status >= 400 ? result.status : 502;
    return NextResponse.json({ error: result.code }, { status });
  }

  const phiBlocked = rejectIfPhiInTextFields([result.text]);
  if (phiBlocked) return phiBlocked;

  return NextResponse.json({
    text: result.text,
    provider: result.provider,
    meta: { assistive: true, noStorage: true },
  });
}
