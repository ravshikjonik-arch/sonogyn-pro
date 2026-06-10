import { OBGYN_ADDITIONAL_EVIDENCE } from "./obgyn-additions";
import { OBGYN_CORE_EVIDENCE } from "./obgyn-core";

/** Полка «Акушерство и гинекология». */
export const OBGYN_EVIDENCE = [...OBGYN_CORE_EVIDENCE, ...OBGYN_ADDITIONAL_EVIDENCE];

export const OBGYN_TOPIC_COUNT = OBGYN_EVIDENCE.length;
