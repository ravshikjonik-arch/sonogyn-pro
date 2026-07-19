import { buildOradsProtocolDraft } from "./buildProtocolDraft";
import {
  buildOradsClinicalReasoning,
  type OradsClinicalReasoningResult,
} from "./clinicalReasoning";
import { resolveOradsAssistContext, type OradsAssistContext, type ResolveOradsAssistContextInput } from "./resolveOradsAssistContext";
import { mapExtractedToHints, parseOradsProtocolText, type OradsHintsResult } from "../extractedToHints";
import type { OradsProtocolDraftSource } from "./types";

export type OradsAssistPipelineResult = OradsHintsResult & {
  context: OradsAssistContext;
  clinicalReasoning: OradsClinicalReasoningResult;
  protocolDraft: string;
  protocolDraftSource: OradsProtocolDraftSource;
};

/** Local rule-first pipeline — category always from calculateOradsResult inside mapExtractedToHints. */
export function runOradsAssistPipeline(
  text: string,
  contextInput: Omit<ResolveOradsAssistContextInput, "textMenopause" | "textAgeYears">,
): OradsAssistPipelineResult {
  const trimmed = text.trim();
  const parsed = parseOradsProtocolText(trimmed);
  const context = resolveOradsAssistContext({
    ...contextInput,
    textMenopause: parsed.menopause,
    textAgeYears: parsed.ageYears,
  });

  parsed.menopause = context.menopause;
  if (context.ageYears !== undefined) parsed.ageYears = context.ageYears;

  const mapped = mapExtractedToHints(parsed);
  const clinicalReasoning = buildOradsClinicalReasoning(parsed, context, mapped);
  const protocolDraft = buildOradsProtocolDraft(trimmed, parsed);

  return {
    ...mapped,
    context,
    clinicalReasoning,
    protocolDraft,
    protocolDraftSource: "local",
  };
}

export type { OradsAssistContext, ResolveOradsAssistContextInput };
