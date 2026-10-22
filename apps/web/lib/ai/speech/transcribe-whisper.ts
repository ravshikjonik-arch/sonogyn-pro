import { SPEECH_TRANSCRIBE_MAX_BYTES } from "./constants";

export type TranscribeWhisperResult =
  | { ok: true; text: string; provider: "openrouter" | "openai" }
  | { ok: false; code: "not_configured" | "upstream_error" | "empty_transcript"; status?: number };

function whisperLanguageFromLocale(lang: string): string | undefined {
  const base = lang.split("-")[0]?.toLowerCase();
  return base && base.length === 2 ? base : undefined;
}

export function isServerSpeechTranscribeConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim());
}

export async function transcribeWhisperFromBuffer(params: {
  buffer: Buffer;
  mime: string;
  lang?: string;
  filename?: string;
}): Promise<TranscribeWhisperResult> {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openRouterKey && !openAiKey) {
    return { ok: false, code: "not_configured" };
  }

  if (params.buffer.byteLength > SPEECH_TRANSCRIBE_MAX_BYTES) {
    return { ok: false, code: "upstream_error", status: 413 };
  }

  const model =
    process.env.OPENROUTER_WHISPER_MODEL?.trim() ||
    process.env.OPENAI_WHISPER_MODEL?.trim() ||
    "openai/whisper-1";

  const language = params.lang ? whisperLanguageFromLocale(params.lang) : "ru";
  const ext = params.mime.includes("ogg") ? "ogg" : params.mime.includes("wav") ? "wav" : "webm";
  const filename = params.filename ?? `dictation.${ext}`;

  const body = new FormData();
  const bytes = new Uint8Array(params.buffer);
  body.append("file", new Blob([bytes], { type: params.mime }), filename);
  body.append("model", openRouterKey ? model : model.replace(/^openai\//, ""));
  if (language) body.append("language", language);
  body.append("response_format", "json");

  const url = openRouterKey
    ? `${process.env.OPENROUTER_API_URL?.trim().replace(/\/chat\/completions\/?$/, "") || "https://openrouter.ai/api/v1"}/audio/transcriptions`
    : "https://api.openai.com/v1/audio/transcriptions";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterKey ?? openAiKey}`,
      ...(openRouterKey && process.env.NEXT_PUBLIC_APP_URL
        ? { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL }
        : {}),
    },
    body,
  });

  if (!res.ok) {
    return { ok: false, code: "upstream_error", status: res.status };
  }

  const json = (await res.json()) as { text?: string };
  const text = json.text?.trim() ?? "";
  if (!text) return { ok: false, code: "empty_transcript" };

  return { ok: true, text, provider: openRouterKey ? "openrouter" : "openai" };
}
