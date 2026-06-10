import { ONCO_ADDITIONAL_EVIDENCE } from "./onco-additions";
import { ONCO_CORE_EVIDENCE } from "./onco-core";

export const ONCO_EVIDENCE = [...ONCO_CORE_EVIDENCE, ...ONCO_ADDITIONAL_EVIDENCE];

export const ONCO_TOPIC_COUNT = ONCO_EVIDENCE.length;
