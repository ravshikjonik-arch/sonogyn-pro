import { FMF_ADDITIONAL_EVIDENCE } from "./fmf-additions";
import { US_FMF_CORE_EVIDENCE } from "./fmf-core";

/** Полный корпус FMF / УЗИ (P0). */
export const US_FMF_EVIDENCE = [...US_FMF_CORE_EVIDENCE, ...FMF_ADDITIONAL_EVIDENCE];

export const FMF_TOPIC_COUNT = US_FMF_EVIDENCE.length;
