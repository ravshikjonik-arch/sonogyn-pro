import type { CreateOradsEventBody, OradsEventFeedbackBody } from "@repo/types";
import type { OradsClinicalMemoryInsight } from "@repo/orads-us";

export type ClinicalMemoryRow = {
  id: string;
  patient_id: string | null;
  domain: string;
  memory_type: string;
  title: string;
  detail: string;
  confidence: "low" | "medium" | "high";
  created_at: string;
};

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

export async function fetchOradsClinicalMemory(params: {
  patientId?: string;
  aiCategoryNumber: number | null;
  extracted: Record<string, unknown>;
  unresolvedNodes: string[];
}): Promise<OradsClinicalMemoryInsight[]> {
  try {
    const res = await fetch("/api/ai/orads-memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(params),
    });
    if (!res.ok) return [];
    const payload = (await res.json()) as { insights?: OradsClinicalMemoryInsight[] };
    return Array.isArray(payload.insights) ? payload.insights : [];
  } catch {
    return [];
  }
}

export async function createClinicalMemory(body: {
  domain: "orads";
  memoryType: "patient_context" | "doctor_pattern" | "case_learning" | "safety_rule" | "preference";
  title: string;
  detail: string;
  confidence?: "low" | "medium" | "high";
  patientId?: string;
  sourceEventId?: string;
  payload?: Record<string, unknown>;
}): Promise<ClinicalMemoryRow | null> {
  try {
    const res = await fetch("/api/ai/clinical-memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { memory?: ClinicalMemoryRow };
    return payload.memory ?? null;
  } catch {
    return null;
  }
}

export async function deleteClinicalMemory(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/ai/clinical-memory?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin",
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
