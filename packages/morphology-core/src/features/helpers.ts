import type { AllowedValue } from "../types";

export const v = (code: string, label: string, synonyms?: string[]): AllowedValue =>
  synonyms ? { code, label, synonyms } : { code, label };

export const DEFINITION_VERSION_V1 = "1.0.0";
