import type { OradsAssistPipelineResult } from "@repo/orads-us";

import { getWebApiBase } from "../../api/chatBackend";
import { supabaseMobile } from "../../lib/supabase/mobileClient";

export type GynAssistFrame = {
  fileName: string;
  mimeType: string;
  base64: string;
};

export type GynAssistApiResult = OradsAssistPipelineResult & {
  pipeline: string;
  mergedText: string;
  visionDescription?: string;
  workerSummary?: string;
  workerImpression?: string;
  workerRecommendations?: string[];
  workerFindings?: string[];
  workerScorecard?: string | null;
};

export type GynAssistRequest = {
  freeText?: string;
  clinicalContext?: string;
  menopause?: "pre" | "post";
  profileAgeYears?: number;
  frames?: GynAssistFrame[];
};

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

/** POST /api/ai/gyn-assist — УЗИ придатков (фото ± текст) → worker + O-RADS hints. */
export async function requestGynUltrasoundAssist(input: GynAssistRequest): Promise<GynAssistApiResult> {
  const base = getWebApiBase();
  if (!base) {
    throw new Error("Настройте EXPO_PUBLIC_API_BASE_URL для анализа снимка.");
  }

  const res = await fetch(`${base}/api/ai/gyn-assist`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      freeText: input.freeText,
      clinicalContext: input.clinicalContext ?? "Трансвагинальное УЗИ придатков, O-RADS US v2022 · mobile",
      menopause: input.menopause,
      profileAgeYears: input.profileAgeYears,
      frames: input.frames,
    }),
  });

  if (res.status === 429) {
    throw new Error("Слишком много запросов. Подождите минуту.");
  }
  if (res.status === 401) {
    throw new Error("Для анализа снимка нужен вход или открытый пилот на сервере.");
  }
  if (res.status === 422) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(typeof err.error === "string" ? err.error : "Снимок не прошёл проверку качества.");
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(typeof err.error === "string" ? err.error : `Ошибка gyn-assist HTTP ${res.status}`);
  }

  const json = (await res.json()) as { result: GynAssistApiResult };
  if (!json.result?.mergedText) {
    throw new Error("Пустой ответ сервера.");
  }
  return json.result;
}