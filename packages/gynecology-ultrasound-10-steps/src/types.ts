export const GYN_US_10_SCHEMA_VERSION = "1.0.0-source-extraction" as const;

export const GYN_US_10_STORAGE_KEY = "sonogyn:gynecology-ultrasound-10-steps:v1";

/** sourceClinicalValidationRequired — см. implementationRules в JSON. */
export const SOURCE_CLINICAL_VALIDATION_REQUIRED = true;

export type RepeatableItemState = {
  id: string;
  values: Record<string, unknown>;
};

export type StepState = Record<string, unknown>;

export type ProtocolDraftState = {
  schemaVersion: typeof GYN_US_10_SCHEMA_VERSION;
  updatedAt: string;
  steps: Record<string, StepState>;
};

export type ProtocolStepDefinition = {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  sourcePages?: number[];
  type?: string;
  instances?: { id: string; label: string }[];
  fields?: unknown[];
  sourceNote?: string;
};

export type GynecologyUltrasound10Module = {
  moduleId: string;
  version: string;
  locale: string;
  title: string;
  source: Record<string, unknown>;
  implementationRules: string[];
  steps: ProtocolStepDefinition[];
  missingFromSource: string[];
};
