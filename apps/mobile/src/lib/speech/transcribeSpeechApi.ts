import { getWebApiBase } from "../../api/chatBackend";
import { supabaseMobile } from "../supabase/mobileClient";

export type SpeechTranscribeMeta = {
  available: boolean;
  maxBytes: number;
  disclaimer?: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "x-sonogyn-client": "mobile",
  };
  if (!supabaseMobile) return headers;
  const { data } = await supabaseMobile.auth.getSession();
  const token = data.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchSpeechTranscribeMeta(): Promise<SpeechTranscribeMeta | null> {
  const base = getWebApiBase();
  if (!base) return null;
  const res = await fetch(`${base}/api/ai/speech/transcribe`, {
    method: "GET",
    headers: await authHeaders(),
  });
  if (!res.ok) return null;
  return (await res.json()) as SpeechTranscribeMeta;
}

export async function transcribeAudioFile(params: {
  uri: string;
  mimeType?: string;
  lang?: string;
}): Promise<string> {
  const base = getWebApiBase();
  if (!base) {
    throw new Error("Настройте EXPO_PUBLIC_API_BASE_URL для серверной диктовки.");
  }

  const form = new FormData();
  form.append("audio", {
    uri: params.uri,
    name: "dictation.m4a",
    type: params.mimeType ?? "audio/mp4",
  } as unknown as Blob);
  form.append("lang", params.lang ?? "ru-RU");

  const res = await fetch(`${base}/api/ai/speech/transcribe`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });

  const json = (await res.json().catch(() => ({}))) as { text?: string; error?: string; code?: string };

  if (res.status === 401) {
    throw new Error("Войдите в аккаунт для серверной диктовки.");
  }
  if (res.status === 400 && json.code === "phi_detected") {
    throw new Error("В тексте возможны персональные данные — удалите их и повторите.");
  }
  if (!res.ok) {
    throw new Error(typeof json.error === "string" ? json.error : `STT error ${res.status}`);
  }

  return json.text?.trim() ?? "";
}
