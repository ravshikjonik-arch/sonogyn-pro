import type { CreateOradsEventBody, OradsEventFeedbackBody } from "@repo/types";

export async function createOradsEvent(body: CreateOradsEventBody): Promise<{ id: string } | null> {
  try {
    const res = await fetch("/api/ai/orads-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { id?: string };
    return payload.id ? { id: payload.id } : null;
  } catch {
    return null;
  }
}

export async function submitOradsEventFeedback(
  eventId: string,
  body: OradsEventFeedbackBody,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/ai/orads-events/${encodeURIComponent(eventId)}/feedback`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
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

/** Fetch prose draft from protocol-ai worker (category ignored — local only). */
export async function fetchOradsProtocolDraft(params: {
  text: string;
  ageYears?: number;
  menopause?: "pre" | "post";
}): Promise<ProtocolDraftResponse | null> {
  try {
    const res = await fetch("/api/ai/orads-from-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
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
