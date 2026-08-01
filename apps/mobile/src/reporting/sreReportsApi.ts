import type {
  CreateStructuredReportBody,
  GenerateStructuredReportRequest,
  StructuredReportDocument,
  UpdateStructuredReportBody,
} from "@repo/types";

import { getWebApiBase } from "../api/chatBackend";
import { supabaseMobile } from "../lib/supabase/mobileClient";

export type SreGenerateResponse = {
  document: StructuredReportDocument;
  persistedId?: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-sonogyn-client": "mobile",
  };
  if (supabaseMobile) {
    const { data } = await supabaseMobile.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function apiBase(): string {
  const base = getWebApiBase();
  if (!base) throw new Error("API не настроен (EXPO_PUBLIC_API_BASE_URL).");
  return base;
}

function errorMessage(status: number, data: { error?: unknown } | null, fallback: string): string {
  if (typeof data?.error === "string") return data.error;
  if (status === 401) return "Войдите в аккаунт, чтобы сохранить протокол в облако.";
  return fallback;
}

/** Preview or persist via POST /api/reports/generate (preview=false saves draft). */
export async function generateStructuredReport(
  body: GenerateStructuredReportRequest,
): Promise<SreGenerateResponse> {
  const res = await fetch(`${apiBase()}/api/reports/generate`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as (SreGenerateResponse & { error?: unknown }) | null;
  if (!res.ok) throw new Error(errorMessage(res.status, data, "Ошибка генерации"));
  if (!data?.document) throw new Error("Пустой ответ API");
  return { document: data.document, persistedId: data.persistedId };
}

/** Always-persist create via POST /api/reports. */
export async function createStructuredReport(
  body: CreateStructuredReportBody,
): Promise<SreGenerateResponse> {
  const res = await fetch(`${apiBase()}/api/reports`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as (SreGenerateResponse & { error?: unknown }) | null;
  if (!res.ok) throw new Error(errorMessage(res.status, data, "Ошибка сохранения"));
  if (!data?.document) throw new Error("Пустой ответ API");
  return data;
}

export async function patchStructuredReport(
  id: string,
  body: UpdateStructuredReportBody,
): Promise<StructuredReportDocument> {
  const res = await fetch(`${apiBase()}/api/reports/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as {
    document?: StructuredReportDocument;
    error?: unknown;
  } | null;
  if (!res.ok) throw new Error(errorMessage(res.status, data, "Ошибка обновления"));
  if (!data?.document) throw new Error("Пустой ответ API");
  return data.document;
}
