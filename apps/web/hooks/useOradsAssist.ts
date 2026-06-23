"use client";

import { useCallback, useState } from "react";

import {
  runOradsAssistPipeline,
  type OradsAssistPipelineResult,
  type OradsProtocolDraftSource,
  type OradsWizardHint,
} from "@repo/orads-us";

import { createOradsEvent, fetchOradsProtocolDraft } from "@/lib/orads/oradsEventsApi";

export type OradsAssistState = {
  loading: boolean;
  error: string | null;
  result: OradsAssistFullResult | null;
  eventId: string | null;
};

export type OradsAssistFullResult = OradsAssistPipelineResult & {
  protocolDraftSource: OradsProtocolDraftSource;
};

type AnalyzeParams = {
  text: string;
  menopause?: "pre" | "post";
  profileAgeYears?: number;
  patientId?: string;
  studyId?: string;
  /** Force protocol-ai draft fetch even when local parse is complete. */
  fetchRemoteDraft?: boolean;
};

/**
 * Sprint 2: local parse → optional protocol-ai prose → metrics event.
 * O-RADS category always from calculateOradsResult() inside runOradsAssistPipeline.
 */
export function useOradsAssist(platform: "web" | "mobile" = "web") {
  const [state, setState] = useState<OradsAssistState>({
    loading: false,
    error: null,
    result: null,
    eventId: null,
  });

  const analyze = useCallback(
    async (params: AnalyzeParams) => {
      setState({ loading: true, error: null, result: null, eventId: null });
      try {
        const trimmed = params.text.trim();
        if (trimmed.length < 8) {
          throw new Error("Введите хотя бы несколько слов описания УЗИ.");
        }

        const pipeline = runOradsAssistPipeline(trimmed, {
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

        const full: OradsAssistFullResult = {
          ...pipeline,
          protocolDraft,
          protocolDraftSource,
        };

        const event = await createOradsEvent({
          platform,
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

        setState({
          loading: false,
          error: null,
          result: full,
          eventId: event?.id ?? null,
        });
        return full;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Не удалось разобрать описание";
        setState({ loading: false, error: message, result: null, eventId: null });
        return null;
      }
    },
    [platform],
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, result: null, eventId: null });
  }, []);

  return { ...state, analyze, reset };
}

export type { OradsWizardHint, OradsAssistPipelineResult };
