/**
 * MI Orchestrator — thin coordinator. It decides *which* existing component runs next and
 * which gate stops the request. It contains no clinical math, no provider calls of its own,
 * no retrieval logic, and no persistence.
 */
import {
  defaultFeatureRegistry,
  isPendingReview,
  validateObservations,
  type AdapterIssue,
  type FeatureRegistry,
  type MorphologyObservation,
} from "@repo/morphology-core";
import type { ExtractionGuards, MorphologyExtractionResult } from "@repo/morphology-core/extraction";

import {
  MI_DISCLAIMER,
  type ClassificationSection,
  type EngineReadiness,
  type EvidenceSection,
  type MedicalIntelligenceRequest,
  type MedicalIntelligenceResult,
  type MiEngineId,
  type MiIssue,
  type MiStatus,
  type MiWorkflowState,
  type ReviewDecision,
  type ReviewGateSummary,
} from "./contracts";
import { buildEvidenceSection, type EvidenceRunResult } from "./evidence";
import { applyReviewDecisions, needsPhysicianReview } from "./review-gate";
import { ENGINE_ROUTES, isSupportedEngine } from "./routing";
import { createWorkflowTrace, type WorkflowTrace } from "./state-machine";

export const MI_LIMITS = {
  maxTextChars: 8000,
  minQuestionChars: 3,
  maxQuestionChars: 800,
  maxObservations: 300,
  maxDecisions: 300,
} as const;

/** Injected bindings. Web binds them to the existing gateway / extraction / evidence stack. */
export type MiDependencies = {
  /** Existing platform guards (`detectPhi`, `detectPromptInjection`). Required. */
  guards: ExtractionGuards;
  /** Existing Phase B runner (it also applies guards + quota before the provider). */
  extractText?: (input: { text: string; requestId: string }) => Promise<MorphologyExtractionResult>;
  /** Existing evidence chain: searchEvidenceUnified → synthesis → postValidateEvidenceAnswer (+ quota). */
  retrieveEvidence?: (input: { query: string; corpusMode?: string; requestId: string }) => Promise<EvidenceRunResult>;
  now?: () => string;
  newRequestId?: () => string;
  registry?: FeatureRegistry;
};

