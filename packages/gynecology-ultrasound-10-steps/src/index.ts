import { GYN_US_10_SCHEMA_VERSION, type ProtocolDraftState } from "./types";

export {
  GYNECOLOGY_ULTRASOUND_10_STEPS_MODULE,
  getOrderedSteps,
  getStepById,
} from "./module";
export { evaluateVolumeFormula, formatNumber } from "./compute";
export { renderProtocolText, stepCompletionHint } from "./render-protocol-text";
export {
  GYN_US_10_TOOL_ID,
  ProtocolDraftStateSchema,
  UpsertGynUs10DraftBodySchema,
  type UpsertGynUs10DraftBody,
} from "./schemas";
export {
  GYN_US_10_SCHEMA_VERSION,
  GYN_US_10_STORAGE_KEY,
  SOURCE_CLINICAL_VALIDATION_REQUIRED,
  type GynecologyUltrasound10Module,
  type ProtocolDraftState,
  type ProtocolStepDefinition,
  type RepeatableItemState,
  type StepState,
} from "./types";

export function createEmptyDraftState(): ProtocolDraftState {
  return {
    schemaVersion: GYN_US_10_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    steps: {},
  };
}
