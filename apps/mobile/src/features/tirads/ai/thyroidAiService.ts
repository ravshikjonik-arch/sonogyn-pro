import { assistFromTiradsText, type TiradsNlpResult } from "@repo/tirads-acr";

import { getWebApiBase } from "../../../api/chatBackend";
import { supabaseMobile } from "../../../lib/supabase/mobileClient";

export type ThyroidAiFrame = {
  fileName: string;
  mimeType: string;
  base64: string;
};

export type ThyroidAiAssistResult = TiradsNlpResult & {
  pipeline: string;
  workerSummary?: string;
  workerImpression?: string;
  workerRecommendations?: string[];
  workerScorecard?: string | null;
  workerFindings?: string[];
  mergedText: string;
};

export type ThyroidAiRequest = {
  freeText?: string;
  clinicalContext?: string;
  frames?: ThyroidAiFrame[];
};

class ThyroidAiRateLimitError extends Error {
  retryAfterSec: number;

  constructor(retryAfterSec: number) {
    super(`Thyroid AI rate limited (${retryAfterSec}s)`);
    this.name = "ThyroidAiRateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-sonogyn-client": "mobile",
  };
  if (!supabaseMobile) return headers;
  const { data } = await supabaseMobile.auth.getSession();
  const token = data.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Локальный NLP без сети (rule engine @repo/tirads-acr). */
export function analyzeThyroidTextLocally(freeText: string): ThyroidAiAssistResult {
  const nlp = assistFromTiradsText(freeText);
  return {
    ...nlp,
    pipeline: "tirads-nlp-local",
    mergedText: freeText,
  };
}

/** POST /api/ai/thyroid-assist — текст ± снимок → ACR TI-RADS. */
export async function requestThyroidAiAssist(input: ThyroidAiRequest): Promise<ThyroidAiAssistResult> {
  const base = getWebApiBase();
  if (!base) {
    if (input.frames?.length) {
      throw new Error("Для анализа снимка нужен EXPO_PUBLIC_API_BASE_URL и вход в аккаунт.");
    }
    return analyzeThyroidTextLocally(input.freeText ?? "");
  }

  const res = await fetch(`${base}/api/ai/thyroid-assist`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      freeText: input.freeText,
      clinicalContext: input.clinicalContext ?? "УЗИ щитовидной железы, ACR TI-RADS · mobile",
      frames: input.frames,
    }),
  });

  if (res.status === 429) {
    const retryAfterRaw = res.headers.get("Retry-After");
    const retryAfterSec = retryAfterRaw ? Number.parseInt(retryAfterRaw, 10) : 60;
    throw new ThyroidAiRateLimitError(Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec : 60);
  }

  if (res.status === 401) {
    throw new Error("Войдите в аккаунт для серверного AI Assistant.");
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(typeof err.error === "string" ? err.error : `Thyroid AI error ${res.status}`);
  }

  const json = (await res.json()) as { result: ThyroidAiAssistResult };
  if (!json.result?.report) throw new Error("Пустой ответ thyroid-assist");
  return json.result;
}

export const TIRADS_AI_EXAMPLE =
  "Солидный гипоэхогенный узел 11 мм, taller-than-wide, пунктатные микрокальцинаты, неровные контуры — подозрение на папиллярный рак";