function defaultRequestId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return `mi-${c.randomUUID()}`;
  return `mi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** All free-text-bearing fields that could carry PHI or instructions. */
function collectText(request: MedicalIntelligenceRequest): string {
  const parts: string[] = [];
  if (request.inputType === "free_text") parts.push(request.text);
  if (request.inputType === "clinical_question") parts.push(request.question);
  if (request.inputType === "structured_morphology" || request.inputType === "classification_request") {
    for (const o of request.observations ?? []) {
      if (o?.rawText) parts.push(o.rawText);
      if (o?.value?.kind === "text") parts.push(o.value.text);
      for (const a of o?.alternatives ?? []) if (a.kind === "text") parts.push(a.text);
    }
    for (const d of request.reviewDecisions ?? []) {
      if (d.action === "correct" && d.value?.kind === "text") parts.push(d.value.text);
      if (d.action === "reject" && d.reason) parts.push(d.reason);
    }
  }
  return parts.join("\n");
}

type Ctx = {
  request: MedicalIntelligenceRequest;
  deps: MiDependencies;
  trace: WorkflowTrace;
  result: MedicalIntelligenceResult;
  now: () => string;
};

function addIssue(list: MiIssue[], stage: MiWorkflowState, code: string, message: string, extra: Partial<MiIssue> = {}) {
  list.push({ code, message, stage, ...extra });
}

function finish(ctx: Ctx, status: MiStatus, reason?: string): MedicalIntelligenceResult {
  if (ctx.trace.current !== status) ctx.trace.to(status, reason);
  ctx.result.status = status;
  ctx.result.stateHistory = ctx.trace.history;
  ctx.result.processingMetadata.finishedAt = ctx.now();
  ctx.result.processingMetadata.stages = ctx.trace.history.map((h) => ({ stage: h.state, outcome: h.reason ?? "ok" }));
  // Plain-JSON normalization: in-process callers see exactly what Web / Expo clients receive
  // (engine outputs may contain `undefined` fields).
  return JSON.parse(JSON.stringify(ctx.result)) as MedicalIntelligenceResult;
}

function emptyReview(): ReviewGateSummary {
  return { pending: [], confirmed: [], corrected: [], rejected: [], acceptedAsStated: [], unresolvedContradictions: [], notAssessed: [] };
}

function setProvenance(ctx: Ctx, observations: readonly MorphologyObservation[]) {
  ctx.result.provenance.aiSuggestedObservationIds = observations.filter(needsPhysicianReview).map((o) => o.id);
  ctx.result.provenance.physicianConfirmedObservationIds = observations
    .filter((o) => !isPendingReview(o) && o.status === "confirmed")
    .map((o) => o.id);
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

async function runFreeText(ctx: Ctx, text: string): Promise<MedicalIntelligenceResult> {
  const { deps, trace, result } = ctx;
  if (!deps.extractText) {
    addIssue(result.unresolvedIssues, "validating", "extraction_unavailable", "Text extraction is not configured");
    return finish(ctx, "failed", "extraction_unavailable");
  }
  trace.to("extracting");
  let extraction: MorphologyExtractionResult;
  try {
    result.processingMetadata.providerCalls.extraction += 1;
    extraction = await deps.extractText({ text, requestId: result.requestId });
  } catch {
    addIssue(result.unresolvedIssues, "extracting", "extraction_error", "Extraction failed with a technical error");
    return finish(ctx, "failed", "extraction_error");
  }
  result.extraction = extraction;
  result.modelVersion.extractionModel = extraction.extractionModel.model;
  result.modelVersion.extractionProvider = extraction.extractionModel.provider;
  result.modelVersion.extractionPromptVersion = extraction.promptVersion;

  switch (extraction.validationStatus) {
    case "blocked":
      addIssue(result.unresolvedIssues, "extracting", extraction.blockReason ?? "blocked", "Extraction was blocked by a safety guard or quota");
      return finish(ctx, "blocked", extraction.blockReason ?? "blocked");
    case "provider_error":
      addIssue(result.unresolvedIssues, "extracting", "provider_error", "AI provider unavailable — no medical result was produced");
      return finish(ctx, "failed", "provider_error");
    case "invalid":
      addIssue(result.unresolvedIssues, "extracting", "invalid_model_output", "AI output failed validation — no medical result was produced");
      return finish(ctx, "failed", "invalid_model_output");
  }

  const review = emptyReview();
  for (const o of extraction.observations) {
    review.pending.push(o.id);
    if (o.status === "contradicted") review.unresolvedContradictions.push(o.id);
    if (o.status === "not_assessed") review.notAssessed.push(o.id);
  }
  result.morphology = { observations: extraction.observations, review };
  setProvenance(ctx, extraction.observations);
  for (const u of extraction.unresolvedMentions) {
    addIssue(result.unresolvedIssues, "extracting", `unresolved:${u.reason}`, u.detail, u.proposedFeatureId ? { featureId: u.proposedFeatureId } : {});
  }
  for (const m of extraction.missingInformation) {
    addIssue(result.unresolvedIssues, "extracting", `missing:${m.reason}`, `${m.featureId} — ${m.reason}`, { featureId: m.featureId });
  }
  for (const a of extraction.ambiguities) {
    addIssue(result.warnings, "extracting", `ambiguity:${a.kind}`, a.detail, a.featureId ? { featureId: a.featureId } : {});
  }
  result.classification = {
    engineId: null,
    status: "not_computed",
    abstention: {
      reason: "physician_review_required",
      available: [],
      missing: [],
      needsClarification: extraction.observations.map((o) => o.id),
    },
  };
  if (extraction.observations.length === 0) {
    return finish(ctx, "incomplete", "no_observations_extracted");
  }
  return finish(ctx, "awaiting_physician_review", "ai_observations_pending");
}

function readinessFor(observations: readonly MorphologyObservation[]): EngineReadiness[] {
  const anatomies = new Set(observations.map((o) => o.anatomy));
  const out: EngineReadiness[] = [];
  for (const route of Object.values(ENGINE_ROUTES)) {
    if (!route.anatomies.some((a) => anatomies.has(a))) continue;
    const r = route.toInput(observations.filter((o) => route.anatomies.includes(o.anatomy)), {});
    out.push(
      r.ok
        ? { engineId: route.engineId, ready: true, missing: [], blockingIssues: [] }
        : { engineId: route.engineId, ready: false, missing: r.missing, blockingIssues: r.errors.map((e) => e.code) },
    );
  }
  return out;
}

/** Shared gate for structured inputs. Returns null when the request may continue. */
function reviewGate(
  ctx: Ctx,
  observations: MorphologyObservation[],
  decisions: readonly ReviewDecision[],
  reviewedAt: string,
): { observations: MorphologyObservation[]; summary: ReviewGateSummary } | MedicalIntelligenceResult {
  const { result, deps } = ctx;
  const registry = deps.registry ?? defaultFeatureRegistry;

  const applied = applyReviewDecisions(observations, decisions, reviewedAt, registry);
  if (!applied.ok) {
    result.unresolvedIssues.push(...applied.issues);
    return finish(ctx, "blocked", "invalid_review_decision");
  }
  const contract = validateObservations(applied.observations, registry);
  if (contract.length) {
    for (const v of contract) addIssue(result.unresolvedIssues, "validating", `invalid_observation:${v.code}`, v.message, v.observationId ? { observationId: v.observationId } : {});
    result.morphology = { observations: applied.observations, review: applied.summary };
    return finish(ctx, "blocked", "invalid_observation");
  }
  result.morphology = { observations: applied.observations, review: applied.summary };
  setProvenance(ctx, applied.observations);
  return applied;
}

function stopForReview(ctx: Ctx, scope: readonly MorphologyObservation[]): MedicalIntelligenceResult | null {
  const { result } = ctx;
  const pending = scope.filter(needsPhysicianReview);
  const contradicted = scope.filter((o) => o.status === "contradicted");
  if (!pending.length && !contradicted.length) return null;
  for (const o of pending) {
    addIssue(result.unresolvedIssues, "validating", "pending_physician_review", `${o.feature} (${o.status}) requires explicit physician action`, {
      observationId: o.id,
      featureId: o.feature,
    });
  }
  for (const o of contradicted) {
    addIssue(result.unresolvedIssues, "validating", "unresolved_contradiction", `${o.feature} is contradicted — physician must resolve; no alternative is chosen automatically`, {
      observationId: o.id,
      featureId: o.feature,
    });
  }
  result.classification = {
    engineId: ctx.request.inputType === "classification_request" ? ctx.request.engineId : null,
    status: "not_computed",
    abstention: {
      reason: contradicted.length ? "unresolved_contradiction" : "physician_review_required",
      available: scope.filter((o) => !needsPhysicianReview(o) && o.status !== "contradicted").map((o) => o.feature),
      missing: [],
      needsClarification: [...pending, ...contradicted].map((o) => o.feature),
    },
  };
  return finish(ctx, "awaiting_physician_review", contradicted.length ? "unresolved_contradiction" : "pending_physician_review");
}

async function runStructured(
  ctx: Ctx,
  request: Extract<MedicalIntelligenceRequest, { inputType: "structured_morphology" }>,
): Promise<MedicalIntelligenceResult> {
  const gated = reviewGate(ctx, request.observations, request.reviewDecisions ?? [], request.reviewedAt ?? ctx.now());
  if ("status" in gated) return gated;
  const stop = stopForReview(ctx, gated.observations);
  if (stop) return stop;
  ctx.trace.to("ready_for_classification");
  ctx.result.classification = { engineId: null, status: "not_requested", readiness: readinessFor(gated.observations) };
  return finish(ctx, "completed", "morphology_validated");
}

const PHYSICIAN_RESOLUTION_CODES = new Set(["contradicted", "laterality_conflict", "inconsistent_features", "conflicting_values"]);

async function runClassification(
  ctx: Ctx,
  request: Extract<MedicalIntelligenceRequest, { inputType: "classification_request" }>,
): Promise<MedicalIntelligenceResult> {
  const { result, trace } = ctx;
  const engineId = request.engineId as MiEngineId;
  const route = ENGINE_ROUTES[engineId];

  const gated = reviewGate(ctx, request.observations, request.reviewDecisions ?? [], request.reviewedAt ?? ctx.now());
  if ("status" in gated) return gated;

  const scope = gated.observations.filter(
    (o) => route.anatomies.includes(o.anatomy) && (!request.subjectId || o.subjectId === request.subjectId),
  );
  const stop = stopForReview(ctx, scope);
  if (stop) return stop;

  if (!scope.length) {
    addIssue(result.unresolvedIssues, "validating", "no_observations_for_engine", `No observations in scope of ${route.label}`);
    result.classification = { engineId, status: "not_computed", abstention: { reason: "no_observations_for_engine", available: [], missing: [], needsClarification: [] } };
    return finish(ctx, "incomplete", "no_observations_for_engine");
  }

  trace.to("ready_for_classification");
  trace.to("classifying");

  // Strict conversion: confirmed only, no allowPartial — there is no partial-result path in Phase C.
  const converted = route.toInput(scope, { clinicalContext: request.clinicalContext, subjectId: request.subjectId });
  if (!converted.ok) {
    const adapterIssues: AdapterIssue[] = [...converted.errors, ...converted.warnings];
    const needsPhysician = converted.errors.some((e) => PHYSICIAN_RESOLUTION_CODES.has(e.code));
    const invalid = converted.errors.some((e) => e.code === "invalid_observation");
    for (const e of converted.errors) addIssue(result.unresolvedIssues, "classifying", `adapter:${e.code}`, e.message, e.featureId ? { featureId: e.featureId } : {});
    for (const m of converted.missing) addIssue(result.unresolvedIssues, "classifying", "missing_required", `${m} is required by ${route.label}`, { featureId: m });
    result.classification = {
      engineId,
      status: "not_computed",
      adapterIssues,
      abstention: {
        reason: invalid ? "invalid_observation" : needsPhysician ? "physician_resolution_required" : "insufficient_data",
        available: [...new Set(scope.map((o) => o.feature))],
        missing: converted.missing,
        needsClarification: converted.errors.filter((e) => e.featureId).map((e) => e.featureId!),
      },
    };
    if (invalid) return finish(ctx, "blocked", "invalid_observation");
    if (needsPhysician) return finish(ctx, "awaiting_physician_review", "physician_resolution_required");
    return finish(ctx, "incomplete", "insufficient_data");
  }

  let execution;
  try {
    execution = route.execute(converted.input);
  } catch {
    addIssue(result.unresolvedIssues, "classifying", "engine_error", `${route.label} failed with a technical error — no category produced`);
    result.classification = { engineId, status: "not_computed", engineInput: converted.input };
    return finish(ctx, "failed", "engine_error");
  }
  result.modelVersion.engineVersion = execution.engineVersion;
  result.provenance.classificationEngine = engineId;

  if (!execution.ok) {
    addIssue(result.unresolvedIssues, "classifying", "engine_abstained", execution.reason);
    result.classification = {
      engineId,
      status: "not_computed",
      engineVersion: execution.engineVersion,
      engineInput: converted.input,
      abstention: { reason: "engine_abstained", available: [...new Set(scope.map((o) => o.feature))], missing: [], needsClarification: [] },
    };
    return finish(ctx, "incomplete", "engine_abstained");
  }

  const classification: ClassificationSection = {
    engineId,
    status: "computed",
    engineVersion: execution.engineVersion,
    sourceLabel: execution.sourceLabel,
    engineInput: converted.input,
    engineResult: execution.result,
    categoryLabel: execution.categoryLabel,
    usedObservationIds: converted.usedObservationIds,
    adapterIssues: converted.warnings,
    disclaimer: execution.disclaimer,
  };
  result.classification = classification;
  for (const w of converted.warnings) addIssue(result.warnings, "classifying", `adapter:${w.code}`, w.message, w.featureId ? { featureId: w.featureId } : {});

  if (!request.includeEvidence) return finish(ctx, "completed", "classified");

  trace.to("retrieving_evidence");
  const query = route.evidenceQuery(execution.categoryLabel);
  const { section, blocked } = await fetchEvidence(ctx, query, undefined);
  result.evidence = section;
  if (section.status === "failed") {
    addIssue(
      result.warnings,
      "retrieving_evidence",
      blocked ? "evidence_blocked" : "evidence_failed",
      blocked
        ? "Evidence not retrieved (quota / policy) — classification is unaffected; no sources are shown"
        : "Evidence retrieval failed — classification is unaffected; no sources are shown",
    );
  }
  return finish(ctx, "completed", section.status === "failed" ? "classified_evidence_failed" : "classified_with_evidence");
}

async function fetchEvidence(
  ctx: Ctx,
  query: string,
  corpusMode: string | undefined,
): Promise<{ section: EvidenceSection; blocked: boolean }> {
  const { deps, result } = ctx;
  if (!deps.retrieveEvidence) {
    return { section: buildEvidenceSection(query, corpusMode, { ok: false, error: "evidence_unavailable" }), blocked: false };
  }
  try {
    result.processingMetadata.providerCalls.evidence += 1;
    const run = await deps.retrieveEvidence({ query, corpusMode, requestId: result.requestId });
    const section = buildEvidenceSection(query, corpusMode, run);
    result.modelVersion.evidenceSynthesisMode = section.synthesisMode;
    result.provenance.evidenceProviders = Object.entries(section.providerStatuses ?? {})
      .filter(([, s]) => s === "ok")
      .map(([p]) => p);
    return { section, blocked: !run.ok && run.blocked === true };
  } catch {
    return { section: buildEvidenceSection(query, corpusMode, { ok: false, error: "evidence_retrieval_error" }), blocked: false };
  }
}

async function runQuestion(ctx: Ctx, request: Extract<MedicalIntelligenceRequest, { inputType: "clinical_question" }>) {
  ctx.trace.to("retrieving_evidence");
  const { section, blocked } = await fetchEvidence(ctx, request.question.trim(), request.corpusMode);
  ctx.result.evidence = section;
  if (blocked) {
    addIssue(ctx.result.unresolvedIssues, "retrieving_evidence", section.error ?? "evidence_blocked", "Evidence request refused by policy (quota)");
    return finish(ctx, "blocked", section.error ?? "evidence_blocked");
  }
  if (section.status === "failed") {
    addIssue(ctx.result.unresolvedIssues, "retrieving_evidence", "evidence_failed", section.error ?? "Evidence retrieval failed");
    return finish(ctx, "failed", "evidence_failed");
  }
  return finish(ctx, "completed", section.status === "insufficient" ? "evidence_insufficient" : "evidence_found");
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export async function runMedicalIntelligence(
  request: MedicalIntelligenceRequest,
  deps: MiDependencies,
): Promise<MedicalIntelligenceResult> {
  const now = deps.now ?? (() => new Date().toISOString());
  const requestId = (typeof request?.requestId === "string" && request.requestId.trim()) || (deps.newRequestId ?? defaultRequestId)();
  const startedAt = now();
  const trace = createWorkflowTrace(now);
  const inputType = request?.inputType;
  const result: MedicalIntelligenceResult = {
    requestId,
    status: "failed",
    inputType,
    stateHistory: trace.history,
    extraction: null,
    morphology: null,
    classification: null,
    evidence: null,
    warnings: [],
    unresolvedIssues: [],
    provenance: { aiSuggestedObservationIds: [], physicianConfirmedObservationIds: [], classificationEngine: null, evidenceProviders: [] },
    modelVersion: {},
    processingMetadata: { startedAt, finishedAt: startedAt, stages: [], providerCalls: { extraction: 0, evidence: 0 }, idempotentReplay: false },
    disclaimer: MI_DISCLAIMER,
  };
  const ctx: Ctx = { request, deps, trace, result, now };

  try {
    trace.to("validating");

    // --- input validation (structural; API route additionally uses Zod) ---
    const invalid = (code: string, message: string) => {
      addIssue(result.unresolvedIssues, "validating", code, message);
      return finish(ctx, "blocked", "invalid_request");
    };
    switch (inputType) {
      case "free_text":
        if (typeof request.text !== "string" || !request.text.trim()) return invalid("empty_text", "Text is empty");
        if (request.text.length > MI_LIMITS.maxTextChars) return invalid("text_too_long", `Text exceeds ${MI_LIMITS.maxTextChars} characters`);
        break;
      case "clinical_question": {
        const q = typeof request.question === "string" ? request.question.trim() : "";
        if (q.length < MI_LIMITS.minQuestionChars || q.length > MI_LIMITS.maxQuestionChars) {
          return invalid("question_length", `Question must be ${MI_LIMITS.minQuestionChars}–${MI_LIMITS.maxQuestionChars} characters`);
        }
        break;
      }
      case "structured_morphology":
      case "classification_request":
        if (!Array.isArray(request.observations)) return invalid("observations_required", "observations[] is required");
        if (request.observations.length > MI_LIMITS.maxObservations) return invalid("too_many_observations", "Too many observations");
        if ((request.reviewDecisions?.length ?? 0) > MI_LIMITS.maxDecisions) return invalid("too_many_decisions", "Too many review decisions");
        if (request.inputType === "classification_request" && !isSupportedEngine(request.engineId)) {
          addIssue(result.unresolvedIssues, "validating", "unsupported_classification", `Engine "${String(request.engineId)}" is not integrated in the MI Orchestrator`);
          result.classification = {
            engineId: String(request.engineId),
            status: "not_computed",
            abstention: { reason: "unsupported_classification", available: [], missing: [], needsClarification: [] },
          };
          return finish(ctx, "blocked", "unsupported_classification");
        }
        break;
      default:
        return invalid("unknown_input_type", "Unsupported inputType");
    }

    // --- PHI / prompt injection on every text-bearing field, before any provider ---
    const text = collectText(request);
    if (text) {
      const phi = deps.guards.detectPhi(text);
      if (!phi.ok) {
        addIssue(result.unresolvedIssues, "validating", "phi_detected", `Personal data detected (${phi.reasons.join(", ")}) — remove it and retry`);
        return finish(ctx, "blocked", "phi_detected");
      }
      const injection = deps.guards.detectPromptInjection(text);
      if (!injection.ok) {
        addIssue(result.unresolvedIssues, "validating", "prompt_injection", "Instruction-like content detected in clinical input");
        return finish(ctx, "blocked", "prompt_injection");
      }
    }

    switch (request.inputType) {
      case "free_text":
        return await runFreeText(ctx, request.text);
      case "structured_morphology":
        return await runStructured(ctx, request);
      case "classification_request":
        return await runClassification(ctx, request);
      case "clinical_question":
        return await runQuestion(ctx, request);
    }
  } catch {
    addIssue(result.unresolvedIssues, trace.current, "internal_error", "Internal orchestration error — no medical result was produced");
    if (!trace.isTerminal()) {
      try {
        return finish(ctx, "failed", "internal_error");
      } catch {
        /* fall through */
      }
    }
    result.status = "failed";
    return result;
  }
  return finish(ctx, "failed", "unreachable");
}
