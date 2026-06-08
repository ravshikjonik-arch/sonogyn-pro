/**
 * Future hook for server-side IDEA / endometriosis AI scoring.
 *
 * ```ts
 * // const { run, status, result } = useAIAssessment();
 * // await run(examinationPayload);
 * ```
 *
 * Intentionally not wired — keeps bundle free of experimental calls until
 * a validated microservice exists (signed payloads, audit trail, IRB as applicable).
 */
export type UseAIAssessmentPlaceholder = {
  enabled: false;
};

export function useAIAssessmentPlaceholder(): UseAIAssessmentPlaceholder {
  return { enabled: false };
}
