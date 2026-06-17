export type { CompartmentKey, PopQInput, PopQPointKey, PopQStageKey } from "./types";

export {
  parsePopQField,
  computePopQStage,
  stageLabel,
  leadingCompartment,
  leadingPointKey,
  compartmentLabel,
  buildProtocolLine,
} from "./compute";

export { buildClinicalProtocolText, buildPatientReportText } from "./reports";

export {
  NORMAL_ANATOMY,
  POINT_HINTS,
  POPQ_PRESETS,
  POPQ_VALUE_OPTIONS,
  POPQ_VALUE_OPTIONS_BY_POINT,
  inputToFieldStrings,
  type PopQPreset,
} from "./constants";

export {
  POP_Q_CALCULATOR_HREF,
  PROLAPSE_ASSISTANT_HREF,
  PROLAPSE_CASES_HREF,
  buildPopQCaseTitle,
  isProlapseNosologyCode,
  isProlapseTeachingCase,
} from "./integration";

export {
  POPQ_STAGE_RULES_RU,
  pointLabelRu,
  stageDescriptionRu,
  parsePopQValues,
  calculatePopQResult,
  buildPopQResultSummary,
  type PopQStageResult,
} from "./staging";
