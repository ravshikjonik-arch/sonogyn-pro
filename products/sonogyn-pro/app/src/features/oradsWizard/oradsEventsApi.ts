import type { CreateOradsEventBody, OradsEventFeedbackBody } from "@repo/types";

import { getWebApiBase } from "../../api/chatBackend";
import { supabaseMobile } from "../../lib/supabase/mobileClient";

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

export async function createOradsEvent(body: CreateOradsEventBody): Promise<{ id: string } | null> {
  const base = getWebApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/ai/orads-events`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { id?: string | null };
    return payload.id ? { id: payload.id } : null;
  } catch {
    return null;
  }
}

export async function submitOradsEventFeedback(
  eventId: string,
  body: OradsEventFeedbackBody,
): Promise<boolean> {
  const base = getWebApiBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/api/ai/orads-events/${encodeURIComponent(eventId)}/feedback`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type ProtocolDraftResponse = {
  protocol_draft: string;
  pipeline: string;
  meta?: { assistive?: boolean; proxied?: boolean; fallback?: boolean };
};

export async function fetchOradsProtocolDraft(params: {
  text: string;
  ageYears?: number;
  menopause?: "pre" | "post";
}): Promise<ProtocolDraftResponse | null> {
  const base = getWebApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/ai/orads-from-text`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({
        text: params.text,
        ageYears: params.ageYears,
        menopause: params.menopause,
        draftOnly: true,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as ProtocolDraftResponse;
  } catch {
    return null;
  }
}
