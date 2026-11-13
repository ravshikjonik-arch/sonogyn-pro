export * from "./types";
export * from "./registry";
export * from "./observation";
export * from "./features";

export type {
  AcceptedStatus,
  AdapterIssue,
  AdapterIssueCode,
  FromEngineOptions,
  FromEngineResult,
  ToEngineFailure,
  ToEngineOptions,
  ToEngineResult,
  ToEngineSuccess,
} from "./adapters/types";
export type { AdapterSpec, FieldMapping } from "./adapters/mapping";

export {
  ORADS_DIMENSION_FEATURES,
  ORADS_MUST_STATE_FEATURES,
  ORADS_US_PRO_SPEC,
  fromOradsProInput,
  toOradsProInput,
  type OradsClinicalContext,
} from "./adapters/orads-us";
export { BIRADS_US_SPEC, fromBiradsUsInput, toBiradsUsInput } from "./adapters/birads-us";
export { TIRADS_ACR_SPEC, fromTiradsAcrInput, toTiradsAcrInput } from "./adapters/tirads-acr";
export {
  MUSA_ADENOMYOSIS_SPEC,
  fromMusaAdenomyosisInput,
  toMusaAdenomyosisInput,
} from "./adapters/musa-adenomyosis";
