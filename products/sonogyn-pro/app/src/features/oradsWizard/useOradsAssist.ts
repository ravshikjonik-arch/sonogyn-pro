import { useCallback, useState } from "react";

import {
  runOradsAssistPipeline,
  type OradsAssistPipelineResult,
  type OradsProtocolDraftSource,
} from "@repo/orads-us";

import {
  createOradsEvent,
  fetchOradsProtocolDraft,
} from "./oradsEventsApi";

export type OradsAssistFullResult = OradsAssistPipelineResult & {
  protocolDraftSource: OradsProtocolDraftSource;
};

type AnalyzeParams = {
  text: string;
  menopause?: "pre" | "post";
  profileAgeYears?: number;
  patientId?: string;
  studyId?: string;
  fetchRemoteDraft?: boolean;
};

export function useOradsAssist() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OradsAssistFullResult | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  const analyze = useCallback(async (params: AnalyzeParams) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setEventId(null);
    try {
      const trimmed = params.text.trim();
      if (trimmed.length < 8) {
        throw new Error("Введите хотя бы несколько слов описания УЗИ.");
      }

      let pipeline = runOradsAssistPipeline(trimmed, {
        uiMenopause: params.menopause,
        profileAgeYears: params.profileAgeYears,
      });

      let protocolDraftSource: OradsProtocolDraftSource = pipeline.protocolDraftSource;
      let protocolDraft = pipeline.protocolDraft;

      const needRemoteDraft =
        params.fetchRemoteDraft === true || pipeline.unresolvedNodes.length > 0;

      if (needRemoteDraft) {
        const remote = await fetchOradsProtocolDraft({
          text: trimmed,
          ageYears: pipeline.context.ageYears,
          menopause: pipeline.context.menopause,
        });
        if (remote?.protocol_draft) {
          protocolDraft = remote.protocol_draft;
          protocolDraftSource = remote.meta?.fallback ? "local" : "protocol-ai";
        }
      }

      const full: OradsAssistFullResult = { ...pipeline, protocolDraft, protocolDraftSource };

      const event = await createOradsEvent({
        platform: "mobile",
        sourceText: trimmed,
        extracted: full.extracted as unknown as Record<string, unknown>,
        hints: full.hints,
        unresolvedNodes: full.unresolvedNodes,
        aiCategoryNumber: full.categoryNumber,
        aiCompletePath: full.completePath,
        ageYears: full.context.ageYears ?? null,
        ageSource: full.context.ageSource ?? null,
        menopause: full.context.menopause,
        menopauseSource: full.context.menopauseSource,
        protocolDraft,
        protocolDraftSource,
        patientId: params.patientId,
        studyId: params.studyId,
      });

      setResult(full);
      setEventId(event?.id ?? null);
      setLoading(false);
      return full;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Не удалось разобрать описание";
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
    setEventId(null);
  }, []);

  return { loading, error, result, eventId, analyze, reset };
}
