"use client";

import { useCallback, useState } from "react";

export type OradsExtractedFeature = {
  key: string;
  value: unknown;
  confidence: "low" | "medium" | "high";
  source_span?: string | null;
};

export type OradsFromTextResult = {
  extracted: Record<string, unknown>;
  features: OradsExtractedFeature[];
  protocol_draft: string;
  orads_hint: string | null;
  missing_fields: string[];
  disclaimer: string;
  pipeline: string;
};

type Params = {
  text: string;
  ageYears?: number;
  menopause?: "pre" | "post";
};

type State = {
  loading: boolean;
  error: string | null;
  result: OradsFromTextResult | null;
};

/**
 * Голос/текст → черновик протокола + признаки O-RADS (CDS).
 * Вызывает POST /api/ai/orads-from-text → Python FastAPI worker.
 */
export function useOradsFromText() {
  const [state, setState] = useState<State>({
    loading: false,
    error: null,
    result: null,
  });

  const analyze = useCallback(async (params: Params) => {
    setState({ loading: true, error: null, result: null });
    try {
      const res = await fetch("/api/ai/orads-from-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          text: params.text,
          ageYears: params.ageYears,
          menopause: params.menopause,
        }),
      });

      const payload = (await res.json().catch(() => null)) as
        | (OradsFromTextResult & { error?: string; hint?: string })
        | null;

      if (!res.ok || !payload || "error" in payload) {
        const msg =
          typeof payload?.error === "string"
            ? payload.error
            : `HTTP ${res.status}`;
        throw new Error(payload?.hint ? `${msg}. ${payload.hint}` : msg);
      }

      setState({ loading: false, error: null, result: payload });
      return payload;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Не удалось разобрать текст";
      setState({ loading: false, error: message, result: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, result: null });
  }, []);

  return { ...state, analyze, reset };
}
