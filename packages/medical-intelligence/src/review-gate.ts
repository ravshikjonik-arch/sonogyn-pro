import {
  acceptObservationStatus,
  confirmObservation,
  defaultFeatureRegistry,
  hasPayload,
  isPendingReview,
  validateObservation,
  type FeatureRegistry,
  type MorphologyObservation,
} from "@repo/morphology-core";

import type { MiIssue, ReviewDecision, ReviewGateSummary } from "./contracts";

export type ReviewApplication =
  | { ok: true; observations: MorphologyObservation[]; summary: ReviewGateSummary }
  | { ok: false; issues: MiIssue[] };

/** Awaiting physician action: AI-sourced without confirmation, or any unaccepted `suggested`. */
export function needsPhysicianReview(o: MorphologyObservation): boolean {
  return isPendingReview(o) || o.status === "suggested";
}

const issue = (code: string, message: string, observationId?: string): MiIssue => ({
  code,
  message,
  stage: "validating",
  ...(observationId ? { observationId } : {}),
});

/**
 * Applies explicit physician decisions. Every decision must reference an existing observation;
 * there is no implicit confirmation, no automatic choice among alternatives, and not_assessed
 * can only be accepted as stated — never converted into a value.
 */
export function applyReviewDecisions(
  observations: readonly MorphologyObservation[],
  decisions: readonly ReviewDecision[],
  at: string,
  registry: FeatureRegistry = defaultFeatureRegistry,
): ReviewApplication {
  const byId = new Map(observations.map((o) => [o.id, o]));
  const issues: MiIssue[] = [];
  const seen = new Set<string>();
  const summary: ReviewGateSummary = {
    pending: [],
    confirmed: [],
    corrected: [],
    rejected: [],
    acceptedAsStated: [],
    unresolvedContradictions: [],
    notAssessed: [],
  };

  for (const d of decisions) {
    const o = byId.get(d.observationId);
    if (!o) {
      issues.push(issue("unknown_observation", "Review decision references an unknown observation", d.observationId));
      continue;
    }
    if (seen.has(d.observationId)) {
      issues.push(issue("duplicate_decision", "More than one decision for the same observation", d.observationId));
      continue;
    }
    seen.add(d.observationId);

    try {
      switch (d.action) {
        case "confirm": {
          if (o.status === "contradicted") {
            issues.push(issue("contradiction_requires_resolution", "Contradicted observation: use choose_alternative or correct", o.id));
            break;
          }
          if (o.status === "not_assessed" || o.status === "not_applicable") {
            issues.push(issue("status_not_confirmable", "not_assessed / not_applicable: use accept_status — it is not a value", o.id));
            break;
          }
          if (!hasPayload(o)) {
            issues.push(issue("nothing_to_confirm", "Observation has no value to confirm", o.id));
            break;
          }
          byId.set(o.id, confirmObservation(o, at));
          summary.confirmed.push(o.id);
          break;
        }
        case "correct": {
          const patch = { value: d.value ?? null, measurement: d.measurement ?? null, unit: d.unit ?? null };
          const after = confirmObservation(o, at, patch);
          byId.set(o.id, after);
          summary.corrected.push({ observationId: o.id, before: o, after });
          break;
        }
        case "reject":
          byId.delete(o.id);
          summary.rejected.push({ observationId: o.id, ...(d.reason ? { reason: d.reason } : {}) });
          break;
        case "accept_status":
          byId.set(o.id, acceptObservationStatus(o, at));
          summary.acceptedAsStated.push(o.id);
          break;
        case "choose_alternative": {
          if (o.status !== "contradicted" || !o.alternatives?.length) {
            issues.push(issue("not_contradicted", "choose_alternative applies only to contradicted observations", o.id));
            break;
          }
          const alt = o.alternatives[d.alternativeIndex];
          if (!alt) {
            issues.push(issue("alternative_out_of_range", "alternativeIndex is out of range", o.id));
            break;
          }
          const after: MorphologyObservation =
            alt.kind === "not_assessed"
              ? { ...o, status: "not_assessed", value: null, measurement: null, unit: null, alternatives: null, confirmation: { by: "physician", at } }
              : alt.kind === "quantity"
                ? confirmObservation(o, at, { value: null, measurement: alt.value, unit: alt.unit })
                : confirmObservation(o, at, { value: alt, measurement: null, unit: null });
          byId.set(o.id, after);
          summary.corrected.push({ observationId: o.id, before: o, after });
          break;
        }
      }
    } catch (e) {
      issues.push(issue("invalid_decision", e instanceof Error ? e.message : "Review decision could not be applied", o.id));
    }
  }

  const result = [...byId.values()];
  for (const o of result) {
    if (!seen.has(o.id)) continue;
    for (const v of validateObservation(o, registry)) {
      issues.push(issue("invalid_after_review", v.message, o.id));
    }
  }
  if (issues.length) return { ok: false, issues };

  for (const o of result) {
    if (needsPhysicianReview(o)) summary.pending.push(o.id);
    else if (o.status === "confirmed" && !summary.confirmed.includes(o.id) && !summary.corrected.some((c) => c.observationId === o.id)) {
      summary.confirmed.push(o.id);
    }
    if (o.status === "contradicted") summary.unresolvedContradictions.push(o.id);
    if (o.status === "not_assessed") summary.notAssessed.push(o.id);
  }
  return { ok: true, observations: result, summary };
}
