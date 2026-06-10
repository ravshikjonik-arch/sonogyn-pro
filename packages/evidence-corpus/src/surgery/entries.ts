import { SURGERY_ADDITIONAL_EVIDENCE } from "./surgery-additions";
import { SURGERY_CORE_EVIDENCE } from "./surgery-core";

export const SURGERY_EVIDENCE = [...SURGERY_CORE_EVIDENCE, ...SURGERY_ADDITIONAL_EVIDENCE];

export const SURGERY_TOPIC_COUNT = SURGERY_EVIDENCE.length;
