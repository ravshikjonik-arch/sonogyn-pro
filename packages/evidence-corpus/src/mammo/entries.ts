import { MAMMO_ADDITIONAL_EVIDENCE } from "./mammo-additions";
import { MAMMO_CORE_EVIDENCE } from "./mammo-core";

export const MAMMO_EVIDENCE = [...MAMMO_CORE_EVIDENCE, ...MAMMO_ADDITIONAL_EVIDENCE];

export const MAMMO_TOPIC_COUNT = MAMMO_EVIDENCE.length;
